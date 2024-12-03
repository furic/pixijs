import { DisplacementFilter } from '../DisplacementFilter';
import { Texture } from '~/rendering/renderers/shared/texture/Texture';
import { Sprite } from '~/scene/sprite/Sprite';

describe('DisplacementFilter', () =>
{
    it('should construct filter', () =>
    {
        const sprite = new Sprite(Texture.WHITE);
        const filter = new DisplacementFilter({
            sprite,
            scale: { x: 8, y: 10 },
        });

        expect(filter).toBeInstanceOf(DisplacementFilter);
        expect(filter.scale.x).toEqual(8);
        expect(filter.scale.y).toEqual(10);
        filter.destroy();
    });
});
