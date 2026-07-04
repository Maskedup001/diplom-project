// header-auth.js - использует общий logoutUser()
document.addEventListener('DOMContentLoaded', function() {
    // Небольшая задержка для гарантии
    setTimeout(updateHeaderAuth, 5);
    setupLogoutHandler();
});

function updateHeaderAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    const loginLink = document.getElementById('login-nav-link');
    const registerLink = document.getElementById('register-nav-link');
    const profileLink = document.getElementById('profile-nav-link');
    const logoutLink = document.getElementById('logout-nav-link');
    const adminLink = document.getElementById('admin-nav-link');
    
    if (!loginLink || !registerLink || !profileLink || !logoutLink) {
        console.log('header-auth: элементы не найдены');
        return;
    }
    
    // Принудительно устанавливаем display для всех
    const allButtons = [loginLink, registerLink, profileLink, logoutLink];
    if (adminLink) allButtons.push(adminLink);
    
    allButtons.forEach(btn => {
        if (btn) btn.style.display = 'inline-flex';
    });
    
    if (user) {
        // Пользователь авторизован
        if (user.username) {
            const isMobile = window.innerWidth <= 768;
            const shortName = user.username.length > 12 && !isMobile ? 
                user.username.substring(0, 12) + '…' : user.username;
            
            profileLink.innerHTML = isMobile ?
                `<img src="images/components/person-profile.png" class="profile-icon"> ${user.username}` :
                `<img src="images/components/person-profile.png" class="profile-icon"> ${shortName}`;
        }
        
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        profileLink.style.display = 'inline-flex';
        logoutLink.style.display = 'inline-flex';
        
        if (adminLink) {
            adminLink.style.display = user.is_admin ? 'inline-flex' : 'none';
        }
        
    } else {
        // Не авторизован
        loginLink.style.display = 'inline-flex';
        registerLink.style.display = 'inline-flex';
        profileLink.style.display = 'none';
        logoutLink.style.display = 'none';
        
        if (adminLink) {
            adminLink.style.display = 'none';
        }
        
        profileLink.innerHTML = 'Личный кабинет';
    }
}

function setupLogoutHandler() {
    document.addEventListener('click', function(event) {
        if (event.target.id === 'logout-nav-link' || 
            event.target.closest('#logout-nav-link')) {
            
            if (typeof window.logoutUser === 'function') {
                window.logoutUser();
            } else if (typeof logoutUser === 'function') {
                logoutUser();
            } else {
                logoutBackup();
            }
        }
    });
}

function logoutBackup() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user_orders');
        localStorage.removeItem('searchQuery');
        localStorage.removeItem('cart');
        localStorage.removeItem('local_cart');
        localStorage.removeItem('remember_me');
        
        updateHeaderAuth();
        window.location.href = 'index.html';
    }
}

window.updateHeaderAuth = updateHeaderAuth;
window.logoutBackup = logoutBackup;

// Обновляем при изменении размера окна с задержкой
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateHeaderAuth, 100);
});

console.log('header-auth.js загружен');