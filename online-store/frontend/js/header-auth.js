// header-auth.js - управление отображением кнопок входа/выхода

document.addEventListener('DOMContentLoaded', function() {
    updateHeaderAuth();
    setupLogoutHandler();
});

function updateHeaderAuth() {
    // Проверяем есть ли пользователь в localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Получаем элементы по ID
    const loginLink = document.getElementById('login-nav-link');
    const registerLink = document.getElementById('register-nav-link');
    const profileLink = document.getElementById('profile-nav-link');
    const logoutLink = document.getElementById('logout-nav-link');
    
    // Если элементы не найдены - выходим
    if (!loginLink || !registerLink || !profileLink || !logoutLink) {
        console.log('Header auth: Не все элементы найдены');
        return;
    }
    
    if (user) {
        // Пользователь авторизован
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        profileLink.style.display = 'block';
        logoutLink.style.display = 'block';
        console.log('Header auth: Пользователь авторизован');
    } else {
        // Не авторизован
        loginLink.style.display = 'block';
        registerLink.style.display = 'block';
        profileLink.style.display = 'none';
        logoutLink.style.display = 'none';
        console.log('Header auth: Пользователь не авторизован');
    }
}

function setupLogoutHandler() {
    // Обработчик для кнопки "Выйти"
    document.addEventListener('click', function(event) {
        if (event.target.id === 'logout-nav-link') {
            logout();
        }
    });
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        // Очищаем данные пользователя
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Обновляем header
        updateHeaderAuth();
        
        // Если мы на странице профиля - перенаправляем на главную
        if (window.location.pathname.includes('profile.html')) {
            window.location.href = 'index.html';
        }
        
        console.log('Выход выполнен');
    }
}

// Экспортируем для использования в других файлах
window.updateHeaderAuth = updateHeaderAuth;