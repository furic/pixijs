import { Assets } from '@/assets/Assets';
import { BitmapText } from '@/scene/text-bitmap/BitmapText';

import type { TestScene } from '../../types';
import type { Container } from '@/scene/container/Container';

export const scene: TestScene = {
    it: 'should render bitmap text fill correctly',
    create: async (scene: Container) =>
    {
        await Assets.load('fonts/outfit.woff2');
        const blackBM = new BitmapText({
            text: 'Im fill 0x0',
            style: {
                fontFamily: 'Outfit',
                fill: 0x0
            },
        });

        scene.addChild(blackBM);

        const nullBm = new BitmapText({
            text: 'Im fill null',
            style: {
                fill: null
            },
            y: 30
        });

        scene.addChild(nullBm);

        const undefinedBM = new BitmapText({
            text: 'Im fill undefined',
            style: {
                fontFamily: 'Outfit',
            },
            y: 60,
        });

        scene.addChild(undefinedBM);

        const redBM = new BitmapText({
            text: 'Im fill red',
            style: {
                fontFamily: 'Outfit',
                fill: 'red'
            },
            y: 90,
        });

        scene.addChild(redBM);
    },
};
