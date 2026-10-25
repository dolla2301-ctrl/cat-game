export class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    preload() {
        for (let i = 1; i <= 4; i++) {
            this.load.image('jacket' + i, `assets/jackets/jacket${i}.png`);
        }
        for (let i = 1; i <= 10; i++) {
            this.load.image('hat' + i, `assets/hats/hat${i}.png`);
        }
        for (let i = 1; i <= 10; i++) {
            this.load.image('hand' + i, `assets/hands/hand${i}.png`);
        }
        this.load.image('background', 'assets/space.png');
    }

    create() {
        // Фон
        this.add.image(640, 360, 'background').setDisplaySize(1280, 720);

        // Заголовок
        this.add.text(640, 60, 'Добрячки', {
            fontSize: '56px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        // --- КОТ В МЕНЮ ---
        let equipped = this.registry.get('equipped') || { jacket: 'jacket1', hat: 'hat1', hand: 'hand1' };

        this.previewBody = this.add.image(700, 260, equipped.jacket).setDepth(0);
        this.previewHat  = this.add.image(700, 260, equipped.hat).setDepth(1);
        this.previewHand = this.add.image(700, 260, equipped.hand).setDepth(2);

        const scale = 1.3;
        this.previewBody.setScale(scale);
        this.previewHat.setScale(scale);
        this.previewHand.setScale(scale);

        // --- КНОПКИ ---
        this.createButton(640, 440, 'НАЧАТЬ ИГРУ', () => this.scene.start('Start'));
        this.createButton(640, 510, 'КАСТОМИЗАЦИЯ', () => this.scene.start('Wardrobe'));
        this.createButton(640, 580, 'УПРАВЛЕНИЕ', () => this.scene.start('Settings'));
        this.createButton(640, 650, 'СЧЁТ', () => this.scene.start('Scores'));
    }

    createButton(x, y, text, onClick) {
        const btn = this.add.text(x, y, text, {
            fontSize: '28px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setBackgroundColor('#666666'));
        btn.on('pointerout', () => btn.setBackgroundColor('#444444'));
        btn.on('pointerdown', onClick);
        return btn;
    }
}