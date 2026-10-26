export class Scores extends Phaser.Scene {
    constructor() {
        super('Scores');
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
    }

    create() {
        const useSpace2 = this.registry.get('useSpace2')
            ?? (localStorage.getItem('useSpace2') === 'true');
        const bgKey = (useSpace2 && this.textures.exists('space2')) ? 'space2' : 'background';
        this.add.image(640, 360, bgKey).setDisplaySize(1280, 720);

        this.add.text(640, 50, 'РЕКОРДЫ', {
            fontSize: '56px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Контейнер для таблицы
        this.recordsLayer = this.add.container(0, 0);
        this.scrollOffset = 0;
        this.maxScroll = 0;
        this.visibleRows = 4;
        this.allRecords = [];

        this.drawTable();

        // --- КНОПКИ СКРОЛЛА (вверх/вниз) ---
        this.upBtn = this.add.text(1180, 250, '▲', {
            fontSize: '48px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(50);

        this.upBtn.on('pointerover', () => this.upBtn.setBackgroundColor('#666666'));
        this.upBtn.on('pointerout', () => this.upBtn.setBackgroundColor('#444444'));
        this.upBtn.on('pointerdown', () => this.scrollRecords(-1));

        this.downBtn = this.add.text(1180, 470, '▼', {
            fontSize: '48px', color: '#ffffff', backgroundColor: '#444444',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(50);

        this.downBtn.on('pointerover', () => this.downBtn.setBackgroundColor('#666666'));
        this.downBtn.on('pointerout', () => this.downBtn.setBackgroundColor('#444444'));
        this.downBtn.on('pointerdown', () => this.scrollRecords(1));

        // --- СКРОЛЛ КОЛЁСИКОМ (ПК) ---
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (deltaY > 0) this.scrollRecords(1);
            else if (deltaY < 0) this.scrollRecords(-1);
        });

        // --- КНОПКА НАЗАД ---
        const backBtn = this.add.text(640, 680, 'НАЗАД', {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#884444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setBackgroundColor('#aa5555'));
        backBtn.on('pointerout', () => backBtn.setBackgroundColor('#884444'));
        backBtn.on('pointerdown', () => this.scene.start('Menu'));

        this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));
    }

    drawTable() {
        this.recordsLayer.removeAll(true);
        this.upBtn.setVisible(false);
        this.downBtn.setVisible(false);

        const loadingText = this.add.text(640, 360, 'Загрузка рекордов...', {
            fontSize: '28px', color: '#cccccc', fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.recordsLayer.add(loadingText);

        if (!window.db) {
            const records = JSON.parse(localStorage.getItem('catGameRecords') || '[]');
            this.renderRecords(records);
            return;
        }

        import('https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js')
            .then(({ ref, get, query, orderByChild, limitToLast }) => {
                const scoresRef = ref(window.db, 'scores');
                const topQuery = query(scoresRef, orderByChild('score'), limitToLast(50));
                return get(topQuery);
            })
            .then(snapshot => {
                const records = [];
                if (snapshot.exists()) {
                    snapshot.forEach(child => {
                        records.push(child.val());
                    });
                }
                records.reverse();
                this.renderRecords(records);
            })
            .catch(err => {
                console.error('Ошибка чтения из Firebase:', err);
                const records = JSON.parse(localStorage.getItem('catGameRecords') || '[]');
                this.renderRecords(records);
            });
    }

    renderRecords(records) {
        this.recordsLayer.removeAll(true);
        this.allRecords = records;

        if (records.length === 0) {
            const empty = this.add.text(640, 360, 'Пока нет рекордов.\nСыграй и сохрани свой!', {
                fontSize: '32px', color: '#cccccc', fontFamily: 'Arial',
                align: 'center'
            }).setOrigin(0.5);
            this.recordsLayer.add(empty);
            this.upBtn.setVisible(false);
            this.downBtn.setVisible(false);
            return;
        }

        this.maxScroll = Math.max(0, records.length - this.visibleRows);

        // Если скролл ушёл за пределы — корректируем
        if (this.scrollOffset > this.maxScroll) {
            this.scrollOffset = this.maxScroll;
        }

        const startY = 130;
        const rowHeight = 120;

        const visible = records.slice(this.scrollOffset, this.scrollOffset + this.visibleRows);

        visible.forEach((rec, i) => {
            const realIndex = this.scrollOffset + i;
            const y = startY + i * rowHeight;

            const rowBg = this.add.rectangle(640, y, 1000, 110, 0x222222, 0.8)
                .setStrokeStyle(2, realIndex === 0 ? 0xffcc00 : 0x444444);
            this.recordsLayer.add(rowBg);

            const place = this.add.text(180, y, (realIndex + 1) + '.', {
                fontSize: '36px', color: realIndex === 0 ? '#ffcc00' : '#ffffff',
                fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0.5);
            this.recordsLayer.add(place);

            const equipped = rec.equipped || { jacket: 'jacket1', hat: 'hat1', hand: 'hand1' };
            this.addAvatar(280, y, equipped);

            const nameText = this.add.text(400, y, rec.name || 'Без имени', {
                fontSize: '30px', color: '#ffffff', fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            this.recordsLayer.add(nameText);

            const scoreText = this.add.text(1040, y, String(rec.score), {
                fontSize: '40px', color: '#88ff88', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(1, 0.5);
            this.recordsLayer.add(scoreText);
        });

        // Показываем/скрываем кнопки скролла
        this.upBtn.setVisible(this.scrollOffset > 0);
        this.downBtn.setVisible(this.scrollOffset < this.maxScroll);

        // Подсказка внизу
        if (records.length > this.visibleRows) {
            const hint = this.add.text(640, 660, `Показаны ${this.scrollOffset + 1}–${Math.min(this.scrollOffset + this.visibleRows, records.length)} из ${records.length}`, {
                fontSize: '20px', color: '#aaaaaa', fontFamily: 'Arial'
            }).setOrigin(0.5);
            this.recordsLayer.add(hint);
        }
    }

    scrollRecords(direction) {
        if (!this.allRecords || this.allRecords.length === 0) return;

        const newOffset = this.scrollOffset + direction;
        if (newOffset < 0 || newOffset > this.maxScroll) return;

        this.scrollOffset = newOffset;
        this.renderRecords(this.allRecords);
    }

    addAvatar(cx, cy, equipped) {
        const scale = 0.4;
        const body = this.add.image(cx, cy, equipped.jacket).setScale(scale).setDepth(0);
        const hat  = this.add.image(cx, cy, equipped.hat).setScale(scale).setDepth(1);
        const hand = this.add.image(cx, cy, equipped.hand).setScale(scale).setDepth(2);
        this.recordsLayer.add([body, hat, hand]);
    }
}
