import { ExtensionType } from '../../../../extensions/Extensions';
import { VideoSource } from '../../../../rendering/renderers/shared/texture/sources/VideoSource';
import { detectVideoAlphaMode } from '../../../../utils/browser/detectVideoAlphaMode';
import { getResolutionOfUrl } from '../../../../utils/network/getResolutionOfUrl';
import { checkDataUrl } from '../../../utils/checkDataUrl';
import { checkExtension } from '../../../utils/checkExtension';
import { crossOrigin } from '../../../utils/crossOrigin';
import { createTexture } from './utils/createTexture';

import type { VideoSourceOptions } from '../../../../rendering/renderers/shared/texture/sources/VideoSource';
import type { Texture } from '../../../../rendering/renderers/shared/texture/Texture';
import type { ResolvedAsset } from '../../../types';
import type { Loader } from '../../Loader';
import type { LoaderParser } from '../LoaderParser';

const validVideoExtensions = ['.mp4', '.m4v', '.webm', '.ogg', '.ogv', '.h264', '.avi', '.mov'];
const validVideoMIMEs = validVideoExtensions.map((ext) => `video/${ext.substring(1)}`);

/**
 * Preload a video element
 * @param element - Video element to preload
 */
export function preloadVideo(element: HTMLVideoElement): Promise<void>
{
    return new Promise((resolve, reject) =>
    {
        element.addEventListener('canplaythrough', loaded);
        element.addEventListener('error', error);

        element.load();

        function loaded(): void
        {
            cleanup();
            resolve();
        }

        function error(err: ErrorEvent): void
        {
            cleanup();
            reject(err);
        }

        function cleanup(): void
        {
            element.removeEventListener('canplaythrough', loaded);
            element.removeEventListener('error', error);
        }
    });
}

/**
 * A simple plugin to video textures
 *
 * This will be added automatically if `pixi.js/assets` is imported
 *
 * You can pass VideoSource options to the loader via the .data property of the asset descriptor
 * when using Asset.load().
 * ```js
 * // Set the data
 * const texture = await Assets.load({
 *     src: './assets/city.mp4',
 *     data: {
 *         preload: true,
 *         autoPlay: true,
 *     },
 * });
 * ```
 * @memberof assets
 */
export const loadVideoTextures = {

    name: 'loadVideo',

    extension: {
        type: ExtensionType.LoadParser,
    },

    config: null,

    test(url: string): boolean
    {
        const isValidDataUrl = checkDataUrl(url, validVideoMIMEs);
        const isValidExtension = checkExtension(url, validVideoExtensions);

        return isValidDataUrl || isValidExtension;
    },

    async load(url: string, asset: ResolvedAsset<VideoSourceOptions>, loader: Loader): Promise<Texture>
    {
        // --- Merge default and provided options ---
        const options: VideoSourceOptions = {
            ...VideoSource.defaultOptions,
            resolution: asset.data?.resolution || getResolutionOfUrl(url),
            alphaMode: asset.data?.alphaMode || await detectVideoAlphaMode(),
            ...asset.data,
        };

        // --- Create and configure HTMLVideoElement ---
        const videoElement = document.createElement('video');

        // Set attributes based on options
        const attributeMap = {
            preload: options.autoLoad !== false ? 'auto' : undefined,
            'webkit-playsinline': options.playsinline !== false ? '' : undefined,
            playsinline: options.playsinline !== false ? '' : undefined,
            muted: options.muted === true ? '' : undefined,
            loop: options.loop === true ? '' : undefined,
            autoplay: options.autoPlay !== false ? '' : undefined
        };

        Object.keys(attributeMap).forEach((key) =>
        {
            const value = attributeMap[key as keyof typeof attributeMap];

            if (value !== undefined) videoElement.setAttribute(key, value);
        });

        if (options.muted === true)
        {
            videoElement.muted = true;
        }

        crossOrigin(videoElement, url, options.crossorigin);

        // --- Set up source and MIME type ---
        const sourceElement = document.createElement('source');

        // Determine MIME type
        let mime: string | undefined;

        if (url.startsWith('data:'))
        {
            mime = url.slice(5, url.indexOf(';'));
        }
        else if (!url.startsWith('blob:'))
        {
            const ext = url.split('?')[0].slice(url.lastIndexOf('.') + 1).toLowerCase();

            mime = VideoSource.MIME_TYPES[ext] || `video/${ext}`;
        }

        sourceElement.src = url;

        if (mime)
        {
            sourceElement.type = mime;
        }

        videoElement.appendChild(sourceElement);

        // --- Create texture ---
        const base = new VideoSource({ ...options, resource: videoElement });

        if (asset.data.preload)
        {
            await preloadVideo(videoElement);
        }

        return createTexture(base, loader, url);
    },

    unload(texture: Texture): void
    {
        texture.destroy(true);
    }
} as LoaderParser<Texture, VideoSourceOptions, null>;
