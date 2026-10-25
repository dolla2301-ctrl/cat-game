export class Scores extends Phaser.Scene {
    constructor() {
        super('Scores');
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
        this.add.image(640, 360, 'background').setDisplaySize(1280, 720);

        this.add.text(640, 60, 'РЕКОРДЫ', {
            fontSize: '64px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.recordsLayer = this.add.container(0, 0);

        this.drawTable();

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

        const records = JSON.parse(localStorage.getItem('catGameRecords') || '[]');

        if (records.length === 0) {
            const empty = this.add.text(640, 360, 'Пока нет рекордов.\nСыграй и сохрани свой!', {
                fontSize: '32px', color: '#cccccc', fontFamily: 'Arial',
                align: 'center'
            }).setOrigin(0.5);
            this.recordsLayer.add(empty);
            return;
        }

        const startY = 150;
        const rowHeight = 80;
        const maxRows = 6;
        const visible = records.slice(0, maxRows);

        visible.forEach((rec, index) => {
            const y = startY + index * rowHeight;

            const rowBg = this.add.rectangle(640, y, 1000, 70, 0x222222, 0.8)
                .setStrokeStyle(2, index === 0 ? 0xffcc00 : 0x444444);
            this.recordsLayer.add(rowBg);

            const place = this.add.text(180, y, (index + 1) + '.', {
                fontSize: '32px', color: index === 0 ? '#ffcc00' : '#ffffff',
                fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0.5);
            this.recordsLayer.add(place);

            const equipped = rec.equipped || { jacket: 'jacket1', hat: 'hat1', hand: 'hand1' };
            this.addAvatar(260, y, equipped);

            const nameText = this.add.text(360, y, rec.name || 'Без имени', {
                fontSize: '28px', color: '#ffffff', fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            this.recordsLayer.add(nameText);

            const scoreText = this.add.text(1050, y, String(rec.score), {
                fontSize: '36px', color: '#88ff88', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(1, 0.5);
            this.recordsLayer.add(scoreText);

            const realIndex = records.indexOf(rec);
            const cross = this.add.text(1110, y, '✕', {
                fontSize: '36px', color: '#ff6666', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            cross.on('pointerover', () => cross.setColor('#ff2222').setScale(1.2));
            cross.on('pointerout', () => cross.setColor('#ff6666').setScale(1.0));
            cross.on('pointerdown', () => this.deleteRecord(realIndex));
            this.recordsLayer.add(cross);
        });

        if (records.length > maxRows) {
            const hint = this.add.text(640, 660, `Показаны топ-${maxRows} из ${records.length}`, {
                fontSize: '20px', color: '#aaaaaa', fontFamily: 'Arial'
            }).setOrigin(0.5);
            this.recordsLayer.add(hint);
        }
    }

    deleteRecord(index) {
        const KEY = 'catGameRecords';
        const records = JSON.parse(localStorage.getItem(KEY) || '[]');

        if (index < 0 || index >= records.length) return;

        records.splice(index, 1);
        localStorage.setItem(KEY, JSON.stringify(records));

        this.drawTable();
    }

    addAvatar(cx, cy, equipped) {
        const scale = 0.4;
        const body = this.add.image(cx, cy, equipped.jacket).setScale(scale).setDepth(0);
        const hat  = this.add.image(cx, cy, equipped.hat).setScale(scale).setDepth(1);
        const hand = this.add.image(cx, cy, equipped.hand).setScale(scale).setDepth(2);
        this.recordsLayer.add([body, hat, hand]);
    }
}