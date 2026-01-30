const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

// Настройки
app.use(cors());
app.use(express.json());

// Путь к фронтенду
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// JWT секрет
const JWT_SECRET = 'technomir_secret_key_2024';

// КОНФИГ ДЛЯ SQL SERVER
const dbConfig = {
    server: 'localhost',
    database: 'OnlineShopDB',
    user: 'shop_user',
    password: 'shop123',
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
        pool = await sql.connect(dbConfig);
        console.log('✅ БД подключена успешно!');
        
        // Тестовый запрос
        const result = await pool.request().query('SELECT 1 as test');
        console.log('✅ Тестовый запрос выполнен');
        
        return pool;
    } catch (err) {
        console.error('❌ ОШИБКА ПОДКЛЮЧЕНИЯ К БД:', err.message);
        console.error('Детали ошибки:', err);
        return null;
    }
}

// ========== API МАРШРУТЫ ==========

// Тест подключения к БД
app.get('/api/db-test', async (req, res) => {
    try {
        if (!pool) {
            await connectDB();
        }
        
        if (pool) {
            const result = await pool.request().query('SELECT @@VERSION as version');
            res.json({
                success: true,
                message: '✅ БД подключена',
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
        console.error('Ошибка в db-test:', err);
        res.json({ 
            success: false, 
            error: err.message,
            details: err.toString()
        });
    }
});

// ========== АВТОРИЗАЦИЯ ==========

// Регистрация - УПРОЩЕННЫЙ ВАРИАНТ
app.post('/api/auth/register', async (req, res) => {
    console.log('📝 Получен запрос на регистрацию');
    console.log('Данные:', req.body);
    
    try {
        const { username, email, password, full_name, phone } = req.body;

        // Валидация
        if (!username || !email || !password) {
            console.log('❌ Не все поля заполнены');
            return res.status(400).json({ 
                error: 'Заполните все обязательные поля',
                received: req.body 
            });
        }

        // Подключаемся к БД если нет соединения
        if (!pool) {
            console.log('🔄 Подключаемся к БД...');
            await connectDB();
            if (!pool) {
                console.log('❌ Нет подключения к БД');
                return res.status(500).json({ error: 'Нет подключения к базе данных' });
            }
        }

        console.log('🔍 Проверяем существующего пользователя...');
        
        // Проверяем есть ли такой пользователь
        let userCheck;
        try {
            userCheck = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('username', sql.NVarChar, username)
                .query('SELECT id FROM Users WHERE email = @email OR username = @username');
            
            console.log('Результат проверки:', userCheck.recordset);
        } catch (sqlErr) {
            console.error('❌ ОШИБКА SQL при проверке пользователя:', sqlErr.message);
            console.error('SQL детали:', sqlErr);
            return res.status(500).json({ 
                error: 'Ошибка проверки пользователя',
                sqlError: sqlErr.message 
            });
        }

        if (userCheck.recordset.length > 0) {
            console.log('❌ Пользователь уже существует');
            return res.status(400).json({ 
                error: 'Пользователь с таким email или именем уже существует',
                existingUsers: userCheck.recordset 
            });
        }

        console.log('🔐 Хешируем пароль...');
        // Хешируем пароль
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
            console.log('✅ Пароль захэширован');
        } catch (hashErr) {
            console.error('❌ Ошибка хеширования пароля:', hashErr);
            return res.status(500).json({ error: 'Ошибка обработки пароля' });
        }

        console.log('👤 Создаем пользователя...');
        // Создаем пользователя
        let result;
        try {
            result = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .input('password_hash', sql.NVarChar, hashedPassword)
                .input('full_name', sql.NVarChar, full_name || null)
                .input('phone', sql.NVarChar, phone || null)
                .query(`
                    INSERT INTO Users (username, email, password_hash, full_name, phone)
                    OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.full_name, INSERTED.created_at
                    VALUES (@username, @email, @password_hash, @full_name, @phone)
                `);
            
            console.log('✅ Пользователь создан:', result.recordset[0]);
        } catch (insertErr) {
            console.error('❌ ОШИБКА SQL при создании пользователя:', insertErr.message);
            console.error('SQL код ошибки:', insertErr.code);
            console.error('SQL номер ошибки:', insertErr.number);
            console.error('SQL состояние:', insertErr.state);
            console.error('SQL процедура:', insertErr.procName);
            console.error('SQL текст:', insertErr.originalError?.info?.message);
            
            return res.status(500).json({ 
                error: 'Ошибка создания пользователя в БД',
                sqlError: insertErr.message,
                sqlCode: insertErr.code,
                sqlNumber: insertErr.number
            });
        }

        const user = result.recordset[0];

        console.log('🔑 Создаем JWT токен...');
        // Создаем JWT токен
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                email: user.email 
            }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        console.log('✅ Регистрация успешна!');
        console.log('Пользователь:', user);
        console.log('Токен создан (длина:', token.length, 'символов)');

        res.json({
            success: true,
            message: 'Регистрация успешна',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                created_at: user.created_at
            },
            token: token
        });

    } catch (err) {
        console.error('❌ ОБЩАЯ ОШИБКА РЕГИСТРАЦИИ:', err);
        console.error('Стек ошибки:', err.stack);
        res.status(500).json({ 
            error: 'Внутренняя ошибка сервера при регистрации',
            details: err.message,
            stack: err.stack
        });
    }
});

// Вход - УПРОЩЕННЫЙ
app.post('/api/auth/login', async (req, res) => {
    console.log('🔑 Получен запрос на вход');
    console.log('Данные:', req.body);
    
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Заполните все поля' });
        }

        if (!pool) await connectDB();

        // Ищем пользователя
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const user = result.recordset[0];

        // Проверяем пароль
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Создаем JWT токен
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                email: user.email 
            }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Вход выполнен',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                created_at: user.created_at
            },
            token
        });

    } catch (err) {
        console.error('Ошибка входа:', err);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// ========== ТОВАРЫ ==========

// Получить все товары
app.get('/api/products', async (req, res) => {
    try {
        if (!pool) await connectDB();
        
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

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
        res.status(500).json({ error: 'Ошибка получения товаров' });
    }
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
        8: 'tablet',
        9: 'appliances'
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
        8: 'images/ipad.jpg',
        9: 'images/appliances_photo.png'
    };
    return images[categoryId] || 'images/default.jpg';
}

// ========== ЗАПУСК СЕРВЕРА ==========

const PORT = 3000;

app.listen(PORT, async () => {
    console.log('='.repeat(50));
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Сайт: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('📋 Доступные API:');
    console.log(`🔐 Регистрация: POST http://localhost:${PORT}/api/auth/register`);
    console.log(`🔑 Вход: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`📦 Товары: GET http://localhost:${PORT}/api/products`);
    console.log(`📊 Тест БД: GET http://localhost:${PORT}/api/db-test`);
    console.log('='.repeat(50));
    
    // Подключаемся к БД
    await connectDB();
});