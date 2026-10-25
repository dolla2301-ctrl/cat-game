export class Wardrobe extends Phaser.Scene {
    constructor() {
        super('Wardrobe');
    }

    preload() {
        // Загружаем ВСЕ ассеты
        // Тела
        for (let i = 1; i <= 4; i++) {
            this.load.image('jacket' + i, `assets/jackets/jacket${i}.png`);
        }
        // Шапки
        for (let i = 1; i <= 10; i++) {
            this.load.image('hat' + i, `assets/hats/hat${i}.png`);
        }
        // Руки
        for (let i = 1; i <= 10; i++) {
            this.load.image('hand' + i, `assets/hands/hand${i}.png`);
        }
    }

    create() {
        // Фон
        if (this.textures.exists('background')) {
            this.add.image(640, 360, 'background').setDisplaySize(1280, 720);
        } else {
            this.cameras.main.setBackgroundColor('#1a1a2e');
        }

        // Текущая экипировка
        this.equipped = this.registry.get('equipped') || {
            jacket: 'jacket1', hat: 'hat1', hand: 'hand1'
        };
          // --- ВЫХОД В МЕНЮ ПО ESCAPE ---
        this.input.keyboard.on('keydown-ESC', () => {
            // ВАЖНО: сохраняем то, что ты выбрал, чтобы изменения не потерялись
            this.registry.set('equipped', this.equipped);
            
            // Переходим в меню
            this.scene.start('Menu');
        });

        // --- КОТ СЛЕВА ---
        // Создаем слои. ВАЖНО: depth задает порядок (0 - низ, 2 - верх)
        this.catBody = this.add.image(350, 360, this.equipped.jacket).setDepth(0);
        this.catHat = this.add.image(350, 360, this.equipped.hat).setDepth(1);
        this.catHand = this.add.image(350, 360, this.equipped.hand).setDepth(2);

        // Масштаб для кота в гардеробе
        const catScale = 1.8;
        this.catBody.setScale(catScale);
        this.catHat.setScale(catScale);
        this.catHand.setScale(catScale);

        // --- ПАНЕЛЬ СПРАВА ---
        // Контейнер для кнопок категорий
        this.categories = [
            { name: 'ШАПКА', key: 'hat', max: 10, prefix: 'hat' },
            { name: 'КУРТКА', key: 'jacket', max: 4, prefix: 'jacket' },
            { name: 'РУКИ', key: 'hand', max: 10, prefix: 'hand' }
        ];

        // Кнопки категорий (сверху справа)
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

        // Контейнер для сетки предметов
        this.itemsContainer = this.add.container(0, 0);

        // Кнопка НАЗАД
        const backBtn = this.add.text(640, 680, 'НАЗАД', {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#884444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.registry.set('equipped', this.equipped);
            this.scene.start('Menu');
        });
        backBtn.on('pointerover', () => backBtn.setBackgroundColor('#aa5555'));
        backBtn.on('pointerout', () => backBtn.setBackgroundColor('#884444'));

        // Показываем шапки по умолчанию
        this.showItems('hat');
    }

    // Функция отрисовки сетки предметов
    showItems(categoryKey) {
        // Очищаем старую сетку
        this.itemsContainer.removeAll(true);

        // Находим категорию
        const cat = this.categories.find(c => c.key === categoryKey);
        if (!cat) return;

        // Параметры сетки
        const startX = 780;
        const startY = 320;
        const paddingX = 110;
        const paddingY = 110;
        const cols = 4; // 4 в ряд

        for (let i = 1; i <= cat.max; i++) {
            const itemKey = cat.prefix + i;
            const col = (i - 1) % cols;
            const row = Math.floor((i - 1) / cols);
            const x = startX + col * paddingX;
            const y = startY + row * paddingY;

            // Фон для иконки
            const bg = this.add.rectangle(x, y, 90, 90, 0x333333).setInteractive({ useHandCursor: true });
            
            // Иконка предмета (уменьшенная копия)
            const icon = this.add.image(x, y, itemKey).setScale(0.25);

            // Проверка, надет ли этот предмет
            if (this.equipped[cat.key] === itemKey) {
                bg.setStrokeStyle(3, 0xffff00); // Желтая рамка, если надет
            }

            // Клик - надеть предмет
            bg.on('pointerdown', () => {
                this.equipItem(cat.key, itemKey);
            });

            this.itemsContainer.add([bg, icon]);
        }
    }

    // Функция надевания предмета
    equipItem(slotKey, itemKey) {
        // Обновляем данные
        this.equipped[slotKey] = itemKey;

        // Обновляем визуал кота
        if (slotKey === 'jacket') this.catBody.setTexture(itemKey);
        if (slotKey === 'hat') this.catHat.setTexture(itemKey);
        if (slotKey === 'hand') this.catHand.setTexture(itemKey);

        // Перерисовываем сетку (чтобы обновить рамку)
        this.showItems(slotKey);
    }
}