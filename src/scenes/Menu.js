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

        // --- МУЗЫКА ---
        this.load.audio('bgMusic', 'assets/music/tetris.mp3');
    }

    create() {
        // --- МУЗЫКА В МЕНЮ ---
        this.musicVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0.5');
        this.musicVolume = Math.max(0, Math.min(1, this.musicVolume));

        if (!this.sound.get('bgMusic') || !this.sound.get('bgMusic').isPlaying) {
            if (!this.sound.get('bgMusic')) {
                this.bgMusic = this.sound.add('bgMusic', {
                    loop: true,
                    volume: this.musicVolume
                });
            } else {
                this.bgMusic = this.sound.get('bgMusic');
                this.bgMusic.setVolume(this.musicVolume);
            }
            if (this.musicVolume > 0) this.bgMusic.play();
        } else {
            this.bgMusic = this.sound.get('bgMusic');
            this.bgMusic.setVolume(this.musicVolume);
        }

        // Разблокировка звука на iOS/Safari
        this.input.once('pointerdown', () => {
            if (this.bgMusic && !this.bgMusic.isPlaying && this.musicVolume > 0) {
                this.bgMusic.play();
            }
        });

        // Фон
        this.add.image(640, 360, 'background').setDisplaySize(1280, 720);

        // Заголовок
        this.add.text(640, 60, 'ДОБРЯЧКИ', {
            fontSize: '56px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        // --- КОТ В МЕНЮ ---
        let equipped = this.registry.get('equipped') || { jacket: 'jacket1', hat: 'hat1', hand: 'hand1' };

        this.previewBody = this.add.image(700, 225, equipped.jacket).setDepth(0);
        this.previewHat  = this.add.image(700, 225, equipped.hat).setDepth(1);
        this.previewHand = this.add.image(700, 225, equipped.hand).setDepth(2);

        const scale = 1.3;
        this.previewBody.setScale(scale);
        this.previewHat.setScale(scale);
        this.previewHand.setScale(scale);

        // --- КНОПКИ ---
        this.createButton(640, 400, 'НАЧАТЬ ИГРУ', () => this.scene.start('Start'));

        // Кнопка «ДОНАТ АВТОРУ» — золотая
        const donateBtn = this.add.text(640, 460, 'ДОНАТ АВТОРУ', {
            fontSize: '28px', color: '#ffffff', backgroundColor: '#aa8800',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        donateBtn.on('pointerover', () => donateBtn.setBackgroundColor('#ccaa22'));
        donateBtn.on('pointerout', () => donateBtn.setBackgroundColor('#aa8800'));
        donateBtn.on('pointerup', () => {
            window.location.href = 'https://www.donationalerts.com/r/donutdobrychki';
        });

        this.createButton(640, 520, 'НАСТРОЙКИ', () => this.scene.start('Settings'));
        this.createButton(640, 580, 'ОДЕЖДА', () => this.scene.start('Wardrobe'));
        this.createButton(640, 640, 'СЧЁТ', () => this.scene.start('Scores'));

        // ============================================================
        // СОЦСЕТИ (слева, на уровне кнопки «СЧЁТ»)
        // Все элементы — прямоугольники фиксированного размера,
        // поэтому края плашки и квадратов совпадают ТОЧНО.
        // ============================================================

        // Размеры
        const btnW = 80;     // ширина квадратика
        const btnH = 60;     // высота квадратика
        const gap = 10;      // зазор между ВК и TG
        const totalW = btnW * 2 + gap;   // 170 — общая ширина блока
        const blockLeft = 100;           // левый край блока
        const blockCenterX = blockLeft + totalW / 2;  // 185

        // Плашка «Соц сети:» — ровно по ширине блока
        this.add.rectangle(blockCenterX, 615, totalW, 36, 0x000000, 0.55);
        this.add.text(blockCenterX, 615, 'Соц сети:', {
            fontSize: '22px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // --- ВК ---
        const vkX = blockLeft + btnW / 2;   // 140
        const vkY = 670;
        const vkBg = this.add.rectangle(vkX, vkY, btnW, btnH, 0x3a6ea5)
            .setInteractive({ useHandCursor: true });
        this.add.text(vkX, vkY, 'ВК', {
            fontSize: '26px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        vkBg.on('pointerover', () => vkBg.setFillStyle(0x4a8ec5));
        vkBg.on('pointerout', () => vkBg.setFillStyle(0x3a6ea5));
        vkBg.on('pointerup', () => {
            window.location.href = 'https://vk.ru/m4a34';
        });

        // --- TG ---
        const tgX = blockLeft + btnW + gap + btnW / 2;   // 230
        const tgY = 670;
        const tgBg = this.add.rectangle(tgX, tgY, btnW, btnH, 0x3a6ea5)
            .setInteractive({ useHandCursor: true });
        this.add.text(tgX, tgY, 'TG', {
            fontSize: '26px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        tgBg.on('pointerover', () => tgBg.setFillStyle(0x4a8ec5));
        tgBg.on('pointerout', () => tgBg.setFillStyle(0x3a6ea5));
        tgBg.on('pointerup', () => {
            window.location.href = 'https://t.me/m4a34';
        });
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
