export class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    preload() {
        this.load.image('background', 'assets/space.png');
    }

    create() {
        this.add.image(640, 360, 'background').setDisplaySize(1280, 720);

        this.add.text(640, 80, 'Управление', {
            fontSize: '48px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Читаем текущий выбор (по умолчанию — клавиатура)
        this.controlMode = this.registry.get('controlMode')
            || localStorage.getItem('controlMode')
            || 'mouse';

        this.add.text(640, 220, 'Способ управления:', {
            fontSize: '32px', color: '#dddddd', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Кнопка "КЛАВИАТУРА"
        this.keyboardBtn = this.add.text(480, 340, '⌨ КЛАВИАТУРА', {
            fontSize: '28px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 25, y: 15 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.keyboardBtn.on('pointerover', () => {
            if (this.controlMode !== 'keyboard') this.keyboardBtn.setBackgroundColor('#666666');
        });
        this.keyboardBtn.on('pointerout', () => {
            if (this.controlMode !== 'keyboard') this.keyboardBtn.setBackgroundColor('#444444');
        });
        this.keyboardBtn.on('pointerdown', () => this.setMode('keyboard'));

        // Кнопка "МЫШЬ / СЕНСОР"
        this.mouseBtn = this.add.text(800, 340, '🖱 МЫШЬ / СЕНСОР', {
            fontSize: '28px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 25, y: 15 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.mouseBtn.on('pointerover', () => {
            if (this.controlMode !== 'mouse') this.mouseBtn.setBackgroundColor('#666666');
        });
        this.mouseBtn.on('pointerout', () => {
            if (this.controlMode !== 'mouse') this.mouseBtn.setBackgroundColor('#444444');
        });
        this.mouseBtn.on('pointerdown', () => this.setMode('mouse'));

        // Подсказка
        this.add.text(640, 450,
            'КЛАВИАТУРА: стрелки ←→↑↓\n' +
            'МЫШЬ / СЕНСОР: тап по левой/правой части экрана — прыжок,\nтап по центру сверху — прыжок вверх',
            {
                fontSize: '20px', color: '#aaaaaa', fontFamily: 'Arial',
                align: 'center', lineSpacing: 8
            }
        ).setOrigin(0.5);

        this.highlightCurrent();

        // Кнопка "НАЗАД"
        const backBtn = this.add.text(640, 660, 'НАЗАД', {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#884444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setBackgroundColor('#aa5555'));
        backBtn.on('pointerout', () => backBtn.setBackgroundColor('#884444'));
        backBtn.on('pointerdown', () => this.scene.start('Menu'));

        this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));
    }

    setMode(mode) {
        this.controlMode = mode;
        this.registry.set('controlMode', mode);
        localStorage.setItem('controlMode', mode);
        this.highlightCurrent();
    }

    highlightCurrent() {
        if (this.controlMode === 'keyboard') {
            this.keyboardBtn.setBackgroundColor('#44aa44');
            this.mouseBtn.setBackgroundColor('#444444');
        } else {
            this.keyboardBtn.setBackgroundColor('#444444');
            this.mouseBtn.setBackgroundColor('#44aa44');
        }
    }
}
