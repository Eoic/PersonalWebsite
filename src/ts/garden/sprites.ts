import { Species, Stage, SpritePart } from './types';

export const SPRITES: Record<Species, Record<Stage, SpritePart[]>> = {
    daisy: {
        seed: [{ x: 7, y: 11, width: 2 }, { x: 8, y: 12, opacity: 0.5 }],
        sprout: [
            { x: 8, y: 13, height: 2 },
            { x: 7, y: 11, opacity: 0.7 },
            { x: 9, y: 11, opacity: 0.7 },
            { x: 8, y: 10 }
        ],
        bud: [
            { x: 8, y: 10, height: 5 },
            { x: 7, y: 12, opacity: 0.5 },
            { x: 7, y: 8, width: 3, height: 2 },
            { x: 8, y: 7 }
        ],
        bloom: [
            { x: 8, y: 11, height: 4 },
            { x: 6, y: 13, width: 2, opacity: 0.55 },
            { x: 8, y: 4 },
            { x: 8, y: 9 },
            { x: 5, y: 6 },
            { x: 11, y: 6 },
            { x: 4, y: 8 },
            { x: 12, y: 8 },
            { x: 5, y: 10 },
            { x: 11, y: 10 },
            { x: 7, y: 5, width: 3, height: 4, opacity: 0.18 },
            { x: 6, y: 6, height: 2, opacity: 0.3 },
            { x: 10, y: 6, height: 2, opacity: 0.3 },
            { x: 7, y: 4, width: 2, opacity: 0.3 },
            { x: 7, y: 9, width: 2, opacity: 0.3 },
            { x: 8, y: 6, height: 2 },
            { x: 7, y: 7, width: 3 }
        ],
        wilt: [
            { x: 7, y: 11, height: 4, opacity: 0.8 },
            { x: 6, y: 10, width: 2, opacity: 0.8 },
            { x: 5, y: 9, width: 2, opacity: 0.5 },
            { x: 4, y: 10, opacity: 0.3 },
            { x: 6, y: 12, opacity: 0.4 }
        ],
    },
    tulip: {
        seed: [{ x: 7, y: 12, width: 2 }, { x: 6, y: 11, opacity: 0.5 }],
        sprout: [
            { x: 8, y: 13, height: 2 },
            { x: 8, y: 11 },
            { x: 7, y: 10, opacity: 0.6 },
            { x: 9, y: 10, opacity: 0.6 }
        ],
        bud: [
            { x: 8, y: 10, height: 5 },
            { x: 7, y: 13, opacity: 0.5 },
            { x: 9, y: 11, opacity: 0.5 },
            { x: 8, y: 7, height: 3 },
            { x: 9, y: 8 }
        ],
        bloom: [
            { x: 8, y: 9, height: 6 },
            { x: 9, y: 12, width: 2, opacity: 0.55 },
            { x: 6, y: 11, width: 2, opacity: 0.55 },
            { x: 6, y: 6, height: 3 },
            { x: 10, y: 6, height: 3 },
            { x: 8, y: 5, height: 4 },
            { x: 7, y: 6, height: 2 },
            { x: 9, y: 6, height: 2 },
            { x: 6, y: 5 },
            { x: 10, y: 5 },
            { x: 7, y: 4, width: 2 },
            { x: 7, y: 7, opacity: 0.35 },
            { x: 9, y: 7, opacity: 0.35 },
            { x: 8, y: 8, opacity: 0.2 }
        ],
        wilt: [
            { x: 8, y: 12, height: 3, opacity: 0.8 },
            { x: 9, y: 14, opacity: 0.5 },
            { x: 8, y: 10, width: 2, height: 2, opacity: 0.7 },
            { x: 10, y: 11, opacity: 0.4 },
            { x: 7, y: 11, opacity: 0.4 }
        ],
    },
    poppy: {
        seed: [{ x: 7, y: 11, width: 2 }, { x: 8, y: 12, opacity: 0.5 }],
        sprout: [
            { x: 8, y: 13, height: 2 },
            { x: 8, y: 11 },
            { x: 7, y: 10, opacity: 0.6 },
            { x: 9, y: 10, opacity: 0.6 }
        ],
        bud: [
            { x: 8, y: 10, height: 5 },
            { x: 8, y: 8, height: 2 },
            { x: 7, y: 7, width: 3 },
            { x: 8, y: 6, opacity: 0.6 }
        ],
        bloom: [
            { x: 8, y: 8, height: 7 },
            { x: 6, y: 12, width: 2, opacity: 0.55 },
            { x: 9, y: 10, width: 2, opacity: 0.55 },
            { x: 8, y: 3, height: 3 },
            { x: 7, y: 4 },
            { x: 9, y: 4 },
            { x: 4, y: 6, width: 2 },
            { x: 10, y: 6, width: 2 },
            { x: 5, y: 5 },
            { x: 10, y: 5 },
            { x: 5, y: 7 },
            { x: 10, y: 7 },
            { x: 6, y: 5, width: 4, height: 3, opacity: 0.22 },
            { x: 7, y: 6, width: 3, height: 2 },
            { x: 8, y: 5 },
            { x: 7, y: 5, opacity: 0.5 },
            { x: 9, y: 5, opacity: 0.5 }
        ],
        wilt: [
            { x: 8, y: 11, height: 4, opacity: 0.8 },
            { x: 7, y: 9, width: 3, opacity: 0.5 },
            { x: 6, y: 10, opacity: 0.35 },
            { x: 10, y: 10, opacity: 0.35 },
            { x: 9, y: 12, opacity: 0.4 }
        ],
    },
    fern: {
        seed: [{ x: 7, y: 12, width: 2 }, { x: 6, y: 11, opacity: 0.5 }],
        sprout: [
            { x: 8, y: 13, height: 2 },
            { x: 7, y: 11, opacity: 0.7 },
            { x: 9, y: 11, opacity: 0.7 },
            { x: 8, y: 10 }
        ],
        bud: [
            { x: 8, y: 10, height: 5 },
            { x: 7, y: 12, opacity: 0.5 },
            { x: 9, y: 13, opacity: 0.5 },
            { x: 7, y: 8, width: 3, height: 2 },
            { x: 6, y: 9, opacity: 0.6 },
            { x: 10, y: 9, opacity: 0.6 }
        ],
        bloom: [
            { x: 8, y: 10, height: 5 },
            { x: 6, y: 13, width: 2, opacity: 0.55 },
            { x: 9, y: 11, width: 2, opacity: 0.55 },
            { x: 8, y: 3, height: 2 },
            { x: 8, y: 9 },
            { x: 3, y: 7, width: 2 },
            { x: 11, y: 7, width: 2 },
            { x: 5, y: 4 },
            { x: 10, y: 4 },
            { x: 5, y: 10 },
            { x: 10, y: 10 },
            { x: 4, y: 5 },
            { x: 11, y: 5 },
            { x: 4, y: 9, opacity: 0.7 },
            { x: 11, y: 9, opacity: 0.7 },
            { x: 7, y: 6, width: 3, height: 3, opacity: 0.25 },
            { x: 7, y: 7, width: 3 },
            { x: 8, y: 6, height: 3 }
        ],
        wilt: [
            { x: 8, y: 12, height: 3, opacity: 0.8 },
            { x: 6, y: 9, width: 5, opacity: 0.5 },
            { x: 5, y: 10, opacity: 0.3 },
            { x: 11, y: 10, opacity: 0.3 },
            { x: 7, y: 11, width: 3, opacity: 0.4 }
        ],
    },
};
