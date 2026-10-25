export class Wardrobe extends Phaser.Scene {
    constructor() {
        super('Wardrobe');
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
    }

    create() {
        if (this.textures.exists('background')) {
            this.add.image(640, 360, 'background').setDisplaySize(1280, 720);
        } else {
            this.cameras.main.setBackgroundColor('#1a1a2e');
        }

        this.equipped = this.registry.get('equipped') || {
            jacket: 'jacket1', hat: 'hat1', hand: 'hand1'
        };

        this.input.keyboard.on('keydown-ESC', () => {
            this.saveAndGoMenu();
        });

        // --- КОТ СЛЕВА ---
        this.catBody = this.add.image(350, 360, this.equipped.jacket).setDepth(0);
        this.catHat = this.add.image(350, 360, this.equipped.hat).setDepth(1);
        this.catHand = this.add.image(350, 360, this.equipped.hand).setDepth(2);

        const catScale = 1.8;
        this.catBody.setScale(catScale);
        this.catHat.setScale(catScale);
        this.catHand.setScale(catScale);

        // --- ПАНЕЛЬ СПРАВА ---
        this.categories = [
            { name: 'ШАПКА', key: 'hat', max: 11, prefix: 'hat' },
            { name: 'КУРТКА', key: 'jacket', max: 4, prefix: 'jacket' },
            { name: 'РУКИ', key: 'hand', max: 10, prefix: 'hand' }
        ];

        this.categoryButtons = [];
        this.categories.forEach((cat, index) => {
            const btn = this.add.text(850, 100 + index * 60, cat.name, {
                fontSize: '28px', color: '#ffffff', backgroundColor: '#444444',
                padding: { x: 15, y: 8 }
            }).setInteractive({ useHandCursor: true });

            btn.on('pointerdown', () => this.showItems(cat.key));
            btn.on('pointerover', () => btn.setBackgroundColor('#666666'));
            btn.on('pointerout', () => btn.setBackgroundColor('#444444'));
            this.categoryButtons.push(btn);
        });

        this.itemsContainer = this.add.container(0, 0);

        const backBtn = this.add.text(640, 680, 'НАЗАД', {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#884444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.saveAndGoMenu();
        });
        backBtn.on('pointerover', () => backBtn.setBackgroundColor('#aa5555'));
        backBtn.on('pointerout', () => backBtn.setBackgroundColor('#884444'));

        this.showItems('hat');
    }

    saveAndGoMenu() {
        this.registry.set('equipped', this.equipped);

        const isHat11 = this.equipped.hat === 'hat11';
        localStorage.setItem('useSpace2', isHat11 ? 'true' : 'false');
        this.registry.set('useSpace2', isHat11);

        this.scene.start('Menu');
    }

    showItems(categoryKey) {
        this.itemsContainer.removeAll(true);

        const cat = this.categories.find(c => c.key === categoryKey);
        if (!cat) return;

        const startX = 780;
        const startY = 320;
        const paddingX = 110;
        const paddingY = 110;
        const cols = 4;

        for (let i = 1; i <= cat.max; i++) {
            const itemKey = cat.prefix + i;
            const col = (i - 1) % cols;
            const row = Math.floor((i - 1) / cols);
            const x = startX + col * paddingX;
            const y = startY + row * paddingY;

            const bg = this.add.rectangle(x, y, 90, 90, 0x333333).setInteractive({ useHandCursor: true });
            const icon = this.add.image(x, y, itemKey).setScale(0.25);

            if (this.equipped[cat.key] === itemKey) {
                bg.setStrokeStyle(3, 0xffff00);
            }

            bg.on('pointerdown', () => {
                this.equipItem(cat.key, itemKey);
            });

            this.itemsContainer.add([bg, icon]);
        }
    }

    equipItem(slotKey, itemKey) {
        this.equipped[slotKey] = itemKey;

        if (slotKey === 'jacket') this.catBody.setTexture(itemKey);
        if (slotKey === 'hat') this.catHat.setTexture(itemKey);
        if (slotKey === 'hand') this.catHand.setTexture(itemKey);

        this.showItems(slotKey);
    }
}
