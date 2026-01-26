const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

const config = {
    server: 'LAPTOP-TLRNLROF',
    database: 'OnlineShopDB',
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
        encrypt: false
    }
};

// Глобальная переменная для пула
let pool = null;

// Функция диагностики БД
async function diagnoseDatabase() {
    try {
        console.log('\n🔍 ДИАГНОСТИКА БАЗЫ ДАННЫХ');
        console.log('='.repeat(50));
        
        // Подключаемся
        console.log('1. Подключаюсь к SQL Server...');
        pool = await sql.connect(config);
        console.log('   ✅ Подключено');
        
        // Проверяем таблицу Products
        console.log('\n2. Проверяю таблицу Products:');
        const productsResult = await pool.request().query(`
            SELECT 
                COUNT(*) as TotalCount,
                SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveCount,
                SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as InactiveCount
            FROM Products
        `);
        
        const stats = productsResult.recordset[0];
        console.log(`   📊 Всего товаров: ${stats.TotalCount}`);
        console.log(`   ✅ Активных: ${stats.ActiveCount}`);
        console.log(`   ⚠️  Неактивных: ${stats.InactiveCount}`);
        
        // Если есть товары, покажем их
        if (stats.TotalCount > 0) {
            console.log('\n3. Содержимое таблицы Products:');
            const allProducts = await pool.request().query(`
                SELECT TOP 10 
                    ProductID,
                    ProductName,
                    Price,
                    CategoryID,
                    Brand,
                    IsActive,
                    StockQuantity
                FROM Products
                ORDER BY ProductID
            `);
            
            allProducts.recordset.forEach((product, index) => {
                console.log(`   ${index+1}. ID:${product.ProductID} "${product.ProductName}"`);
                console.log(`      Цена: ${product.Price}, Категория: ${product.CategoryID}`);
                console.log(`      Бренд: ${product.Brand}, Активен: ${product.IsActive}`);
                console.log(`      В наличии: ${product.StockQuantity}`);
                console.log('   ' + '-'.repeat(40));
            });
        } else {
            console.log('\n❌ ТАБЛИЦА Products ПУСТАЯ!');
            console.log('   Нужно добавить товары через SSMS');
        }
        
        console.log('\n4. Проверяю таблицу Categories:');
        const categoriesResult = await pool.request().query('SELECT COUNT(*) as Count FROM Categories');
        console.log(`   📊 Категорий: ${categoriesResult.recordset[0].Count}`);
        
        console.log('\n' + '='.repeat(50));
        console.log('🔍 ДИАГНОСТИКА ЗАВЕРШЕНА\n');
        
        return pool;
        
    } catch (err) {
        console.error('❌ ОШИБКА ДИАГНОСТИКИ:', err.message);
        console.error('Подробности:', err);
        return null;
    }
}

// API: Получить ВСЕ товары (даже неактивные для теста)
app.get('/api/products', async (req, res) => {
    console.log('\n📡 ЗАПРОС ОТ ФРОНТЕНДА: /api/products');
    
    try {
        if (!pool) {
            pool = await diagnoseDatabase();
        }
        
        if (!pool) {
            console.log('❌ Нет подключения к БД');
            return res.status(500).json({ error: 'Нет подключения к БД' });
        }
        
        // Запрос ВСЕХ товаров без фильтров
        console.log('📊 Выполняю запрос к БД...');
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
                IsActive
            FROM Products
            ORDER BY ProductID
        `);
        
        console.log(`📦 БД вернула ${result.recordset.length} товаров`);
        
        // Если товаров нет, сообщим об этом
        if (result.recordset.length === 0) {
            console.log('⚠️  ВНИМАНИЕ: БД вернула 0 товаров!');
            return res.json([]);
        }
        
        // Преобразуем категории
        const categoryMap = {
            1: 'smartphone',
            2: 'laptop', 
            3: 'tv',
            4: 'headphones',
            5: 'console',
            6: 'monitor',
            7: 'smartwatch',
            8: 'tablet'
        };
        
        const products = result.recordset.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            category: categoryMap[item.categoryId] || 'other',
            brand: item.brand || 'unknown',
            description: item.description || '',
            stock: item.stock || 0,
            rating: item.rating || 4.0,
            reviews: item.reviews || 0,
            availability: (item.stock || 0) > 0 ? 'in-stock' : 'out-of-stock',
            image: `images/${(item.brand || 'default').toLowerCase()}.jpg`
        }));
        
        console.log(`✅ Отправляю ${products.length} товаров`);
        
        // Лог первых 3 товаров
        products.slice(0, 3).forEach((p, i) => {
            console.log(`   ${i+1}. "${p.title}" - ${p.price} руб. (${p.category})`);
        });
        
        res.json(products);
        
    } catch (err) {
        console.error('❌ ОШИБКА API:', err.message);
        res.status(500).json({ 
            error: 'Database error',
            message: err.message 
        });
    }
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, async () => {
    console.log('='.repeat(60));
    console.log(`🚀 ДИАГНОСТИЧЕСКИЙ СЕРВЕР ЗАПУЩЕН`);
    console.log(`📡 Порт: ${PORT}`);
    console.log(`🌐 Сайт: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api/products`);
    console.log('='.repeat(60));
    
    // Запускаем диагностику при старте
    await diagnoseDatabase();
});