import { Menu } from './scenes/Menu.js';
import { Wardrobe } from './scenes/Wardrobe.js';
import { Start } from './scenes/Start.js';
import { Scores } from './scenes/Scores.js';
import { Settings } from './scenes/Settings.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [Menu, Wardrobe, Start, Scores, Settings]
};

new Phaser.Game(config);
