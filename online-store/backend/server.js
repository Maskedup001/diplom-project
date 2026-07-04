require('dotenv').config();

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
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
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
        console.log('Подключаюсь к SQL Server...');
        pool = await sql.connect(dbConfig);
        console.log('БД подключена успешно!');
        
        await createCartTable();
        
        return pool;
    } catch (err) {
        console.error('Ошибка подключения к БД:', err.message);
        return null;
    }
}

// Создание таблицы корзины
async function createCartTable() {
    try {
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Cart' AND xtype='U')
            CREATE TABLE Cart (
                id INT IDENTITY(1,1) PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT GETDATE(),
                updated_at DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (user_id) REFERENCES Users(id),
                FOREIGN KEY (product_id) REFERENCES Products(ProductID)
            )
        `);
        console.log('Таблица Cart создана/проверена');

        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Cart_user_id')
            CREATE INDEX IX_Cart_user_id ON Cart(user_id)
        `);
        console.log('Индекс для Cart создан/проверен');
    } catch (err) {
        console.log('Таблица Cart уже существует или ошибка:', err.message);
    }
}

// Middleware для проверки JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Ошибка проверки токена:', err.message);
            return res.status(403).json({ error: 'Неверный токен' });
        }
        req.user = user;
        next();
    });
}

// Middleware для опциональной авторизации
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
}

