// profile.js - личный кабинет

class ProfileModal {
    constructor() {
        this.modal = document.getElementById('edit-modal');
        this.overlay = document.getElementById('overlay');
        this.form = document.getElementById('edit-profile-form');
        this.init();
    }
    
    init() {
        console.log('ProfileModal: Инициализация');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Открытие модального окна
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.open());
        }
        
        // Закрытие по кнопке ×
        const closeBtn = document.querySelector('[data-modal-close="edit-modal"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Закрытие по кнопке Отмена
        const cancelBtn = document.querySelector('.modal__buttons .button--outline');
        if (cancelBtn && cancelBtn.textContent.includes('Отмена')) {
            cancelBtn.addEventListener('click', () => this.close());
        }
        
        // Закрытие по клику на overlay
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.close();
            });
        }
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
        
        // Отправка формы
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.save(e));
        }
    }
    
    open() {
        console.log('ProfileModal: Открытие');
        
        if (!this.modal || !this.overlay) {
            console.error('ProfileModal: Модальное окно или overlay не найдены');
            return;
        }
        
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            console.error('ProfileModal: Пользователь не найден');
            return;
        }
        
        // Заполняем форму
        document.getElementById('edit-name').value = user.name || '';
        document.getElementById('edit-email').value = user.email || '';
        
        // Показываем модальное окно
        this.modal.classList.add('modal--active');
        this.overlay.classList.add('overlay--active');
        
        // Блокируем скролл
        document.body.style.overflow = 'hidden';
        
        console.log('ProfileModal: Окно открыто');
    }
    
    close() {
        console.log('ProfileModal: Закрытие');
        
        if (this.modal) this.modal.classList.remove('modal--active');
        if (this.overlay) this.overlay.classList.remove('overlay--active');
        
        // Разблокируем скролл
        document.body.style.overflow = '';
    }
    
    save(event) {
        event.preventDefault();
        console.log('ProfileModal: Сохранение');
        
        const name = document.getElementById('edit-name').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        
        // Валидация
        if (!name) {
            alert('Введите имя');
            return;
        }
        
        if (!email) {
            alert('Введите email');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            alert('Введите корректный email');
            return;
        }
        
        // Сохраняем данные
        const user = JSON.parse(localStorage.getItem('user')) || {};
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        const oldEmail = user.email;
        
        // Обновляем пользователя
        user.name = name;
        user.email = email;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Обновляем в массиве users
        if (oldEmail) {
            const userIndex = users.findIndex(u => u.email === oldEmail);
            if (userIndex !== -1) {
                users[userIndex].name = name;
                users[userIndex].email = email;
                localStorage.setItem('users', JSON.stringify(users));
            }
        }
        
        // Обновляем отображение
        loadUserData();
        
        // Закрываем модальное окно
        this.close();
        
        // Обновляем header
        if (window.updateHeaderAuth) {
            window.updateHeaderAuth();
        }
        
        alert('Данные профиля обновлены');
    }
    
    isValidEmail(email) {
        return email.includes('@') && email.includes('.') && email.length > 5;
    }
}

// Основной код профиля
document.addEventListener('DOMContentLoaded', function() {
    console.log('profile.js: Загрузка');
    
    // Проверяем авторизацию
    if (!checkAuth()) return;
    
    // Инициализируем модальное окно профиля
    window.profileModal = new ProfileModal();
    
    // Загружаем данные пользователя
    loadUserData();
    
    // Настраиваем другие обработчики
    setupOtherEventListeners();
    
    // Обновляем header
    updateProfilePageHeader();
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        alert('Для доступа к личному кабинету необходимо авторизоваться');
        window.location.href = 'login.html';
        return false;
    }
    
    console.log('Пользователь авторизован:', user);
    return true;
}

function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user) {
        document.getElementById('user-name').textContent = user.name || 'Не указано';
        document.getElementById('user-email').textContent = user.email || 'Не указано';
        
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            document.getElementById('user-created').textContent = 
                date.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
        } else {
            document.getElementById('user-created').textContent = 'Сегодня';
        }
    }
}

function setupOtherEventListeners() {
    // Кнопка выхода в профиле
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
                logout();
            }
        });
    }
    
    // Кнопка удаления аккаунта
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (confirm('ВНИМАНИЕ! Вы уверены, что хотите удалить аккаунт?\nЭто действие нельзя отменить.')) {
                deleteAccount();
            }
        });
    }
    
    // Кнопка "Выйти" в header
    const logoutHeaderBtn = document.getElementById('logout-nav-link');
    if (logoutHeaderBtn) {
        logoutHeaderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти?')) {
                logout();
            }
        });
    }
}

function updateProfilePageHeader() {
    const loginItem = document.getElementById('login-nav-item');
    const registerItem = document.getElementById('register-nav-item');
    const profileItem = document.getElementById('profile-nav-item');
    const logoutItem = document.getElementById('logout-nav-item');
    
    if (loginItem) loginItem.classList.add('nav__item--hidden');
    if (registerItem) registerItem.classList.add('nav__item--hidden');
    if (profileItem) profileItem.classList.remove('nav__item--hidden');
    if (logoutItem) logoutItem.classList.remove('nav__item--hidden');
    
    const profileLink = document.getElementById('profile-nav-link');
    if (profileLink) profileLink.classList.add('nav__link--active');
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    if (window.updateHeaderAuth) {
        window.updateHeaderAuth();
    }
    
    window.location.href = 'index.html';
}

function deleteAccount() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user && user.email) {
        const updatedUsers = users.filter(u => u.email !== user.email);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    
    if (window.updateHeaderAuth) {
        window.updateHeaderAuth();
    }
    
    alert('Аккаунт успешно удален');
    window.location.href = 'index.html';
}

// Для тестирования
window.mockLoginForTest = function() {
    const testUser = {
        id: 1,
        name: 'Тестовый Пользователь',
        email: 'test@example.com',
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(testUser));
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (!users.some(u => u.email === testUser.email)) {
        users.push({
            ...testUser,
            password: 'test123'
        });
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    if (window.updateHeaderAuth) {
        window.updateHeaderAuth();
    }
    
    alert('Тестовый вход выполнен!');
    window.location.reload();
};

console.log('profile.js: Инициализация завершена');