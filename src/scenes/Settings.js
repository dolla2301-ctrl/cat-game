export class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    preload() {
        this.load.image('background', 'assets/space.png');
        this.load.image('space2', 'assets/space2.png');

        this.load.audio('bgMusic', 'assets/music/tetris.mp3');
        this.load.audio('bgMusic2', 'assets/music/tetris2.mp3');
    }

    create() {
        // Флаг hat11
        const useSpace2 = this.registry.get('useSpace2')
            ?? (localStorage.getItem('useSpace2') === 'true');

        // Фон: space2 при hat11
        const bgKey = (useSpace2 && this.textures.exists('space2')) ? 'space2' : 'background';
        this.add.image(640, 360, bgKey).setDisplaySize(1280, 720);

        // Цвета выбранных кнопок: красный при hat11, зелёный иначе
        this.activeColor = useSpace2 ? 0xaa0000 : 0x44aa44;
        this.activeColorHex = useSpace2 ? '#aa0000' : '#44aa44';

        // Ключ музыки: tetris2 при hat11, tetris иначе
        this.musicKey = (useSpace2 && this.cache.audio.exists('bgMusic2')) ? 'bgMusic2' : 'bgMusic';

        // Заголовок
        this.add.text(640, 50, 'НАСТРОЙКИ', {
            fontSize: '56px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
            backgroundColor: '#00000088', padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // ============================================================
        // БЛОК 1: УПРАВЛЕНИЕ
        // ============================================================
        this.add.text(640, 130, 'Способ управления:', {
            fontSize: '28px', color: '#ffffff', fontFamily: 'Arial',
            backgroundColor: '#00000088', padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        this.controlMode = this.registry.get('controlMode')
            || localStorage.getItem('controlMode')
            || 'mouse';

        this.keyboardBtn = this.add.text(430, 190, '⌨ КЛАВИАТУРА', {
            fontSize: '24px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.keyboardBtn.on('pointerover', () => {
            if (this.controlMode !== 'keyboard') this.keyboardBtn.setBackgroundColor('#666666');
        });
        this.keyboardBtn.on('pointerout', () => {
            if (this.controlMode !== 'keyboard') this.keyboardBtn.setBackgroundColor('#444444');
        });
        this.keyboardBtn.on('pointerdown', () => this.setMode('keyboard'));

        this.mouseBtn = this.add.text(850, 190, '🖱 МЫШЬ / СЕНСОР', {
            fontSize: '24px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
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
        // БЛОК 2: ГРОМКОСТЬ (квадратики меньше на 30%)
        // ============================================================
        this.add.text(640, 260, 'Громкость музыки:', {
            fontSize: '28px', color: '#ffffff', fontFamily: 'Arial',
            backgroundColor: '#00000088', padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        this.musicVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0.5');
        this.musicVolume = Math.max(0, Math.min(1, this.musicVolume));

        this.volumeButtons = [];
        const volumeSteps = [0, 0.25, 0.5, 0.75, 1.0];
        const volumeLabels = ['0%', '25%', '50%', '75%', '100%'];

        volumeSteps.forEach((step, i) => {
            const x = 430 + i * 105;
            const y = 320;

            const bg = this.add.rectangle(x, y, 70, 35, 0x444444)
                .setInteractive({ useHandCursor: true });

            const label = this.add.text(x, y, volumeLabels[i], {
                fontSize: '16px', color: '#ffffff', fontFamily: 'Arial',
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
        // БЛОК 3: ЭКРАН (крупные кнопки)
        // ============================================================
        this.add.text(640, 400, 'Режим экрана:', {
            fontSize: '28px', color: '#ffffff', fontFamily: 'Arial',
            backgroundColor: '#00000088', padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        this.screenMode = localStorage.getItem('screenMode') || 'FIT';

        this.fitBtn = this.add.text(430, 470, 'СТАНДАРТ', {
            fontSize: '26px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 22, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.fitBtn.on('pointerover', () => {
            if (this.screenMode !== 'FIT') this.fitBtn.setBackgroundColor('#666666');
        });
        this.fitBtn.on('pointerout', () => {
            if (this.screenMode !== 'FIT') this.fitBtn.setBackgroundColor('#444444');
        });
        this.fitBtn.on('pointerdown', () => this.setScreenMode('FIT'));

        this.envelopBtn = this.add.text(850, 470, 'РАСТЯНУТЬ', {
            fontSize: '26px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 22, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.envelopBtn.on('pointerover', () => {
            if (this.screenMode !== 'ENVELOP') this.envelopBtn.setBackgroundColor('#666666');
        });
        this.envelopBtn.on('pointerout', () => {
            if (this.screenMode !== 'ENVELOP') this.envelopBtn.setBackgroundColor('#444444');
        });
        this.envelopBtn.on('pointerdown', () => this.setScreenMode('ENVELOP'));

        this.highlightScreenMode();

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
            this.keyboardBtn.setBackgroundColor(this.activeColorHex);
            this.mouseBtn.setBackgroundColor('#444444');
        } else {
            this.keyboardBtn.setBackgroundColor('#444444');
            this.mouseBtn.setBackgroundColor(this.activeColorHex);
        }
    }

    setVolume(step) {
        this.musicVolume = step;
        localStorage.setItem('musicVolume', String(step));

        // Применяем к нужной музыке (tetris2 при hat11, tetris иначе)
        const bgMusic = this.sound.get(this.musicKey);
        if (bgMusic) {
            if (step > 0) {
                if (!bgMusic.isPlaying) bgMusic.play();
                bgMusic.setVolume(step);
            } else {
                if (bgMusic.isPlaying) bgMusic.pause();
                bgMusic.setVolume(0);
            }
        }

        // На всякий случай применяем и к другой, чтобы не было рассинхрона
        const otherKey = this.musicKey === 'bgMusic2' ? 'bgMusic' : 'bgMusic2';
        const otherMusic = this.sound.get(otherKey);
        if (otherMusic) {
            otherMusic.setVolume(step);
        }

        this.highlightVolume();
    }

    highlightVolume() {
        this.volumeButtons.forEach(v => {
            if (Math.abs(v.step - this.musicVolume) < 0.01) {
                v.bg.setFillStyle(this.activeColor);
            } else {
                v.bg.setFillStyle(0x444444);
            }
        });
    }

    setScreenMode(mode) {
        this.screenMode = mode;
        localStorage.setItem('screenMode', mode);

        if (mode === 'ENVELOP') {
            this.scale.scaleMode = Phaser.Scale.ENVELOP;
        } else {
            this.scale.scaleMode = Phaser.Scale.FIT;
        }
        this.scale.refresh();

        this.highlightScreenMode();
    }

    highlightScreenMode() {
        if (this.screenMode === 'FIT') {
            this.fitBtn.setBackgroundColor(this.activeColorHex);
            this.envelopBtn.setBackgroundColor('#444444');
        } else {
            this.fitBtn.setBackgroundColor('#444444');
            this.envelopBtn.setBackgroundColor(this.activeColorHex);
        }
    }
}
