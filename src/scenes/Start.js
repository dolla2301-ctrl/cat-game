export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('background', 'assets/space.png');
        this.load.image('space2', 'assets/space2.png');

        for (let i = 1; i <= 4; i++) {
            this.load.image('jacket' + i, `assets/jackets/jacket${i}.png`);
        }
        for (let i = 1; i <= 11; i++) {
            this.load.image('hat' + i, `assets/hats/hat${i}.png`);
        }
        for (let i = 1; i <= 10; i++) {
            this.load.image('hand' + i, `assets/hands/hand${i}.png`);
        }

        this.load.image('health1', 'assets/healts/healts1.png');
        this.load.image('health2', 'assets/healts/healts2.png');
        this.load.image('health3', 'assets/healts/healts3.png');
        this.load.image('health4', 'assets/healts/healts4.png');
        this.load.image('health5', 'assets/healts/healts5.png');
        this.load.image('health6', 'assets/healts/healts6.png');
        this.load.image('health7', 'assets/healts/healts7.png');

        this.load.image('money', 'assets/balls/money.png');
        this.load.image('bomb', 'assets/balls/bomb.png');

        this.load.audio('bgMusic', 'assets/music/tetris.mp3');
        this.load.audio('bgMusic2', 'assets/music/tetris2.mp3');
        this.load.audio('coinSound', 'assets/music/money.mp3');
        this.load.audio('hitSound', 'assets/music/hit.mp3');
    }

    create() {
        this.gameOver = false;
        this.isPaused = false;
        this.isJumping = false;
        this.score = 0;

        this.spawnPositions = [52, 160, 268, 376, 484, 592, 700, 808, 916, 1024, 1132];

        const equipped = this.registry.get('equipped') || {
            jacket: 'jacket1', hat: 'hat1', hand: 'hand1'
        };

        const useSpace2 = this.registry.get('useSpace2')
            ?? (localStorage.getItem('useSpace2') === 'true');

        this.armor = useSpace2 ? 3 : 0;
        this.lives = 3;

        const bgKey = (useSpace2 && this.textures.exists('space2')) ? 'space2' : 'background';
        this.add.image(640, 360, bgKey).setDisplaySize(1280, 720);

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

        if (!this.textures.exists('ball_red')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xff4444, 1);
            g.fillCircle(30, 30, 30);
            g.generateTexture('ball_red', 60, 60);
            g.destroy();
        }
        if (!this.textures.exists('ball_green')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x44ff44, 1);
            g.fillCircle(30, 30, 30);
            g.generateTexture('ball_green', 60, 60);
            g.destroy();
        }

        const body = this.add.image(0, 0, equipped.jacket).setDepth(0);
        const hat = this.add.image(0, 0, equipped.hat).setDepth(1);
        const hand = this.add.image(0, 0, equipped.hand).setDepth(2);

        this.cat = this.add.container(200, 600, [body, hat, hand]);
        this.cat.setScale(0.8);

        const initialHealthKey = useSpace2 ? 'health7' : 'health1';
        this.healthIcon = this.add.image(20, 20, initialHealthKey)
            .setOrigin(0, 0)
            .setDepth(10);

        this.scoreText = this.add.text(20, 136, 'Очки: 0', {
            fontSize: '32px', color: '#ffffff', fontFamily: 'Arial',
            backgroundColor: '#00000088', padding: { x: 10, y: 5 }
        }).setDepth(10);

        this.enemies = this.add.group();
        this.spawnAccumulator = 0;

        this.musicVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0.5');
        this.musicVolume = Math.max(0, Math.min(1, this.musicVolume));

        let musicKey = useSpace2 ? 'bgMusic2' : 'bgMusic';
        if (musicKey === 'bgMusic2' && !this.cache.audio.exists('bgMusic2')) {
            musicKey = 'bgMusic';
        }

        try {
            if (this.sound.get('bgMusic') && this.sound.get('bgMusic').isPlaying && musicKey !== 'bgMusic') {
                this.sound.get('bgMusic').stop();
            }
            if (this.sound.get('bgMusic2') && this.sound.get('bgMusic2').isPlaying && musicKey !== 'bgMusic2') {
                this.sound.get('bgMusic2').stop();
            }

            if (!this.sound.get(musicKey) || !this.sound.get(musicKey).isPlaying) {
                this.bgMusic = this.sound.add(musicKey, {
                    loop: true,
                    volume: this.musicVolume
                });
                if (this.musicVolume > 0) this.bgMusic.play();
            } else {
                this.bgMusic = this.sound.get(musicKey);
                this.bgMusic.setVolume(this.musicVolume);
            }
        } catch (e) {
            console.warn('Музыка не загрузилась, игра работает без неё');
            this.bgMusic = null;
        }

        if (!this.sound.get('coinSound')) {
            this.coinSound = this.sound.add('coinSound', { volume: this.musicVolume });
        } else {
            this.coinSound = this.sound.get('coinSound');
        }

        if (!this.sound.get('hitSound')) {
            this.hitSound = this.sound.add('hitSound', { volume: this.musicVolume });
        } else {
            this.hitSound = this.sound.get('hitSound');
        }

        this.input.once('pointerdown', () => {
            if (this.bgMusic && !this.bgMusic.isPlaying && this.musicVolume > 0) {
                this.bgMusic.play();
            }
        });

        this.controlMode = this.registry.get('controlMode')
            || localStorage.getItem('controlMode')
            || 'mouse';

        this.bindControls();

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.gameOver) return;
            if (this.isPaused) this.resumeGame();
            else this.openPauseMenu();
        });

        this.pauseBtn = this.add.text(1240, 20, 'МЕНЮ', {
            fontSize: '36px', color: '#ffcc00', backgroundColor: '#00000088',
            padding: { x: 18, y: 8 }
        })
        .setOrigin(1, 0)
        .setDepth(10)
        .setInteractive({ useHandCursor: true });

        this.pauseBtn.on('pointerover', () => this.pauseBtn.setBackgroundColor('#444444'));
        this.pauseBtn.on('pointerout', () => this.pauseBtn.setBackgroundColor('#00000088'));
        this.pauseBtn.on('pointerdown', () => {
            if (this.gameOver || this.isPaused) return;
            this.openPauseMenu();
        });
    }

    bindControls() {
        this.input.keyboard.off('keydown-LEFT');
        this.input.keyboard.off('keydown-RIGHT');
        this.input.off('pointerdown');

        if (this.controlMode === 'keyboard') {
            this.input.keyboard.on('keydown-LEFT', () => this.tryJump(-108));
            this.input.keyboard.on('keydown-RIGHT', () => this.tryJump(108));
        } else {
            this.input.on('pointerdown', (pointer) => {
                if (this.gameOver || this.isPaused) return;
                if (pointer.x > 1100 && pointer.y < 80) return;

                if (pointer.x < 640) this.tryJump(-108);
                else this.tryJump(108);
            });
        }
    }

    tryJump(distanceX) {
        if (this.gameOver || this.isPaused) return;
        if (this.isJumping) return;

        const newX = this.cat.x + distanceX;
        if (newX < 50 || newX > 1230) return;

        this.isJumping = true;
        const startY = this.cat.y;
        const jumpHeight = 100;
        const duration = 250;

        this.tweens.add({
            targets: this.cat,
            x: newX,
            duration: duration,
            ease: 'Linear',
            onComplete: () => { this.isJumping = false; }
        });

        this.tweens.add({
            targets: this.cat,
            y: startY - jumpHeight,
            duration: duration / 2,
            ease: 'Quad.easeOut',
            yoyo: true,
            onComplete: () => { this.cat.y = startY; }
        });
    }

    getBallSpeedFactor() {
        return Math.max(0.25, 1 - this.score * 0.01);
    }

    getSpawnInterval() {
        const multiplier = Math.pow(2, Math.floor(this.score / 20));
        return Math.max(40, 600 / multiplier);
    }

    spawnEnemy() {
        if (this.gameOver || this.isPaused) return;

        const x = Phaser.Utils.Array.GetRandom(this.spawnPositions);
        const isRed = Phaser.Math.Between(0, 99) < 30;

        let ballKey;
        if (isRed) {
            ballKey = this.textures.exists('bomb') ? 'bomb' : 'ball_red';
        } else {
            ballKey = this.textures.exists('money') ? 'money' : 'ball_green';
        }

        const enemy = this.add.sprite(x, -50, ballKey);

        if (ballKey === 'bomb' || ballKey === 'money') {
            enemy.setDisplaySize(120, 120);
        }

        enemy.setData('isRed', isRed);
        this.enemies.add(enemy);

        const baseFall = 2200;
        this.tweens.add({
            targets: enemy,
            y: 750,
            duration: baseFall * this.getBallSpeedFactor(),
            ease: 'Linear',
            onComplete: () => { enemy.destroy(); }
        });
    }

    addScore(amount) {
        this.score += amount;
        this.scoreText.setText('Очки: ' + this.score);
    }

    updateHealthIcon() {
        if (this.armor === 3) {
            this.healthIcon.setTexture('health7');
        } else if (this.armor === 2) {
            this.healthIcon.setTexture('health6');
        } else if (this.armor === 1) {
            this.healthIcon.setTexture('health5');
        } else {
            this.healthIcon.setTexture('health' + (4 - this.lives));
        }
    }

    openPauseMenu() {
        if (this.isPaused) return;
        this.isPaused = true;

        this.time.paused = true;
        this.tweens.pauseAll();

        this.pauseLayer = this.add.container(0, 0).setDepth(200);

        const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        const title = this.add.text(640, 60, 'ПАУЗА', {
            fontSize: '64px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        const screenLabel = this.add.text(640, 150, 'Режим экрана:', {
            fontSize: '26px', color: '#dddddd', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.screenMode = localStorage.getItem('screenMode') || 'FIT';

        this.fitBtn = this.add.text(480, 220, 'СТАНДАРТ', {
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

        this.envelopBtn = this.add.text(800, 220, 'РАСТЯНУТЬ', {
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

        const volLabel = this.add.text(640, 290, 'Громкость музыки:', {
            fontSize: '22px', color: '#dddddd', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.volumeButtons = [];
        const volumeSteps = [0, 0.25, 0.5, 0.75, 1.0];
        const volumeLabels = ['0%', '25%', '50%', '75%', '100%'];

        volumeSteps.forEach((step, i) => {
            const x = 430 + i * 105;
            const y = 340;

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

        this.controlBtn = this.add.text(640, 400, this.controlMode === 'keyboard' ? 'УПРАВЛЕНИЕ: КЛАВИАТУРА' : 'УПРАВЛЕНИЕ: МЫШЬ', {
            fontSize: '28px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 25, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.controlBtn.on('pointerover', () => this.controlBtn.setBackgroundColor('#666666'));
        this.controlBtn.on('pointerout', () => this.controlBtn.setBackgroundColor('#444444'));
        this.controlBtn.on('pointerdown', () => this.toggleControl());

        const resumeBtn = this.add.text(640, 480, 'ПРОДОЛЖИТЬ', {
            fontSize: '36px', color: '#ffffff', backgroundColor: '#44aa44',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        resumeBtn.on('pointerover', () => resumeBtn.setBackgroundColor('#66cc66'));
        resumeBtn.on('pointerout', () => resumeBtn.setBackgroundColor('#44aa44'));
        resumeBtn.on('pointerdown', () => this.resumeGame());

        const menuBtn = this.add.text(640, 560, 'ГЛАВНОЕ МЕНЮ', {
            fontSize: '36px', color: '#ffffff', backgroundColor: '#884444',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setBackgroundColor('#aa5555'));
        menuBtn.on('pointerout', () => menuBtn.setBackgroundColor('#884444'));
        menuBtn.on('pointerdown', () => {
            this.time.paused = false;
            this.tweens.resumeAll();
            this.scene.start('Menu');
        });

        this.pauseLayer.add([dim, title, screenLabel, this.fitBtn, this.envelopBtn, volLabel]);
        this.volumeButtons.forEach(v => this.pauseLayer.add([v.bg, v.label]));
        this.pauseLayer.add([this.controlBtn, resumeBtn, menuBtn]);
    }

    setVolume(step) {
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

        if (this.coinSound) this.coinSound.setVolume(step);
        if (this.hitSound) this.hitSound.setVolume(step);

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

    toggleControl() {
        this.controlMode = this.controlMode === 'keyboard' ? 'mouse' : 'keyboard';
        this.registry.set('controlMode', this.controlMode);
        localStorage.setItem('controlMode', this.controlMode);
        this.controlBtn.setText(
            this.controlMode === 'keyboard' ? 'УПРАВЛЕНИЕ: КЛАВИАТУРА' : 'УПРАВЛЕНИЕ: МЫШЬ'
        );
        this.bindControls();
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
            this.fitBtn.setBackgroundColor('#44aa44');
            this.envelopBtn.setBackgroundColor('#444444');
        } else {
            this.fitBtn.setBackgroundColor('#444444');
            this.envelopBtn.setBackgroundColor('#44aa44');
        }
    }

    resumeGame() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.time.paused = false;
        this.tweens.resumeAll();
        if (this.pauseLayer) {
            this.pauseLayer.destroy();
            this.pauseLayer = null;
        }
    }

    checkGameOver() {
        if (this.lives > 0 || this.gameOver) return;
        this.gameOver = true;

        this.enemies.clear(true, true);

        const equipped = this.registry.get('equipped') || {
            jacket: 'jacket1', hat: 'hat1', hand: 'hand1'
        };

        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.75).setDepth(100);

        this.add.text(640, 120, 'КОНЕЦ ИГРЫ', {
            fontSize: '64px', color: '#ff4444', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101);

        this.add.text(640, 200, 'Твой счёт: ' + this.score, {
            fontSize: '40px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(101);

        this.add.text(640, 260, 'Введи имя для рекорда:', {
            fontSize: '28px', color: '#dddddd', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(101);

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 16;
        input.placeholder = 'Имя';
        input.style.position = 'absolute';
        input.style.left = '50%';
        input.style.top = '360px';
        input.style.transform = 'translateX(-50%)';
        input.style.width = '360px';
        input.style.height = '48px';
        input.style.fontSize = '28px';
        input.style.textAlign = 'center';
        input.style.borderRadius = '8px';
        input.style.border = '2px solid #888';
        input.style.background = '#222';
        input.style.color = '#fff';
        input.style.zIndex = '1000';
        input.style.outline = 'none';

        const gameContainer = document.getElementById('game-container');
        gameContainer.style.position = 'relative';
        gameContainer.appendChild(input);

        setTimeout(() => input.focus(), 50);

        const removeInput = () => {
            if (input.parentNode) input.parentNode.removeChild(input);
        };
        this.events.once('shutdown', removeInput);

        const saveBtn = this.add.text(640, 450, 'СОХРАНИТЬ РЕКОРД', {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#44aa44',
            padding: { x: 25, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);

        saveBtn.on('pointerover', () => saveBtn.setBackgroundColor('#66cc66'));
        saveBtn.on('pointerout', () => saveBtn.setBackgroundColor('#44aa44'));
        saveBtn.on('pointerdown', () => {
            const name = input.value.trim() || 'Без имени';
            this.saveRecord(name, this.score, equipped);
            removeInput();
            saveBtn.disableInteractive();
            saveBtn.setText('СОХРАНЕНО ✓');
            saveBtn.setBackgroundColor('#333333');
        });

        const restartBtn = this.add.text(460, 540, 'ЗАНОВО', {
            fontSize: '36px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);

        restartBtn.on('pointerover', () => restartBtn.setBackgroundColor('#666666'));
        restartBtn.on('pointerout', () => restartBtn.setBackgroundColor('#444444'));
        restartBtn.on('pointerdown', () => {
            removeInput();
            this.scene.restart();
        });

        const menuBtn = this.add.text(820, 540, 'В МЕНЮ', {
            fontSize: '36px', color: '#ffffff', backgroundColor: '#884444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);

        menuBtn.on('pointerover', () => menuBtn.setBackgroundColor('#aa5555'));
        menuBtn.on('pointerout', () => menuBtn.setBackgroundColor('#884444'));
        menuBtn.on('pointerdown', () => {
            removeInput();
            this.scene.start('Menu');
        });
    }

    saveRecord(name, score, equipped) {
        if (!window.db || !window.fbRef || !window.fbSet) {
            console.warn('Firebase не подключён, сохраняем локально');
            const KEY = 'catGameRecords';
            const records = JSON.parse(localStorage.getItem(KEY) || '[]');
            records.push({ name, score, equipped, date: Date.now() });
            records.sort((a, b) => b.score - a.score);
            localStorage.setItem(KEY, JSON.stringify(records.slice(0, 50)));
            return;
        }

        try {
            // Ключ = имя (без спецсимволов Firebase). При повторной записи старая перезапишется
            const nameKey = name.replace(/[.#$[\]]/g, '_');
            const scoreRef = window.fbRef(window.db, 'scores/' + nameKey);

            window.fbSet(scoreRef, {
                name: name,
                score: score,
                equipped: equipped,
                date: Date.now()
            }).catch(err => {
                console.error('Ошибка сохранения в Firebase:', err);
                const KEY = 'catGameRecords';
                const records = JSON.parse(localStorage.getItem(KEY) || '[]');
                records.push({ name, score, equipped, date: Date.now() });
                records.sort((a, b) => b.score - a.score);
                localStorage.setItem(KEY, JSON.stringify(records.slice(0, 50)));
            });
        } catch (err) {
            console.error('Ошибка Firebase:', err);
        }
    }

    update() {
        if (this.gameOver || this.isPaused) return;

        if (this.snowflakes && this.snowflakes.length > 0) {
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

        this.spawnAccumulator += this.game.loop.delta;
        const interval = this.getSpawnInterval();
        while (this.spawnAccumulator >= interval) {
            this.spawnAccumulator -= interval;
            this.spawnEnemy();
        }

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(
                this.cat.x, this.cat.y, enemy.x, enemy.y
            );

            if (dist < 65) {
                if (enemy.getData('isRed')) {
                    this.cameras.main.shake(300, 0.005);

                    if (this.hitSound) {
                        this.hitSound.stop();
                        this.hitSound.setVolume(this.musicVolume);
                        this.hitSound.play();
                    }

                    if (this.armor > 0) {
                        this.armor--;
                        this.updateHealthIcon();
                    } else {
                        this.lives--;
                        this.updateHealthIcon();
                        this.checkGameOver();
                    }

                    this.tweens.killTweensOf(enemy);
                    this.enemies.remove(enemy);

                    const direction = Phaser.Math.Between(0, 1) ? 1 : -1;
                    const flyX = enemy.x + direction * 500;

                    this.tweens.add({
                        targets: enemy,
                        x: flyX,
                        y: enemy.y - 150,
                        angle: direction * 720,
                        alpha: 0,
                        duration: 700,
                        ease: 'Quad.easeOut',
                        onComplete: () => { enemy.destroy(); }
                    });
                } else {
                    this.addScore(1);

                    if (this.coinSound) {
                        this.coinSound.stop();
                        this.coinSound.setVolume(this.musicVolume);
                        this.coinSound.play();
                    }
                    enemy.destroy();
                }
            }
        });
    }
}
