export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('background', 'assets/space.png');

        for (let i = 1; i <= 4; i++) {
            this.load.image('jacket' + i, `assets/jackets/jacket${i}.png`);
        }
        for (let i = 1; i <= 10; i++) {
            this.load.image('hat' + i, `assets/hats/hat${i}.png`);
        }
        for (let i = 1; i <= 10; i++) {
            this.load.image('hand' + i, `assets/hands/hand${i}.png`);
        }

        this.load.image('health1', 'assets/healts/healts1.png');
        this.load.image('health2', 'assets/healts/healts2.png');
        this.load.image('health3', 'assets/healts/healts3.png');
        this.load.image('health4', 'assets/healts/healts4.png');

        this.load.image('money', 'assets/balls/money.png');
        this.load.image('bomb', 'assets/balls/bomb.png');

        this.load.audio('bgMusic', 'assets/music/tetris.mp3');
        this.load.audio('coinSound', 'assets/music/money.mp3');
        this.load.audio('hitSound', 'assets/music/hit.mp3');
    }

    create() {
        this.gameOver = false;
        this.isPaused = false;
        this.isJumping = false;
        this.isAirborne = false;
        this.lives = 3;
        this.score = 0;

        const equipped = this.registry.get('equipped') || {
            jacket: 'jacket1', hat: 'hat1', hand: 'hand1'
        };

        this.add.image(640, 360, 'background').setDisplaySize(1280, 720);

        // --- ЗАПАСНЫЕ ТЕКСТУРЫ ---
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

        this.healthIcon = this.add.image(20, 20, 'health1')
            .setOrigin(0, 0)
            .setDepth(10);

        this.scoreText = this.add.text(20, 136, 'Очки: 0', {
            fontSize: '32px', color: '#ffffff', fontFamily: 'Arial',
            backgroundColor: '#00000088', padding: { x: 10, y: 5 }
        }).setDepth(10);

        this.enemies = this.add.group();
        this.spawnAccumulator = 0;

        // --- МУЗЫКА ---
        this.musicVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0.5');
        this.musicVolume = Math.max(0, Math.min(1, this.musicVolume));

        if (!this.sound.get('bgMusic') || !this.sound.get('bgMusic').isPlaying) {
            this.bgMusic = this.sound.add('bgMusic', {
                loop: true,
                volume: this.musicVolume
            });
            if (this.musicVolume > 0) this.bgMusic.play();
        } else {
            this.bgMusic = this.sound.get('bgMusic');
            this.bgMusic.setVolume(this.musicVolume);
        }

        // --- ЗВУК МОНЕТЫ ---
        if (!this.sound.get('coinSound')) {
            this.coinSound = this.sound.add('coinSound', { volume: this.musicVolume });
        } else {
            this.coinSound = this.sound.get('coinSound');
        }

        // --- ЗВУК УДАРА ---
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

        // --- РЕЖИМ УПРАВЛЕНИЯ ---
        this.controlMode = this.registry.get('controlMode')
            || localStorage.getItem('controlMode')
            || 'mouse';

        this.bindControls();

        // --- ESC = ПАУЗА ---
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.gameOver) return;
            if (this.isPaused) this.resumeGame();
            else this.openPauseMenu();
        });

        // --- КНОПКА «МЕНЮ» ---
        this.pauseBtn = this.add.text(1240, 20, 'МЕНЮ', {
            fontSize: '28px', color: '#ffcc00', backgroundColor: '#00000088',
            padding: { x: 14, y: 6 }
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

    // ============================================================
    // ПРИВЯЗКА УПРАВЛЕНИЯ
    // ============================================================
    bindControls() {
        this.input.keyboard.off('keydown-LEFT');
        this.input.keyboard.off('keydown-RIGHT');
        this.input.keyboard.off('keydown-UP');
        this.input.keyboard.off('keydown-DOWN');
        this.input.off('pointerdown');

        if (this.controlMode === 'keyboard') {
            this.input.keyboard.on('keydown-LEFT', () => this.tryJump(-108));
            this.input.keyboard.on('keydown-RIGHT', () => this.tryJump(108));
            this.input.keyboard.on('keydown-UP', () => this.tryJumpUp());
            this.input.keyboard.on('keydown-DOWN', () => this.tryDuck());
        } else {
            this.input.on('pointerdown', (pointer) => {
                if (this.gameOver || this.isPaused) return;
                if (pointer.x > 1100 && pointer.y < 80) return;

                if (pointer.y < 240) {
                    this.tryJumpUp();
                    return;
                }

                if (pointer.x < 640) this.tryJump(-108);
                else this.tryJump(108);
            });
        }
    }

    // ============================================================
    // ПРЫЖОК ВБОК
    // ============================================================
    tryJump(distanceX) {
        if (this.gameOver || this.isPaused) return;
        if (this.isJumping || this.isAirborne) return;

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

    // ============================================================
    // ПРЫЖОК ВВЕРХ
    // ============================================================
    tryJumpUp() {
        if (this.gameOver || this.isPaused) return;
        if (this.isAirborne || this.isJumping) return;

        this.isAirborne = true;
        const startY = this.cat.y;
        const jumpHeight = 150;
        const duration = 180;

        this.tweens.add({
            targets: this.cat,
            y: startY - jumpHeight,
            duration: duration,
            ease: 'Quad.easeOut',
            yoyo: true,
            onComplete: () => {
                this.cat.y = startY;
                this.isAirborne = false;
            }
        });
    }

    // ============================================================
    // ПРИСЕСТЬ
    // ============================================================
    tryDuck() {
        if (this.gameOver || this.isPaused) return;
        if (!this.isAirborne) return;

        this.isAirborne = false;
        this.tweens.killTweensOf(this.cat);
        this.cat.y = 600;
    }

    // ============================================================
    // СКОРОСТЬ ПАДЕНИЯ ШАРОВ (замедлено на 50%)
    // ============================================================
    getBallSpeedFactor() {
        return Math.max(0.25, 1 - this.score * 0.01);
    }

    // ============================================================
    // ИНТЕРВАЛ СПАВНА (замедлено на 50%)
    // ============================================================
    getSpawnInterval() {
        const multiplier = Math.pow(2, Math.floor(this.score / 20));
        return Math.max(40, 600 / multiplier);
    }

    // ============================================================
    // СПАВН ШАРА
    // ============================================================
    spawnEnemy() {
        if (this.gameOver || this.isPaused) return;

        const x = Phaser.Math.Between(50, 1230);
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

    // ============================================================
    // ОЧКИ
    // ============================================================
    addScore(amount) {
        this.score += amount;
        this.scoreText.setText('Очки: ' + this.score);
    }

    // ============================================================
    // ИКОНКА ЖИЗНЕЙ
    // ============================================================
    updateHealthIcon() {
        this.healthIcon.setTexture('health' + (4 - this.lives));
    }

    // ============================================================
    // ПАУЗА
    // ============================================================
    openPauseMenu() {
        if (this.isPaused) return;
        this.isPaused = true;

        this.time.paused = true;
        this.tweens.pauseAll();

        this.pauseLayer = this.add.container(0, 0).setDepth(200);

        const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        const title = this.add.text(640, 120, 'ПАУЗА', {
            fontSize: '72px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        const volLabel = this.add.text(640, 220, 'ГРОМКОСТЬ МУЗЫКИ:', {
            fontSize: '28px', color: '#dddddd', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.volumeButtons = [];
        const volumeSteps = [0, 0.25, 0.5, 0.75, 1.0];
        const volumeLabels = ['0%', '25%', '50%', '75%', '100%'];

        volumeSteps.forEach((step, i) => {
            const x = 380 + i * 130;
            const y = 280;

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

        this.controlBtn = this.add.text(640, 370, this.controlMode === 'keyboard' ? 'УПРАВЛЕНИЕ: КЛАВИАТУРА' : 'УПРАВЛЕНИЕ: МЫШЬ', {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 25, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.controlBtn.on('pointerover', () => this.controlBtn.setBackgroundColor('#666666'));
        this.controlBtn.on('pointerout', () => this.controlBtn.setBackgroundColor('#444444'));
        this.controlBtn.on('pointerdown', () => this.toggleControl());

        const resumeBtn = this.add.text(640, 460, 'ПРОДОЛЖИТЬ', {
            fontSize: '40px', color: '#ffffff', backgroundColor: '#44aa44',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        resumeBtn.on('pointerover', () => resumeBtn.setBackgroundColor('#66cc66'));
        resumeBtn.on('pointerout', () => resumeBtn.setBackgroundColor('#44aa44'));
        resumeBtn.on('pointerdown', () => this.resumeGame());

        const menuBtn = this.add.text(640, 550, 'ГЛАВНОЕ МЕНЮ', {
            fontSize: '40px', color: '#ffffff', backgroundColor: '#884444',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setBackgroundColor('#aa5555'));
        menuBtn.on('pointerout', () => menuBtn.setBackgroundColor('#884444'));
        menuBtn.on('pointerdown', () => {
            this.time.paused = false;
            this.tweens.resumeAll();
            this.scene.start('Menu');
        });

        this.pauseLayer.add([dim, title, volLabel]);
        this.volumeButtons.forEach(v => this.pauseLayer.add([v.bg, v.label]));
        this.pauseLayer.add([this.controlBtn, resumeBtn, menuBtn]);

        this.highlightVolume();
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

    // ============================================================
    // КОНЕЦ ИГРЫ
    // ============================================================
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
        const KEY = 'catGameRecords';
        const records = JSON.parse(localStorage.getItem(KEY) || '[]');
        records.push({
            name: name,
            score: score,
            equipped: equipped,
            date: Date.now()
        });
        records.sort((a, b) => b.score - a.score);
        localStorage.setItem(KEY, JSON.stringify(records.slice(0, 50)));
    }

    // ============================================================
    // UPDATE
    // ============================================================
    update() {
        if (this.gameOver || this.isPaused) return;

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

            if (dist < 70) {
                if (enemy.getData('isRed')) {
                    this.lives--;
                    this.updateHealthIcon();
                    this.cameras.main.shake(300, 0.005);

                    if (this.hitSound) {
                        this.hitSound.stop();
                        this.hitSound.setVolume(this.musicVolume);
                        this.hitSound.play();
                    }

                    this.checkGameOver();
                } else {
                    this.addScore(1);

                    if (this.coinSound) {
                        this.coinSound.stop();
                        this.coinSound.setVolume(this.musicVolume);
                        this.coinSound.play();
                    }
                }
                enemy.destroy();
            }
        });
    }
}