// Middleware для проверки прав администратора
function isAdmin(req, res, next) {
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
    }
    next();
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
                message: 'БД подключена',
                version: result.recordset[0].version.substring(0, 100)
            });
        } else {
            res.json({ success: false, message: 'Не удалось подключиться к БД' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== АВТОРИЗАЦИЯ ==========

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, full_name, phone } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Заполните все обязательные поля' });
        }

        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'Нет подключения к БД' });
        }

        const userCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('username', sql.NVarChar, username)
            .query('SELECT id FROM Users WHERE email = @email OR username = @username');

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email или именем уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('password_hash', sql.NVarChar, hashedPassword)
            .input('full_name', sql.NVarChar, full_name || null)
            .input('phone', sql.NVarChar, phone || null)
            .query(`
                INSERT INTO Users (username, email, password_hash, full_name, phone, is_admin)
                OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.full_name, INSERTED.created_at
                VALUES (@username, @email, @password_hash, @full_name, @phone, 0)
            `);

        const user = result.recordset[0];

        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                is_admin: false
            }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Регистрация успешна',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                created_at: user.created_at,
                is_admin: false
            },
            token
        });

    } catch (err) {
        console.error('Ошибка регистрации:', err);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Заполните все поля' });
        }

        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'Нет подключения к БД' });
        }

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const user = result.recordset[0];

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                is_admin: user.is_admin || false
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
                created_at: user.created_at,
                is_admin: user.is_admin || false
            },
            token
        });

    } catch (err) {
        console.error('Ошибка входа:', err);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// Выход
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        console.log(`Пользователь ${req.user.id} вышел из системы`);
        res.json({
            success: true,
            message: 'Выход выполнен'
        });
    } catch (err) {
        console.error('Ошибка выхода:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========== ПРОФИЛЬ ==========

// Получить профиль
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'Нет подключения к БД' });
        }

        const result = await pool.request()
            .input('id', sql.Int, req.user.id)
            .query(`
                SELECT id, username, email, full_name, phone, is_admin, created_at
                FROM Users WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({
            success: true,
            user: result.recordset[0]
        });

    } catch (err) {
        console.error('Ошибка получения профиля:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить профиль
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { username, email, full_name, phone } = req.body;

        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'Нет подключения к БД' });
        }

        const checkResult = await pool.request()
            .input('id', sql.Int, req.user.id)
            .input('email', sql.NVarChar, email)
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT id FROM Users 
                WHERE (email = @email OR username = @username) AND id != @id
            `);

        if (checkResult.recordset.length > 0) {
            return res.status(400).json({ error: 'Email или имя пользователя уже заняты' });
        }

        await pool.request()
            .input('id', sql.Int, req.user.id)
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('full_name', sql.NVarChar, full_name || null)
            .input('phone', sql.NVarChar, phone || null)
            .query(`
                UPDATE Users 
                SET username = @username, 
                    email = @email, 
                    full_name = @full_name, 
                    phone = @phone,
                    updated_at = GETDATE()
                WHERE id = @id
            `);

        res.json({
            success: true,
            message: 'Профиль обновлен'
        });

    } catch (err) {
        console.error('Ошибка обновления профиля:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========== УДАЛЕНИЕ АККАУНТА ==========
app.delete('/api/profile', authenticateToken, async (req, res) => {
    try {
        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'Нет подключения к БД' });
        }

        const userId = req.user.id;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await transaction.request()
                .input('user_id', sql.Int, userId)
                .query('DELETE FROM Cart WHERE user_id = @user_id');
            
            await transaction.request()
                .input('user_id', sql.Int, userId)
                .query(`
                    DELETE oi FROM OrderItems oi
                    INNER JOIN Orders o ON oi.order_id = o.id
                    WHERE o.user_id = @user_id
                `);

            await transaction.request()
                .input('user_id', sql.Int, userId)
                .query('DELETE FROM Orders WHERE user_id = @user_id');

            await transaction.request()
                .input('id', sql.Int, userId)
                .query('DELETE FROM Users WHERE id = @id');

            await transaction.commit();

            console.log(`Пользователь ${userId} удалил аккаунт`);

            res.json({
                success: true,
                message: 'Аккаунт успешно удален'
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error('Ошибка удаления аккаунта:', err);
        res.status(500).json({ 
            error: 'Ошибка удаления аккаунта',
            details: err.message 
        });
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
                ImageURL
            FROM Products
            ORDER BY ProductID
        `);
        
        const products = result.recordset.map(item => {
            let images = [];
            try {
                if (item.ImageURL) {
                    images = JSON.parse(item.ImageURL);
                }
            } catch (e) {
                if (item.ImageURL) {
                    images = [item.ImageURL];
                }
            }
            
            if (images.length === 0) {
                images = [getDefaultImage(item.categoryId)];
            }
            
            return {
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
                images: images,
                image: images[0]
            };
        });
        
        res.json(products);
        
    } catch (err) {
        console.error('Ошибка при получении товаров из БД:', err.message);
        res.status(500).json({ error: 'Ошибка получения товаров' });
    }
});

// Получить товар по ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
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
                    ImageURL
                FROM Products
                WHERE ProductID = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        const item = result.recordset[0];
        
        let images = [];
        try {
            if (item.ImageURL) {
                images = JSON.parse(item.ImageURL);
            }
        } catch (e) {
            if (item.ImageURL) {
                images = [item.ImageURL];
            }
        }
        
        if (images.length === 0) {
            images = [getDefaultImage(item.categoryId)];
        }
        
        const product = {
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
            images: images,
            image: images[0]
        };

        res.json(product);

    } catch (err) {
        console.error('Ошибка при получении товара:', err.message);
        res.status(500).json({ error: 'Ошибка получения товара' });
    }
});

// ========== КОРЗИНА (СЕРВЕРНАЯ) ==========

// ПОЛУЧИТЬ корзину пользователя
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        const result = await pool.request()
            .input('user_id', sql.Int, req.user.id)
            .query(`
                SELECT 
                    c.id as cart_id,
                    c.quantity,
                    p.ProductID as id,
                    p.ProductName as title,
                    p.Price as price,
                    p.ImageURL as image,
                    p.Brand as brand,
                    p.StockQuantity as stock
                FROM Cart c
                JOIN Products p ON c.product_id = p.ProductID
                WHERE c.user_id = @user_id
                ORDER BY c.created_at DESC
            `);

        const cartItems = result.recordset.map(item => ({
            ...item,
            image: item.image ? (JSON.parse(item.image)[0] || item.image) : 'images/default.jpg'
        }));

        res.json(cartItems);
    } catch (err) {
        console.error('Ошибка получения корзины:', err);
        res.status(500).json({ error: 'Ошибка получения корзины' });
    }
});

// ДОБАВИТЬ товар в корзину
app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Не указан товар' });
        }

        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        const existing = await pool.request()
            .input('user_id', sql.Int, req.user.id)
            .input('product_id', sql.Int, productId)
            .query(`
                SELECT id, quantity FROM Cart 
                WHERE user_id = @user_id AND product_id = @product_id
            `);

        if (existing.recordset.length > 0) {
            const cartItem = existing.recordset[0];
            const newQuantity = cartItem.quantity + quantity;

            await pool.request()
                .input('id', sql.Int, cartItem.id)
                .input('quantity', sql.Int, newQuantity)
                .input('updated_at', sql.DateTime, new Date())
                .query(`
                    UPDATE Cart 
                    SET quantity = @quantity, updated_at = @updated_at
                    WHERE id = @id
                `);
        } else {
            await pool.request()
                .input('user_id', sql.Int, req.user.id)
                .input('product_id', sql.Int, productId)
                .input('quantity', sql.Int, quantity)
                .input('created_at', sql.DateTime, new Date())
                .input('updated_at', sql.DateTime, new Date())
                .query(`
                    INSERT INTO Cart (user_id, product_id, quantity, created_at, updated_at)
                    VALUES (@user_id, @product_id, @quantity, @created_at, @updated_at)
                `);
        }

        const updatedCart = await pool.request()
            .input('user_id', sql.Int, req.user.id)
            .query(`
                SELECT 
                    c.id as cart_id,
                    c.quantity,
                    p.ProductID as id,
                    p.ProductName as title,
                    p.Price as price,
                    p.ImageURL as image,
                    p.Brand as brand
                FROM Cart c
                JOIN Products p ON c.product_id = p.ProductID
                WHERE c.user_id = @user_id
            `);

        const cartItems = updatedCart.recordset.map(item => ({
            ...item,
            image: item.image ? (JSON.parse(item.image)[0] || item.image) : 'images/default.jpg'
        }));

        res.json({
            success: true,
            message: 'Товар добавлен в корзину',
            cart: cartItems
        });

    } catch (err) {
        console.error('Ошибка добавления в корзину:', err);
        res.status(500).json({ error: 'Ошибка добавления в корзину' });
    }
});

// ОБНОВИТЬ количество товара в корзине
app.put('/api/cart/:cartId', authenticateToken, async (req, res) => {
    try {
        const { cartId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Некорректное количество' });
        }

        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        const checkResult = await pool.request()
            .input('id', sql.Int, cartId)
            .input('user_id', sql.Int, req.user.id)
            .query('SELECT id FROM Cart WHERE id = @id AND user_id = @user_id');

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Товар не найден в корзине' });
        }

        await pool.request()
            .input('id', sql.Int, cartId)
            .input('quantity', sql.Int, quantity)
            .input('updated_at', sql.DateTime, new Date())
            .query('UPDATE Cart SET quantity = @quantity, updated_at = @updated_at WHERE id = @id');

        res.json({ 
            success: true, 
            message: 'Количество обновлено' 
        });

    } catch (err) {
        console.error('Ошибка обновления корзины:', err);
        res.status(500).json({ error: 'Ошибка обновления корзины' });
    }
});

// УДАЛИТЬ товар из корзины
app.delete('/api/cart/:cartId', authenticateToken, async (req, res) => {
    try {
        const { cartId } = req.params;

        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        await pool.request()
            .input('id', sql.Int, cartId)
            .input('user_id', sql.Int, req.user.id)
            .query('DELETE FROM Cart WHERE id = @id AND user_id = @user_id');

        res.json({ 
            success: true, 
            message: 'Товар удален из корзины' 
        });

    } catch (err) {
        console.error('Ошибка удаления из корзины:', err);
        res.status(500).json({ error: 'Ошибка удаления из корзины' });
    }
});

// ОЧИСТИТЬ корзину пользователя
app.delete('/api/cart', authenticateToken, async (req, res) => {
    try {
        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        await pool.request()
            .input('user_id', sql.Int, req.user.id)
            .query('DELETE FROM Cart WHERE user_id = @user_id');

        res.json({ 
            success: true, 
            message: 'Корзина очищена' 
        });

    } catch (err) {
        console.error('Ошибка очистки корзины:', err);
        res.status(500).json({ error: 'Ошибка очистки корзины' });
    }
});

// ========== ЗАКАЗЫ ==========

// Создать новый заказ
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { items, total_amount, shipping_address, phone, email, notes } = req.body;
        const userId = req.user.id;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Корзина пуста' });
        }

        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        for (const item of items) {
            const product = await pool.request()
                .input('id', sql.Int, item.id)
                .query('SELECT StockQuantity FROM Products WHERE ProductID = @id');
            
            if (product.recordset.length === 0) {
                return res.status(404).json({ error: `Товар "${item.title}" не найден` });
            }
            
            if (product.recordset[0].StockQuantity < item.quantity) {
                return res.status(400).json({ 
                    error: `Товара "${item.title}" нет в нужном количестве. Доступно: ${product.recordset[0].StockQuantity}`
                });
            }
        }

        const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const orderResult = await transaction.request()
                .input('user_id', sql.Int, userId)
                .input('order_number', sql.NVarChar, orderNumber)
                .input('total_amount', sql.Decimal(10,2), total_amount)
                .input('shipping_address', sql.NVarChar, shipping_address || null)
                .input('phone', sql.NVarChar, phone)
                .input('email', sql.NVarChar, email || null)
                .input('notes', sql.NVarChar, notes || null)
                .query(`
                    INSERT INTO Orders (user_id, order_number, total_amount, shipping_address, phone, email, notes, status)
                    OUTPUT INSERTED.id, INSERTED.order_number
                    VALUES (@user_id, @order_number, @total_amount, @shipping_address, @phone, @email, @notes, 'pending')
                `);

            const orderId = orderResult.recordset[0].id;
            const orderNumber_ = orderResult.recordset[0].order_number;

            for (const item of items) {
                await transaction.request()
                    .input('order_id', sql.Int, orderId)
                    .input('product_id', sql.Int, item.id)
                    .input('product_name', sql.NVarChar, item.title)
                    .input('product_price', sql.Decimal(10,2), item.price)
                    .input('quantity', sql.Int, item.quantity)
                    .input('total_price', sql.Decimal(10,2), item.price * item.quantity)
                    .query(`
                        INSERT INTO OrderItems (order_id, product_id, product_name, product_price, quantity, total_price)
                        VALUES (@order_id, @product_id, @product_name, @product_price, @quantity, @total_price)
                    `);

                await transaction.request()
                    .input('id', sql.Int, item.id)
                    .input('quantity', sql.Int, item.quantity)
                    .query('UPDATE Products SET StockQuantity = StockQuantity - @quantity WHERE ProductID = @id');
            }

            await transaction.request()
                .input('user_id', sql.Int, userId)
                .query('DELETE FROM Cart WHERE user_id = @user_id');

            await transaction.commit();

            res.json({
                success: true,
                message: 'Заказ успешно создан',
                order: {
                    id: orderId,
                    order_number: orderNumber_
                }
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error('Ошибка создания заказа:', err);
        res.status(500).json({ error: 'Ошибка создания заказа' });
    }
});

// Получить заказы пользователя
app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
    try {
        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        const result = await pool.request()
            .input('user_id', sql.Int, req.user.id)
            .query(`
                SELECT 
                    o.id,
                    o.order_number,
                    o.total_amount,
                    o.status,
                    o.shipping_address,
                    o.phone,
                    o.email,
                    o.created_at,
                    (
                        SELECT SUM(quantity) 
                        FROM OrderItems oi 
                        WHERE oi.order_id = o.id
                    ) as items_count
                FROM Orders o
                WHERE o.user_id = @user_id
                ORDER BY o.created_at DESC
            `);

        res.json(result.recordset);

    } catch (err) {
        console.error('Ошибка получения заказов:', err);
        res.status(500).json({ error: 'Ошибка получения заказов' });
    }
});

// Получить детали заказа по ID
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        const orderResult = await pool.request()
            .input('id', sql.Int, id)
            .input('user_id', sql.Int, req.user.id)
            .query(`
                SELECT 
                    id,
                    order_number,
                    total_amount,
                    status,
                    shipping_address,
                    phone,
                    email,
                    notes,
                    created_at
                FROM Orders 
                WHERE id = @id AND user_id = @user_id
            `);

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }

        const itemsResult = await pool.request()
            .input('order_id', sql.Int, id)
            .query(`
                SELECT 
                    id,
                    product_id,
                    product_name,
                    product_price,
                    quantity,
                    total_price
                FROM OrderItems 
                WHERE order_id = @order_id
            `);

        const order = orderResult.recordset[0];
        order.items = itemsResult.recordset;

        res.json(order);

    } catch (err) {
        console.error('Ошибка получения деталей заказа:', err);
        res.status(500).json({ error: 'Ошибка получения деталей заказа' });
    }
});

// Отменить заказ (для пользователя) - ВОЗВРАЩАЕТ ТОВАРЫ НА СКЛАД
app.put('/api/orders/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'Нет подключения к БД' });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const checkResult = await transaction.request()
                .input('id', sql.Int, id)
                .input('user_id', sql.Int, userId)
                .query('SELECT id, status FROM Orders WHERE id = @id AND user_id = @user_id');

            if (checkResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Заказ не найден' });
            }
            
            const order = checkResult.recordset[0];
            
            if (order.status === 'delivered' || order.status === 'cancelled') {
                await transaction.rollback();
                return res.status(400).json({ error: 'Этот заказ нельзя отменить' });
            }
            
            const itemsResult = await transaction.request()
                .input('order_id', sql.Int, id)
                .query('SELECT product_id, quantity FROM OrderItems WHERE order_id = @order_id');
            
            for (const item of itemsResult.recordset) {
                await transaction.request()
                    .input('product_id', sql.Int, item.product_id)
                    .input('quantity', sql.Int, item.quantity)
                    .query('UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @product_id');
            }
            
            await transaction.request()
                .input('id', sql.Int, id)
                .input('status', sql.NVarChar, 'cancelled')
                .query('UPDATE Orders SET status = @status WHERE id = @id');
            
            await transaction.commit();
            
            res.json({
                success: true,
                message: 'Заказ отменен, товары возвращены на склад'
            });
            
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
        
    } catch (err) {
        console.error('Ошибка отмены заказа:', err);
        res.status(500).json({ 
            error: 'Ошибка отмены заказа',
            details: err.message 
        });
    }
});

// ========== АДМИН-ПАНЕЛЬ ==========

// Получить всех пользователей
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        const result = await pool.request().query(`
            SELECT 
                id, 
                username, 
                email, 
                full_name, 
                phone, 
                is_admin, 
                created_at
            FROM Users
            ORDER BY id DESC
        `);
        
        res.json(result.recordset);
        
    } catch (err) {
        console.error('Ошибка получения пользователей:', err);
        res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
});

// Получить все заказы (ДЛЯ АДМИНА) - ИСПРАВЛЕНО: SUM(quantity)
app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        const result = await pool.request().query(`
            SELECT 
                o.id,
                o.order_number,
                o.total_amount,
                o.status,
                o.shipping_address,
                o.phone,
                o.email,
                o.created_at,
                u.username,
                u.full_name,
                (
                    SELECT SUM(quantity) 
                    FROM OrderItems oi 
                    WHERE oi.order_id = o.id
                ) as items_count
            FROM Orders o
            LEFT JOIN Users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        
        res.json(result.recordset);
        
    } catch (err) {
        console.error('Ошибка получения всех заказов:', err);
        res.status(500).json({ error: 'Ошибка получения заказов' });
    }
});

// Обновить статус заказа (для админа) - ИСПРАВЛЕНО С ВОЗВРАТОМ ТОВАРОВ
app.put('/api/admin/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Неверный статус' });
        }
        
        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        // Начинаем транзакцию
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Получаем текущий статус заказа
            const orderResult = await transaction.request()
                .input('id', sql.Int, id)
                .query('SELECT status FROM Orders WHERE id = @id');

            if (orderResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Заказ не найден' });
            }

            const currentStatus = orderResult.recordset[0].status;

            // Получаем товары из заказа
            const itemsResult = await transaction.request()
                .input('order_id', sql.Int, id)
                .query('SELECT product_id, quantity FROM OrderItems WHERE order_id = @order_id');

            // ЕСЛИ СТАТУС МЕНЯЕТСЯ НА "cancelled" - ВОЗВРАЩАЕМ ТОВАРЫ
            if (status === 'cancelled' && currentStatus !== 'cancelled') {
                for (const item of itemsResult.recordset) {
                    await transaction.request()
                        .input('product_id', sql.Int, item.product_id)
                        .input('quantity', sql.Int, item.quantity)
                        .query('UPDATE Products SET StockQuantity = StockQuantity + @quantity WHERE ProductID = @product_id');
                }
            }
            
            // ЕСЛИ СТАТУС МЕНЯЕТСЯ С "cancelled" НА ДРУГОЙ - ВОССТАНАВЛИВАЕМ ТОВАРЫ (СПИСЫВАЕМ)
            else if (currentStatus === 'cancelled' && status !== 'cancelled') {
                for (const item of itemsResult.recordset) {
                    // Проверяем наличие на складе
                    const product = await transaction.request()
                        .input('product_id', sql.Int, item.product_id)
                        .query('SELECT StockQuantity FROM Products WHERE ProductID = @product_id');
                    
                    if (product.recordset[0].StockQuantity < item.quantity) {
                        await transaction.rollback();
                        return res.status(400).json({ 
                            error: `Недостаточно товара на складе для восстановления заказа`,
                            productId: item.product_id
                        });
                    }
                    
                    await transaction.request()
                        .input('product_id', sql.Int, item.product_id)
                        .input('quantity', sql.Int, item.quantity)
                        .query('UPDATE Products SET StockQuantity = StockQuantity - @quantity WHERE ProductID = @product_id');
                }
            }

            // Обновляем статус заказа
            await transaction.request()
                .input('id', sql.Int, id)
                .input('status', sql.NVarChar, status)
                .query('UPDATE Orders SET status = @status WHERE id = @id');

            await transaction.commit();

            let message = 'Статус заказа обновлен';
            if (status === 'cancelled' && currentStatus !== 'cancelled') {
                message = 'Заказ отменен, товары возвращены на склад';
            } else if (currentStatus === 'cancelled' && status !== 'cancelled') {
                message = 'Заказ восстановлен, товары списаны со склада';
            }

            res.json({
                success: true,
                message
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
        
    } catch (err) {
        console.error('Ошибка обновления статуса:', err);
        res.status(500).json({ 
            error: 'Ошибка обновления статуса',
            details: err.message 
        });
    }
});

