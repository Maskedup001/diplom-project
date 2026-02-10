// logout.js - полный рабочий код
function logoutUser() {
    if (!confirm('Вы уверены, что хотите выйти из аккаунта?')) {
        return;
    }
    
    console.log('🔄 Выход из аккаунта...');
    
    // 1. Получаем токен ДО удаления
    const token = localStorage.getItem('token');
    
    // 2. Отправляем запрос на сервер если есть токен
    if (token) {
        fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(err => {
            console.log('Сервер недоступен');
        });
    }
    
    // 3. Очищаем все данные
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    localStorage.removeItem('user_orders');
    localStorage.removeItem('searchQuery');
    
    // 4. Обновляем header
    if (typeof updateHeaderAuth === 'function') {
        updateHeaderAuth();
    }
    
    // 5. ВСЕГДА перенаправляем на главную
    window.location.href = 'index.html';
}

window.logoutUser = logoutUser;