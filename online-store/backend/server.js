const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');
const app = express();

// Настройки
app.use(cors());
app.use(express.json());

// Путь к фронтенду
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// КОНФИГ ДЛЯ SQL SERVER - РАБОЧИЙ!
const dbConfig = {
    server: 'localhost', // локальный сервер
    database: 'OnlineShopDB',
    user: 'shop_user',
    password: 'shop123', // пароль который мы установили
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Подключение к БД
let pool;
async function connectDB() {
    try {
        console.log('🔗 Подключаюсь к SQL Server...');
        console.log(`📡 Сервер: ${dbConfig.server}`);
        console.log(`📊 База: ${dbConfig.database}`);
        console.log(`👤 Пользователь: ${dbConfig.user}`);
        
        pool = await sql.connect(dbConfig);
        console.log('✅ БД подключена успешно!');
        
        // Тестовый запрос
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('📋 Версия SQL Server:', result.recordset[0].version.substring(0, 50) + '...');
        
        // Проверяем есть ли таблица Products
        try {
            const checkResult = await pool.request().query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'Products'
            `);
            
            if (checkResult.recordset[0].count === 0) {
                console.log('⚠️ Таблица Products не найдена, создаем...');
                await createProductsTable();
            } else {
                const prodCount = await pool.request().query('SELECT COUNT(*) as count FROM Products');
                console.log(`📦 Товаров в БД: ${prodCount.recordset[0].count}`);
            }
        } catch (tableErr) {
            console.log('ℹ️ Таблица Products еще не создана, работаем с тестовыми данными');
        }
        
        return pool;
    } catch (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
        console.log('💡 Проверь:');
        console.log('   1. SQL Server запущен (services.msc)');
        console.log('   2. Пароль правильный: shop123');
        console.log('   3. Пользователь shop_user существует');
        return null;
    }
}

// Создание таблицы Products если ее нет
async function createProductsTable() {
    try {
        await pool.request().query(`
            CREATE TABLE Products (
                ProductID INT PRIMARY KEY IDENTITY(1,1),
                ProductName NVARCHAR(200) NOT NULL,
                Price DECIMAL(10,2) NOT NULL,
                CategoryID INT,
                Brand NVARCHAR(100),
                Description NVARCHAR(MAX),
                StockQuantity INT DEFAULT 0,
                Rating DECIMAL(3,2) DEFAULT 4.0,
                Reviews INT DEFAULT 0,
                ImageURL NVARCHAR(500),
                CreatedDate DATETIME DEFAULT GETDATE()
            )
        `);
        
        console.log('✅ Таблица Products создана');
        
        // Добавляем тестовые товары
        await pool.request().query(`
            INSERT INTO Products (ProductName, Price, CategoryID, Brand, Description, StockQuantity, Rating, Reviews, ImageURL)
            VALUES 
                ('iPhone 15 Pro', 99990, 1, 'apple', 'Новый флагман Apple с процессором A17 Pro', 10, 4.8, 128, 'images/iphone.jpg'),
                ('Samsung Galaxy S23 Ultra', 89990, 1, 'samsung', 'Смартфон с лучшей камерой на рынке', 5, 4.7, 94, 'images/samsung.jpg'),
                ('MacBook Air M2', 129990, 2, 'apple', 'Ультратонкий ноутбук с чипом Apple M2', 3, 4.9, 76, 'images/macbook.jpg'),
                ('Xiaomi Redmi Note 12', 24990, 1, 'xiaomi', 'Бюджетный смартфон с AMOLED-экраном', 15, 4.3, 215, 'images/xiaomi.jpg'),
                ('Sony Bravia XR-55A80L', 159990, 3, 'sony', 'OLED телевизор с процессором Cognitive Processor XR', 2, 4.6, 42, 'images/sony-tv.jpg')
        `);
        
        console.log('✅ Добавлено 5 тестовых товаров');
        
    } catch (err) {
        console.error('❌ Ошибка создания таблицы:', err.message);
    }
}

// ========== API МАРШРУТЫ ==========

// Тест подключения к БД
app.get('/api/db-test', async (req, res) => {
    try {
        if (!pool) await connectDB();
        
        if (pool) {
            const result = await pool.request().query('SELECT @@VERSION as version');
            res.json({
                success: true,
                message: '✅ БД подключена через SQL Server Authentication',
                server: dbConfig.server,
                database: dbConfig.database,
                user: dbConfig.user,
                version: result.recordset[0].version.substring(0, 100)
            });
        } else {
            res.json({
                success: false,
                message: '❌ Не удалось подключиться к БД'
            });
        }
    } catch (err) {
        res.json({ 
            success: false, 
            error: err.message,
            config: {
                server: dbConfig.server,
                database: dbConfig.database,
                user: dbConfig.user
            }
        });
    }
});

// Получить все товары (из БД или тестовые)
app.get('/api/products', async (req, res) => {
    try {
        if (!pool) await connectDB();
        
        // Если БД не подключена - возвращаем тестовые данные
        if (!pool) {
            console.log('📦 БД не подключена, использую тестовые данные');
            return res.json(getTestProducts());
        }

        // Пробуем получить данные из БД
        const result = await pool.request().query(`
            SELECT 
                ProductID as id,
                ProductName as title,
                Price as price,
                CategoryID as categoryId,
                Brand as brand,
                Description as description,
                StockQuantity as stock,
                Rating as rating,
                Reviews as reviews,
                ImageURL as image
            FROM Products
            ORDER BY ProductID
        `);
        
        console.log(`📦 Загружено из БД: ${result.recordset.length} товаров`);
        
        // Форматируем данные для фронтенда
        const products = result.recordset.map(item => ({
            id: item.id,
            title: item.title || 'Товар',
            price: item.price || 0,
            category: getCategoryName(item.categoryId),
            brand: item.brand || 'unknown',
            description: item.description || 'Описание товара',
            stock: item.stock || 0,
            rating: item.rating || 4.0,
            reviews: item.reviews || 0,
            availability: (item.stock || 0) > 0 ? 'in-stock' : 'out-of-stock',
            image: item.image || getDefaultImage(item.categoryId)
        }));
        
        res.json(products);
        
    } catch (err) {
        console.error('Ошибка при получении товаров из БД:', err.message);
        // Если ошибка БД - возвращаем тестовые данные
        res.json(getTestProducts());
    }
});

// Поиск товаров
app.get('/api/products/search', async (req, res) => {
    const { query } = req.query;
    
    if (!pool) await connectDB();
    
    if (!pool || !query) {
        return res.json(getTestProducts().filter(p => 
            p.title.toLowerCase().includes(query?.toLowerCase() || '') ||
            p.description.toLowerCase().includes(query?.toLowerCase() || '')
        ));
    }
    
    try {
        const result = await pool.request().query(`
            SELECT * FROM Products 
            WHERE ProductName LIKE '%' + ${query} + '%' 
            OR Description LIKE '%' + ${query} + '%'
        `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка поиска:', err);
        res.status(500).json({ error: err.message });
    }
});

// Получить один товар по ID
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    
    if (!pool) await connectDB();
    
    if (!pool) {
        const product = getTestProducts().find(p => p.id == id);
        return res.json(product || null);
    }
    
    try {
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Products WHERE ProductID = @id');
        
        if (result.recordset.length > 0) {
            const item = result.recordset[0];
            res.json({
                id: item.ProductID,
                title: item.ProductName,
                price: item.Price,
                category: getCategoryName(item.CategoryID),
                brand: item.Brand,
                description: item.Description,
                stock: item.StockQuantity,
                rating: item.Rating,
                reviews: item.Reviews,
                image: item.ImageURL,
                availability: item.StockQuantity > 0 ? 'in-stock' : 'out-of-stock'
            });
        } else {
            res.status(404).json({ error: 'Товар не найден' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить категории
app.get('/api/categories', (req, res) => {
    const categories = [
        { id: 1, name: 'Смартфоны', slug: 'smartphone' },
        { id: 2, name: 'Ноутбуки', slug: 'laptop' },
        { id: 3, name: 'Телевизоры', slug: 'tv' },
        { id: 4, name: 'Наушники', slug: 'headphones' },
        { id: 5, name: 'Игровые консоли', slug: 'console' },
        { id: 6, name: 'Мониторы', slug: 'monitor' },
        { id: 7, name: 'Смарт-часы', slug: 'smartwatch' },
        { id: 8, name: 'Планшеты', slug: 'tablet' }
    ];
    res.json(categories);
});

// API для корзины (пока временное хранилище в памяти)
let cart = [];

app.get('/api/cart', (req, res) => {
    res.json(cart);
});

app.post('/api/cart', (req, res) => {
    const { productId, quantity = 1 } = req.body;
    
    // Находим товар
    const product = getTestProducts().find(p => p.id == productId);
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    // Проверяем есть ли уже в корзине
    const existingItem = cart.find(item => item.id == productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }
    
    res.json({ success: true, cart: cart });
});

app.delete('/api/cart/:id', (req, res) => {
    const { id } = req.params;
    cart = cart.filter(item => item.id != id);
    res.json({ success: true, cart: cart });
});

app.delete('/api/cart', (req, res) => {
    cart = [];
    res.json({ success: true, cart: [] });
});

// Вспомогательные функции
function getCategoryName(categoryId) {
    const categories = {
        1: 'smartphone',
        2: 'laptop', 
        3: 'tv',
        4: 'headphones',
        5: 'console',
        6: 'monitor',
        7: 'smartwatch',
        8: 'tablet'
    };
    return categories[categoryId] || 'other';
}

function getDefaultImage(categoryId) {
    const images = {
        1: 'images/iphone.jpg',
        2: 'images/macbook.jpg',
        3: 'images/sony-tv.jpg',
        4: 'images/airpods.jpg',
        5: 'images/ps5.jpg',
        6: 'images/monitor.jpg',
        7: 'images/watch.jpg',
        8: 'images/ipad.jpg'
    };
    return images[categoryId] || 'images/default.jpg';
}

function getTestProducts() {
    return [
        {
            id: 1,
            title: "iPhone 15 Pro",
            price: 99990,
            category: "smartphone",
            brand: "apple",
            description: "Новый флагман Apple с процессором A17 Pro",
            image: "images/iphone.jpg",
            rating: 4.8,
            reviews: 128,
            stock: 10,
            availability: "in-stock"
        },
        {
            id: 2,
            title: "Samsung Galaxy S23 Ultra",
            price: 89990,
            category: "smartphone",
            brand: "samsung",
            description: "Смартфон с лучшей камерой на рынке",
            image: "images/samsung.jpg",
            rating: 4.7,
            reviews: 94,
            stock: 5,
            availability: "in-stock"
        },
        {
            id: 3,
            title: "MacBook Air M2",
            price: 129990,
            category: "laptop",
            brand: "apple",
            description: "Ультратонкий ноутбук с чипом Apple M2",
            image: "images/macbook.jpg",
            rating: 4.9,
            reviews: 76,
            stock: 3,
            availability: "in-stock"
        },
        {
            id: 4,
            title: "Xiaomi Redmi Note 12",
            price: 24990,
            category: "smartphone",
            brand: "xiaomi",
            description: "Бюджетный смартфон с AMOLED-экраном",
            image: "images/xiaomi.jpg",
            rating: 4.3,
            reviews: 215,
            stock: 15,
            availability: "in-stock"
        },
        {
            id: 5,
            title: "Sony Bravia XR-55A80L",
            price: 159990,
            category: "tv",
            brand: "sony",
            description: "OLED телевизор с процессором Cognitive Processor XR",
            image: "images/sony-tv.jpg",
            rating: 4.6,
            reviews: 42,
            stock: 2,
            availability: "in-stock"
        },
        {
            id: 6,
            title: "Samsung Odyssey G7",
            price: 64990,
            category: "monitor",
            brand: "samsung",
            description: 'Игровой монитор 27" 240Hz',
            image: "images/monitor.jpg",
            rating: 4.5,
            reviews: 89,
            stock: 0,
            availability: "out-of-stock"
        },
        {
            id: 7,
            title: "AirPods Pro 2",
            price: 24990,
            category: "headphones",
            brand: "apple",
            description: "Наушники с активным шумоподавлением",
            image: "images/airpods.jpg",
            rating: 4.7,
            reviews: 312,
            stock: 8,
            availability: "in-stock"
        }
    ];
}

// Запуск сервера
const PORT = 3000;

app.listen(PORT, async () => {
    console.log('='.repeat(50));
    console.log(`🚀 Сервер запущен`);
    console.log(`📡 Порт: ${PORT}`);
    console.log(`🌐 Сайт: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log(`📊 API тест БД: http://localhost:${PORT}/api/db-test`);
    console.log(`📦 API товары: http://localhost:${PORT}/api/products`);
    console.log(`🔍 API поиск: http://localhost:${PORT}/api/products/search?query=iphone`);
    console.log(`🛒 API корзина: http://localhost:${PORT}/api/cart`);
    console.log('='.repeat(50));
    
    // Автоподключение к БД
    await connectDB();
});

// Обработка завершения
process.on('SIGINT', async () => {
    if (pool) {
        await pool.close();
        console.log('🔌 Подключение к БД закрыто');
    }
    process.exit(0);
});