// Получить статистику
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (!pool) await connectDB();
        if (!pool) {
            return res.status(500).json({ error: 'База данных недоступна' });
        }

        const totalOrders = await pool.request()
            .query('SELECT COUNT(*) as count FROM Orders');
        
        const totalRevenue = await pool.request()
            .query('SELECT ISNULL(SUM(total_amount), 0) as total FROM Orders WHERE status != \'cancelled\'');
        
        const totalUsers = await pool.request()
            .query('SELECT COUNT(*) as count FROM Users');
        
        const totalProducts = await pool.request()
            .query('SELECT COUNT(*) as count FROM Products');
        
        res.json({
            totalOrders: totalOrders.recordset[0].count,
            totalRevenue: totalRevenue.recordset[0].total,
            totalUsers: totalUsers.recordset[0].count,
            totalProducts: totalProducts.recordset[0].count
        });
        
    } catch (err) {
        console.error('Ошибка получения статистики:', err);
        res.status(500).json({ error: 'Ошибка получения статистики' });
    }
});

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

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
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Сайт: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('Доступные API:');
    console.log(`Регистрация: POST http://localhost:${PORT}/api/auth/register`);
    console.log(`Вход: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`Выход: POST http://localhost:${PORT}/api/auth/logout`);
    console.log(`Профиль: GET http://localhost:${PORT}/api/profile`);
    console.log(`Обновить профиль: PUT http://localhost:${PORT}/api/profile`);
    console.log(`Удалить аккаунт: DELETE http://localhost:${PORT}/api/profile`);
    console.log(`Товары: GET http://localhost:${PORT}/api/products`);
    console.log(`Получить корзину: GET http://localhost:${PORT}/api/cart`);
    console.log(`Добавить в корзину: POST http://localhost:${PORT}/api/cart`);
    console.log(`Обновить количество: PUT http://localhost:${PORT}/api/cart/:cartId`);
    console.log(`Удалить из корзины: DELETE http://localhost:${PORT}/api/cart/:cartId`);
    console.log(`Очистить корзину: DELETE http://localhost:${PORT}/api/cart`);
    console.log(`Создать заказ: POST http://localhost:${PORT}/api/orders`);
    console.log(`Мои заказы: GET http://localhost:${PORT}/api/orders/my-orders`);
    console.log(`Детали заказа: GET http://localhost:${PORT}/api/orders/:id`);
    console.log('--- АДМИН-ПАНЕЛЬ ---');
    console.log(`Все пользователи: GET http://localhost:${PORT}/api/admin/users`);
    console.log(`Все заказы: GET http://localhost:${PORT}/api/admin/orders`);
    console.log(`Обновить статус заказа: PUT http://localhost:${PORT}/api/admin/orders/:id/status`);
    console.log(`Статистика: GET http://localhost:${PORT}/api/admin/stats`);
    console.log('='.repeat(50));
    
    await connectDB();
});

process.on('SIGINT', async () => {
    if (pool) {
        await pool.close();
        console.log('Подключение к БД закрыто');
    }
    process.exit(0);
});