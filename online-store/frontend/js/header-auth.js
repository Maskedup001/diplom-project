// header-auth.js - использует общий logoutUser()
document.addEventListener('DOMContentLoaded', function() {
    updateHeaderAuth();
    setupLogoutHandler();
});

function updateHeaderAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    const loginLink = document.getElementById('login-nav-link');
    const registerLink = document.getElementById('register-nav-link');
    const profileLink = document.getElementById('profile-nav-link');
    const logoutLink = document.getElementById('logout-nav-link');
    
    if (!loginLink || !registerLink || !profileLink || !logoutLink) {
        return;
    }
    
    if (user) {
        // Пользователь авторизован
        
        // Обновляем текст профиля
        if (user.username) {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                profileLink.innerHTML = `
                    <img src="images/components/person-profile.png" alt="Профиль" class="profile-icon">
                    ${user.username}
                `;
            } else {
                const shortName = user.username.length > 15 ? 
                    user.username.substring(0, 12) + '...' : user.username;
                profileLink.innerHTML = `
                    <img src="images/components/person-profile.png" alt="Профиль" class="profile-icon">
                    ${shortName}
                `;
            }
            profileLink.title = 'Личный кабинет';
        }
        
        // Показываем только Личный кабинет и Выйти
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        profileLink.style.display = 'block';
        logoutLink.style.display = 'block';
        
    } else {
        // Не авторизован
        loginLink.style.display = 'block';
        registerLink.style.display = 'block';
        profileLink.style.display = 'none';
        logoutLink.style.display = 'none';
    }
}

function setupLogoutHandler() {
    // Обработчик для кнопки "Выйти" в header
    document.addEventListener('click', function(event) {
        if (event.target.id === 'logout-nav-link' || 
            event.target.closest('#logout-nav-link')) {
            
            // Используем общую функцию выхода
            if (typeof logoutUser === 'function') {
                logoutUser();
            } else {
                // Если общей функции нет
                logoutBackup();
            }
        }
    });
}

// Локальный backup если общая функция не загрузилась
function logoutBackup() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('cart');
        updateHeaderAuth();
        window.location.href = 'index.html';
    }
}

// Делаем функцию глобальной
window.updateHeaderAuth = updateHeaderAuth;

// Обновляем при изменении размера окна
window.addEventListener('resize', updateHeaderAuth);