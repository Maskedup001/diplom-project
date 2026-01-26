const sql = require('mssql');

async function test() {
    console.log('🔧 ФИНАЛЬНЫЙ ТЕСТ SQL SERVER 2017');
    console.log('='.repeat(50));
    
    const configs = [
        {
            name: 'Основной с инстансом',
            config: {
                server: 'LAPTOP-TLRNLROF\\MSSQLSERVER',
                database: 'OnlineShopDB',
                options: {
                    trustedConnection: true,
                    trustServerCertificate: true,
                    encrypt: false
                }
            }
        },
        {
            name: 'С шифрованием',
            config: {
                server: 'LAPTOP-TLRNLROF\\MSSQLSERVER',
                database: 'OnlineShopDB',
                options: {
                    trustedConnection: true,
                    trustServerCertificate: true,
                    encrypt: true
                }
            }
        },
        {
            name: 'Локальный хост',
            config: {
                server: 'localhost\\MSSQLSERVER',
                database: 'OnlineShopDB',
                options: {
                    trustedConnection: true,
                    trustServerCertificate: true,
                    encrypt: false
                }
            }
        }
    ];
    
    for (const test of configs) {
        console.log(`\n🔍 Тестирую: ${test.name}`);
        console.log(`   Сервер: ${test.config.server}`);
        
        try {
            const pool = await sql.connect(test.config);
            
            // 1. Проверяем версию
            const version = await pool.request().query('SELECT @@VERSION as v');
            console.log(`   ✅ Подключено!`);
            console.log(`      Версия: ${version.recordset[0].v.split('\n')[0]}`);
            
            // 2. Проверяем базы данных
            const databases = await pool.request().query(`
                SELECT name, state_desc 
                FROM sys.databases 
                WHERE name IN ('master', 'OnlineShopDB')
                ORDER BY name
            `);
            
            console.log(`   📊 Базы данных:`);
            databases.recordset.forEach(db => {
                console.log(`      ${db.name}: ${db.state_desc}`);
            });
            
            // 3. Проверяем OnlineShopDB
            const onlineShopExists = databases.recordset.find(db => db.name === 'OnlineShopDB');
            
            if (onlineShopExists) {
                console.log(`   📦 Проверяю OnlineShopDB...`);
                
                // Переключаемся на OnlineShopDB
                await pool.request().query('USE OnlineShopDB');
                
                // Проверяем таблицы
                const tables = await pool.request().query(`
                    SELECT 
                        t.name as table_name,
                        (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id = t.object_id) as columns_count
                    FROM sys.tables t
                    WHERE t.type = 'U'
                    ORDER BY t.name
                `);
                
                console.log(`   📋 Таблицы в OnlineShopDB:`);
                if (tables.recordset.length > 0) {
                    tables.recordset.forEach((table, i) => {
                        console.log(`      ${i+1}. ${table.table_name} (${table.columns_count} колонок)`);
                    });
                    
                    // Проверяем таблицу Products
                    const productsTable = tables.recordset.find(t => t.table_name === 'Products');
                    if (productsTable) {
                        const productsCount = await pool.request().query('SELECT COUNT(*) as cnt FROM Products');
                        console.log(`   📊 Товаров в Products: ${productsCount.recordset[0].cnt}`);
                        
                        // Покажем первые 3 товара
                        if (productsCount.recordset[0].cnt > 0) {
                            const sample = await pool.request().query('SELECT TOP 3 ProductName, Price FROM Products');
                            console.log(`   🛒 Пример товаров:`);
                            sample.recordset.forEach((p, i) => {
                                console.log(`      ${i+1}. ${p.ProductName} - ${p.Price} руб.`);
                            });
                        }
                    } else {
                        console.log(`   ⚠️  Таблица Products не существует!`);
                    }
                } else {
                    console.log(`   ⚠️  В базе нет таблиц!`);
                }
            } else {
                console.log(`   ⚠️  База OnlineShopDB не существует!`);
                console.log(`      Создай: CREATE DATABASE OnlineShopDB`);
            }
            
            await pool.close();
            
            console.log(`\n🎉 ЭТОТ КОНФИГ РАБОТАЕТ! Используй его в server.js`);
            console.log(JSON.stringify(test.config, null, 2));
            return test.config;
            
        } catch (err) {
            console.log(`   ❌ Ошибка: ${err.message.split('\n')[0]}`);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('❌ НИ ОДИН КОНФИГ НЕ СРАБОТАЛ');
    return null;
}

// Запуск
test().then(config => {
    if (config) {
        console.log('\n✨ КОНФИГ ДЛЯ server.js:');
        console.log('```javascript');
        console.log(`const config = ${JSON.stringify(config, null, 2)};`);
        console.log('```');
    }
});