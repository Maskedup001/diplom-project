// logout.js - полный рабочий код
function logoutUser() {
    if (!confirm('Вы уверены, что хотите выйти из аккаунта?')) {
        return;
    }
    
    console.log('🔄 Выход из аккаунта...');
    
    const token = localStorage.getItem('token');
    
    if (token) {
        fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                console.log('✅ Запрос на выход отправлен');
            }
        })
        .catch(err => {
            console.log('⚠️ Сервер недоступен, выход выполнен локально');
        });
    }
    
    // ✅ ПРИ ВЫХОДЕ - УДАЛЯЕМ ВСЁ!
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user_orders');
    localStorage.removeItem('searchQuery');
    localStorage.removeItem('cart');
    localStorage.removeItem('local_cart');
    localStorage.removeItem('remember_me');
    
    console.log('✅ Все данные очищены, корзина удалена');
    
    if (typeof window.updateHeaderAuth === 'function') {
        window.updateHeaderAuth();
    } else if (typeof updateHeaderAuth === 'function') {
        updateHeaderAuth();
    }
    
    window.location.href = 'index.html';
}

window.logoutUser = logoutUser;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { logoutUser };
}

console.log('✅ logout.js загружен (ПРИ ВЫХОДЕ КОРЗИНА УДАЛЯЕТСЯ!)');