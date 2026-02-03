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
    
    // Проверяем является ли сейчас мобильная версия
    const isMobile = window.innerWidth <= 768;
    
    if (user) {
        // Пользователь авторизован
        
        // Обновляем текст кнопки "Личный кабинет" с именем пользователя
        if (user.username) {
            profileLink.textContent = isMobile ? `👤 ${user.username}` : user.username;
            profileLink.title = 'Личный кабинет';
        } else {
            profileLink.textContent = 'Личный кабинет';
            profileLink.title = 'Личный кабинет';
        }
        
        // Всегда показываем только Личный кабинет и Выйти
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        profileLink.style.display = 'block';
        logoutLink.style.display = 'block';
        
        console.log('Header auth: Пользователь авторизован');
    } else {
        // Не авторизован
        
        // Всегда показываем только Войти и Регистрация
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
        if (event.target.id === 'logout-nav-link' || 
            event.target.closest('#logout-nav-link')) {
            logout();
        }
    });
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        // Очищаем данные пользователя
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('cart');
        
        // Обновляем header
        updateHeaderAuth();
        
        // Если мы на странице профиля - перенаправляем на главную
        if (window.location.pathname.includes('profile.html')) {
            window.location.href = 'index.html';
        } else {
            // На других страницах просто обновляем
            location.reload();
        }
        
        console.log('Выход выполнен');
    }
}

// Обновляем при изменении размера окна
window.addEventListener('resize', updateHeaderAuth);

// Обновляем при любом клике (на случай если меняется авторизация)
document.addEventListener('click', function() {
    setTimeout(updateHeaderAuth, 100);
});

// Экспортируем для использования в других файлах
window.updateHeaderAuth = updateHeaderAuth;
window.logout = logout;