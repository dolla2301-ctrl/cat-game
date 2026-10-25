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
    }

    create() {
        // --- СОСТОЯНИЕ ---
        this.gameOver = false;
        this.isPaused = false;
        this.isJumping = false;
        this.isAirborne = false;
        this.lives = 3;
        this.score = 0;

        // --- ЭКИПИРОВКА ---
        const equipped = this.registry.get('equipped') || {
            jacket: 'jacket1', hat: 'hat1', hand: 'hand1'
        };

        // --- ФОН ---
        this.add.image(640, 360, 'background').setDisplaySize(1280, 720);

        // --- ТЕКСТУРЫ ШАРОВ ---
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

        // --- КОТ ---
        const body = this.add.image(0, 0, equipped.jacket).setDepth(0);
        const hat = this.add.image(0, 0, equipped.hat).setDepth(1);
        const hand = this.add.image(0, 0, equipped.hand).setDepth(2);

        this.cat = this.add.container(200, 600, [body, hat, hand]);
        this.cat.setScale(0.8);

        // --- ЖИЗНИ ---
        this.healthIcon = this.add.image(20, 20, 'health1')
            .setOrigin(0, 0)
            .setDepth(10);

        // --- ОЧКИ ---
        this.scoreText = this.add.text(20, 136, 'Очки: 0', {
            fontSize: '32px', color: '#ffffff', fontFamily: 'Arial',
            backgroundColor: '#00000088', padding: { x: 10, y: 5 }
        }).setDepth(10);

        // --- ВРАГИ ---
        this.enemies = this.add.group();
        this.spawnAccumulator = 0;

        // --- РЕЖИМ УПРАВЛЕНИЯ ---
        this.controlMode = this.registry.get('controlMode')
            || localStorage.getItem('controlMode')
            || 'mouse';

        // --- КЛАВИАТУРА (только если выбран этот режим) ---
        if (this.controlMode === 'keyboard') {
            this.input.keyboard.on('keydown-LEFT', () => this.tryJump(-108));
            this.input.keyboard.on('keydown-RIGHT', () => this.tryJump(108));
            this.input.keyboard.on('keydown-UP', () => this.tryJumpUp());
            this.input.keyboard.on('keydown-DOWN', () => this.tryDuck());
        }

        // --- МЫШЬ / СЕНСОР (только если выбран этот режим) ---
        if (this.controlMode === 'mouse') {
            this.input.on('pointerdown', (pointer) => {
                if (this.gameOver || this.isPaused) return;

                // Игнорируем тап по кнопке паузы (она в правом верхнем углу)
                if (pointer.x > 1180 && pointer.y < 80) return;

                if (pointer.y < 240) {
                    this.tryJumpUp();
                    return;
                }

                if (pointer.x < 640) this.tryJump(-108);
                else this.tryJump(108);
            });
        }

        // --- ESC = ПАУЗА ---
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.gameOver) return;
            if (this.isPaused) this.resumeGame();
            else this.openPauseMenu();
        });

        // --- КНОПКА ПАУЗЫ (правый верхний угол, для сенсора/мыши) ---
        this.pauseBtn = this.add.text(1240, 20, 'МЕНЮ', {
            fontSize: '36px', color: '#ffcc00', backgroundColor: '#00000088',
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
    // ПРЫЖОК ВБОК
    // ============================================================
    tryJump(distanceX) {
        if (this.gameOver || this.isPaused) return;
        if (this.isJumping || this.isAirborne) return;

        const newX = this.cat.x + distanceX;
        if (newX < 100 || newX > 1180) return;

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
    // СКОРОСТЬ ПАДЕНИЯ ШАРОВ
    // ============================================================
    getBallSpeedFactor() {
        return Math.max(0.25, 1 - this.score * 0.02);
    }

    // ============================================================
    // ИНТЕРВАЛ СПАВНА
    // ============================================================
    getSpawnInterval() {
        const multiplier = Math.pow(2, Math.floor(this.score / 10));
        return Math.max(40, 600 / multiplier);
    }

    // ============================================================
    // СПАВН ШАРА
    // ============================================================
    spawnEnemy() {
        if (this.gameOver || this.isPaused) return;

        const x = Phaser.Math.Between(50, 1230);
        const isRed = Phaser.Math.Between(0, 99) < 30;
        const ballKey = isRed ? 'ball_red' : 'ball_green';

        const enemy = this.add.sprite(x, -50, ballKey);
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
        const title = this.add.text(640, 220, 'ПАУЗА', {
            fontSize: '72px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        const resumeBtn = this.add.text(640, 380, 'ПРОДОЛЖИТЬ', {
            fontSize: '40px', color: '#ffffff', backgroundColor: '#44aa44',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        resumeBtn.on('pointerover', () => resumeBtn.setBackgroundColor('#66cc66'));
        resumeBtn.on('pointerout', () => resumeBtn.setBackgroundColor('#44aa44'));
        resumeBtn.on('pointerdown', () => this.resumeGame());

        const menuBtn = this.add.text(640, 490, 'ГЛАВНОЕ МЕНЮ', {
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

        this.pauseLayer.add([dim, title, resumeBtn, menuBtn]);
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

        this.add.text(640, 290, 'Введи имя для рекорда:', {
            fontSize: '28px', color: '#dddddd', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(101);

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 16;
        input.placeholder = 'Имя';
        input.style.position = 'absolute';
        input.style.left = '50%';
        input.style.top = '320px';
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

        const saveBtn = this.add.text(640, 420, 'СОХРАНИТЬ РЕКОРД', {
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

        const restartBtn = this.add.text(460, 520, 'ЗАНОВО', {
            fontSize: '36px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);

        restartBtn.on('pointerover', () => restartBtn.setBackgroundColor('#666666'));
        restartBtn.on('pointerout', () => restartBtn.setBackgroundColor('#444444'));
        restartBtn.on('pointerdown', () => {
            removeInput();
            this.scene.restart();
        });

        const menuBtn = this.add.text(820, 520, 'В МЕНЮ', {
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

    // ============================================================
    // СОХРАНЕНИЕ РЕКОРДА
    // ============================================================
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

            if (dist < 60) {
                if (enemy.getData('isRed')) {
                    this.lives--;
                    this.updateHealthIcon();
                    this.checkGameOver();
                } else {
                    this.addScore(1);
                }
                enemy.destroy();
            }
        });
    }
}
