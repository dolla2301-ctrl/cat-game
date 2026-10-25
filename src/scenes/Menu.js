export class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    preload() {
        for (let i = 1; i <= 4; i++) {
            this.load.image('jacket' + i, `assets/jackets/jacket${i}.png`);
        }
        for (let i = 1; i <= 11; i++) {
            this.load.image('hat' + i, `assets/hats/hat${i}.png`);
        }
        for (let i = 1; i <= 10; i++) {
            this.load.image('hand' + i, `assets/hands/hand${i}.png`);
        }
        this.load.image('background', 'assets/space.png');
        this.load.image('space2', 'assets/space2.png');
        this.load.image('ava', 'assets/ava.png');

        this.load.audio('bgMusic', 'assets/music/tetris.mp3');
        this.load.audio('bgMusic2', 'assets/music/tetris2.mp3');
    }

    create() {
        this.musicVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0.5');
        this.musicVolume = Math.max(0, Math.min(1, this.musicVolume));

        const useSpace2 = this.registry.get('useSpace2')
            ?? (localStorage.getItem('useSpace2') === 'true');

        // Цвета, зависящие от hat11
        this.donateColor = useSpace2 ? '#aa0000' : '#aa8800';
        this.donateColorHover = useSpace2 ? '#cc2222' : '#ccaa22';
        this.volumeActiveColor = useSpace2 ? 0xaa0000 : 0x44aa44;
        const socialColor = useSpace2 ? 0xaa0000 : 0x3a6ea5;
        const socialColorHover = useSpace2 ? 0xcc2222 : 0x4a8ec5;

        const musicKey = (useSpace2 && this.textures.exists('space2')) ? 'bgMusic2' : 'bgMusic';

        if (this.sound.get('bgMusic') && this.sound.get('bgMusic').isPlaying && musicKey !== 'bgMusic') {
            this.sound.get('bgMusic').stop();
        }
        if (this.sound.get('bgMusic2') && this.sound.get('bgMusic2').isPlaying && musicKey !== 'bgMusic2') {
            this.sound.get('bgMusic2').stop();
        }

        if (!this.sound.get(musicKey) || !this.sound.get(musicKey).isPlaying) {
            if (!this.sound.get(musicKey)) {
                this.bgMusic = this.sound.add(musicKey, {
                    loop: true,
                    volume: this.musicVolume
                });
            } else {
                this.bgMusic = this.sound.get(musicKey);
                this.bgMusic.setVolume(this.musicVolume);
            }
            if (this.musicVolume > 0) this.bgMusic.play();
        } else {
            this.bgMusic = this.sound.get(musicKey);
            this.bgMusic.setVolume(this.musicVolume);
        }

        this.input.once('pointerdown', () => {
            if (this.bgMusic && !this.bgMusic.isPlaying && this.musicVolume > 0) {
                this.bgMusic.play();
            }
        });

        // --- ФОН ---
        const bgKey = (useSpace2 && this.textures.exists('space2')) ? 'space2' : 'background';
        this.add.image(640, 360, bgKey).setDisplaySize(1280, 720);

        // Тряска в меню, если пришли с hat11 (мягкая)
        if (useSpace2) {
            this.cameras.main.shake(400, 0.015);
        }

        // --- МЕТЕЛЬ (только на space2) ---
        this.snowflakes = [];
        if (bgKey === 'space2') {
            if (!this.textures.exists('snowflake')) {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                g.fillStyle(0xffffff, 1);
                g.fillCircle(4, 4, 4);
                g.generateTexture('snowflake', 8, 8);
                g.destroy();
            }

            for (let i = 0; i < 150; i++) {
                const flake = this.add.image(
                    Phaser.Math.Between(-100, 1280),
                    Phaser.Math.Between(-100, 720),
                    'snowflake'
                )
                .setDepth(1)
                .setAlpha(Phaser.Math.FloatBetween(0.3, 0.9))
                .setScale(Phaser.Math.FloatBetween(0.5, 1.8));

                flake.fallSpeed = Phaser.Math.FloatBetween(150, 350);
                flake.windSpeed = Phaser.Math.FloatBetween(80, 200);
                flake.swaySpeed = Phaser.Math.FloatBetween(2, 4);
                flake.swayAmount = Phaser.Math.FloatBetween(5, 15);
                flake.time = Phaser.Math.FloatBetween(0, Math.PI * 2);

                this.snowflakes.push(flake);
            }
        }

        // --- ЗАГОЛОВОК ---
        const titleText = useSpace2 ? 'МОЩЬ ДОБРЯЧКОВ' : 'ДОБРЯЧКИ';

        if (useSpace2) {
            this.add.rectangle(640, 60, 448, 63, 0xaa0000, 1)
                .setStrokeStyle(4, 0xff3333);

            this.add.text(640, 60, titleText, {
                fontSize: '39px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0.5);
        } else {
            this.add.text(640, 60, titleText, {
                fontSize: '39px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0.5);
        }

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

        const donateBtn = this.add.text(640, 460, 'ДОНАТ АВТОРУ', {
            fontSize: '28px', color: '#ffffff', backgroundColor: this.donateColor,
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        donateBtn.on('pointerover', () => donateBtn.setBackgroundColor(this.donateColorHover));
        donateBtn.on('pointerout', () => donateBtn.setBackgroundColor(this.donateColor));
        donateBtn.on('pointerup', () => {
            window.location.href = 'https://www.donationalerts.com/r/donutdobrychki';
        });

        this.createButton(640, 520, 'ОДЕЖДА', () => this.scene.start('Wardrobe'));
        this.createButton(640, 580, 'СЧЁТ', () => this.scene.start('Scores'));

        // --- БЛОК 1 (СЛЕВА): АВАТАРКА + СОЦСЕТИ ---
        const btnW = 80;
        const btnH = 60;
        const gap = 10;
        const totalW = btnW * 2 + gap;
        const blockLeft = 100;
        const blockCenterX = blockLeft + totalW / 2;

        this.add.image(blockCenterX, 535, 'ava').setDisplaySize(104, 104);

        this.add.rectangle(blockCenterX, 615, totalW, 36, 0x000000, 0.55);
        this.add.text(blockCenterX, 615, 'Соц сети:', {
            fontSize: '22px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        const vkX = blockLeft + btnW / 2;
        const vkY = 670;
        const vkBg = this.add.rectangle(vkX, vkY, btnW, btnH, socialColor)
            .setInteractive({ useHandCursor: true });
        this.add.text(vkX, vkY, 'ВК', {
            fontSize: '26px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        vkBg.on('pointerover', () => vkBg.setFillStyle(socialColorHover));
        vkBg.on('pointerout', () => vkBg.setFillStyle(socialColor));
        vkBg.on('pointerup', () => {
            window.location.href = 'https://vk.ru/m4a34';
        });

        const tgX = blockLeft + btnW + gap + btnW / 2;
        const tgY = 670;
        const tgBg = this.add.rectangle(tgX, tgY, btnW, btnH, socialColor)
            .setInteractive({ useHandCursor: true });
        this.add.text(tgX, tgY, 'TG', {
            fontSize: '26px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        tgBg.on('pointerover', () => tgBg.setFillStyle(socialColorHover));
        tgBg.on('pointerout', () => tgBg.setFillStyle(socialColor));
        tgBg.on('pointerup', () => {
            window.location.href = 'https://t.me/m4a34';
        });

        // --- БЛОК 2 (СПРАВА): ГРОМКОСТЬ ---
        const volBtnW = 40;
        const volBtnH = 54;
        const volGap = 7;
        const volTotalW = volBtnW * 5 + volGap * 4;

        const rightBlockLeft = 1280 - blockLeft - volTotalW;
        const rightBlockCenterX = rightBlockLeft + volTotalW / 2;

        this.add.rectangle(rightBlockCenterX, 615, volTotalW, 40, 0x000000, 0.55);
        this.add.text(rightBlockCenterX, 615, 'Громкость:', {
            fontSize: '26px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.volumeButtons = [];
        const volumeSteps = [0, 0.25, 0.5, 0.75, 1.0];
        const volumeLabels = ['0', '25', '50', '75', '100'];

        volumeSteps.forEach((step, i) => {
            const x = rightBlockLeft + i * (volBtnW + volGap) + volBtnW / 2;
            const y = 670;

            const bg = this.add.rectangle(x, y, volBtnW, volBtnH, 0x444444)
                .setInteractive({ useHandCursor: true });

            const label = this.add.text(x, y, volumeLabels[i], {
                fontSize: '18px', color: '#ffffff', fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            bg.on('pointerover', () => {
                if (Math.abs(this.musicVolume - step) > 0.01) bg.setFillStyle(0x666666);
            });
            bg.on('pointerout', () => {
                if (Math.abs(this.musicVolume - step) > 0.01) bg.setFillStyle(0x444444);
            });
            bg.on('pointerdown', () => this.setMenuVolume(step));

            this.volumeButtons.push({ bg, label, step });
        });

        this.highlightMenuVolume();
    }

    update() {
        if (!this.snowflakes || this.snowflakes.length === 0) return;

        const delta = this.game.loop.delta / 1000;

        this.snowflakes.forEach(flake => {
            flake.y += flake.fallSpeed * delta;
            flake.x += flake.windSpeed * delta;

            flake.time += flake.swaySpeed * delta;
            flake.y += Math.sin(flake.time) * flake.swayAmount * delta;

            if (flake.y > 740 || flake.x > 1300) {
                flake.y = Phaser.Math.Between(-100, -20);
                flake.x = Phaser.Math.Between(-100, 200);
                flake.alpha = Phaser.Math.FloatBetween(0.3, 0.9);
            }
        });
    }

    setMenuVolume(step) {
        this.musicVolume = step;
        localStorage.setItem('musicVolume', String(step));

        if (this.bgMusic) {
            if (step > 0) {
                if (!this.bgMusic.isPlaying) this.bgMusic.play();
                this.bgMusic.setVolume(step);
            } else {
                if (this.bgMusic.isPlaying) this.bgMusic.pause();
                this.bgMusic.setVolume(0);
            }
        }

        this.highlightMenuVolume();
    }

    highlightMenuVolume() {
        this.volumeButtons.forEach(v => {
            if (Math.abs(v.step - this.musicVolume) < 0.01) {
                v.bg.setFillStyle(this.volumeActiveColor);
            } else {
                v.bg.setFillStyle(0x444444);
            }
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
