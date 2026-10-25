export class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    preload() {
        this.load.image('background', 'assets/space.png');
    }

    create() {
        this.add.image(640, 360, 'background').setDisplaySize(1280, 720);

        // Заголовок
        this.add.text(640, 60, 'НАСТРОЙКИ', {
            fontSize: '56px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        // ============================================================
        // БЛОК 1: УПРАВЛЕНИЕ
        // ============================================================
        this.add.text(640, 140, 'Способ управления:', {
            fontSize: '30px', color: '#dddddd', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.controlMode = this.registry.get('controlMode')
            || localStorage.getItem('controlMode')
            || 'mouse';

        // Кнопка "КЛАВИАТУРА"
        this.keyboardBtn = this.add.text(430, 210, '⌨ КЛАВИАТУРА', {
            fontSize: '26px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 22, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.keyboardBtn.on('pointerover', () => {
            if (this.controlMode !== 'keyboard') this.keyboardBtn.setBackgroundColor('#666666');
        });
        this.keyboardBtn.on('pointerout', () => {
            if (this.controlMode !== 'keyboard') this.keyboardBtn.setBackgroundColor('#444444');
        });
        this.keyboardBtn.on('pointerdown', () => this.setMode('keyboard'));

        // Кнопка "МЫШЬ / СЕНСОР"
        this.mouseBtn = this.add.text(850, 210, '🖱 МЫШЬ / СЕНСОР', {
            fontSize: '26px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 22, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.mouseBtn.on('pointerover', () => {
            if (this.controlMode !== 'mouse') this.mouseBtn.setBackgroundColor('#666666');
        });
        this.mouseBtn.on('pointerout', () => {
            if (this.controlMode !== 'mouse') this.mouseBtn.setBackgroundColor('#444444');
        });
        this.mouseBtn.on('pointerdown', () => this.setMode('mouse'));

        this.highlightCurrent();

        // ============================================================
        // БЛОК 2: ГРОМКОСТЬ МУЗЫКИ (5 квадратиков)
        // ============================================================
        this.add.text(640, 330, 'Громкость музыки:', {
            fontSize: '30px', color: '#dddddd', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.musicVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0.5');
        this.musicVolume = Math.max(0, Math.min(1, this.musicVolume));

        this.volumeButtons = [];
        const volumeSteps = [0, 0.25, 0.5, 0.75, 1.0];
        const volumeLabels = ['0%', '25%', '50%', '75%', '100%'];

        volumeSteps.forEach((step, i) => {
            const x = 380 + i * 130;
            const y = 400;

            const bg = this.add.rectangle(x, y, 100, 60, 0x444444)
                .setInteractive({ useHandCursor: true });

            const label = this.add.text(x, y, volumeLabels[i], {
                fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            bg.on('pointerover', () => {
                if (Math.abs(this.musicVolume - step) > 0.01) bg.setFillStyle(0x666666);
            });
            bg.on('pointerout', () => {
                if (Math.abs(this.musicVolume - step) > 0.01) bg.setFillStyle(0x444444);
            });
            bg.on('pointerdown', () => this.setVolume(step));

            this.volumeButtons.push({ bg, label, step });
        });

        this.highlightVolume();

        // ============================================================
        // КНОПКА "НАЗАД"
        // ============================================================
        const backBtn = this.add.text(640, 620, 'НАЗАД', {
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

    setVolume(step) {
        this.musicVolume = step;
        localStorage.setItem('musicVolume', String(step));

        // Применяем громкость к музыке, если она играет
        const bgMusic = this.sound.get('bgMusic');
        if (bgMusic) {
            if (step > 0) {
                if (!bgMusic.isPlaying) bgMusic.play();
                bgMusic.setVolume(step);
            } else {
                if (bgMusic.isPlaying) bgMusic.pause();
                bgMusic.setVolume(0);
            }
        }

        this.highlightVolume();
    }

    highlightVolume() {
        this.volumeButtons.forEach(v => {
            if (Math.abs(v.step - this.musicVolume) < 0.01) {
                v.bg.setFillStyle(0x44aa44);
            } else {
                v.bg.setFillStyle(0x444444);
            }
        });
    }
}
