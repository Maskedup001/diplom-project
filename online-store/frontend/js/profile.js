// profile.js - использует общий logoutUser()
const API_URL = 'http://localhost:3000/api';

// ========== ГЛАВНАЯ ФУНКЦИЯ ==========
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== ЗАГРУЗКА profile.js ===');
    
    // 1. Проверяем авторизацию
    const user = await checkAuth();
    if (!user) return;
    
    // 2. Загружаем данные пользователя
    await loadUserData();
    
    // 3. Настраиваем все обработчики
    setupAllEventListeners();
    
    console.log('✅ profile.js инициализирован');
});

// ========== АВТОРИЗАЦИЯ ==========
async function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
        alert('Для доступа к личному кабинету необходимо авторизоваться');
        window.location.href = 'login.html';
        return null;
    }
    
    return user;
}

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadUserData() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        const response = await fetch(`${API_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.success && result.user) {
                localStorage.setItem('user', JSON.stringify(result.user));
                updateUserDisplay(result.user);
                return;
            }
        }
        
        updateUserDisplay(user);
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        updateUserDisplay(user);
    }
}

// Обновление отображения пользователя
function updateUserDisplay(user) {
    const fields = [
        { id: 'user-username', value: user.username || 'Не указано' },
        { id: 'user-name', value: user.full_name || user.username || 'Не указано' },
        { id: 'user-email', value: user.email || 'Не указано' },
        { id: 'user-phone', value: user.phone || 'Не указано' }
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) element.textContent = field.value;
    });
    
    const createdElement = document.getElementById('user-created');
    if (createdElement) {
        if (user.created_at) {
            const date = new Date(user.created_at);
            createdElement.textContent = date.toLocaleDateString('ru-RU');
        } else {
            createdElement.textContent = 'Сегодня';
        }
    }
}

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
function setupAllEventListeners() {
    // 1. Кнопка редактирования профиля
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        editBtn.addEventListener('click', openEditModal);
    }
    
    // 2. Кнопка выхода - ИСПОЛЬЗУЕМ logoutUser()
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Используем общую функцию выхода
            if (typeof logoutUser === 'function') {
                logoutUser();
            } else {
                // Если общей функции нет, используем локальную
                logoutBackup();
            }
        });
    }
    
    // 3. Кнопка удаления аккаунта
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm('Удалить аккаунт? Это действие нельзя отменить.')) {
                deleteAccount();
            }
        });
    }
    
    // 4. Модальное окно редактирования
    setupEditModalListeners();
}

// Локальный backup если общая функция не загрузилась
function logoutBackup() {
    // Тут можно оставить confirm или убрать (он уже в logoutUser)
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    
    if (typeof updateHeaderAuth === 'function') {
        updateHeaderAuth();
    }
    
    window.location.href = 'index.html';
}

// ========== МОДАЛЬНОЕ ОКНО ==========
function setupEditModalListeners() {
    const modal = document.getElementById('edit-modal');
    const overlay = document.getElementById('overlay');
    const closeBtn = modal?.querySelector('.modal__close');
    const cancelBtn = modal?.querySelector('.button--outline');
    const form = document.getElementById('edit-profile-form');
    
    if (!modal || !overlay || !form) {
        console.error('❌ Не найдены элементы модального окна');
        return;
    }
    
    // Закрытие по крестику
    if (closeBtn) {
        closeBtn.addEventListener('click', closeEditModal);
    }
    
    // Закрытие по кнопке Отмена
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeEditModal);
    }
    
    // Закрытие по overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeEditModal();
    });
    
    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('modal--active')) {
            closeEditModal();
        }
    });
    
    // Отправка формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProfile();
    });
}

// Открытие модального окна
function openEditModal() {
    console.log('🟢 ОТКРЫВАЮ МОДАЛЬНОЕ ОКНО ЧЕРЕЗ CSS КЛАССЫ');
    
    const modal = document.getElementById('edit-modal');
    const overlay = document.getElementById('overlay');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!modal || !overlay || !user) {
        console.error('❌ Не найдены элементы для открытия модального окна');
        return;
    }
    
    // Заполняем форму
    document.getElementById('edit-username').value = user.username || '';
    document.getElementById('edit-name').value = user.full_name || user.username || '';
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-phone').value = user.phone || '';
    
    // Показываем через CSS классы
    modal.classList.add('modal--active');
    overlay.classList.add('overlay--active');
    
    // Блокируем скролл
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Модальное окно открыто через классы');
}

// Закрытие модального окна
function closeEditModal() {
    console.log('🔴 ЗАКРЫВАЮ МОДАЛЬНОЕ ОКНО ЧЕРЕЗ CSS КЛАССЫ');
    
    const modal = document.getElementById('edit-modal');
    const overlay = document.getElementById('overlay');
    
    if (modal) modal.classList.remove('modal--active');
    if (overlay) overlay.classList.remove('overlay--active');
    
    // Разблокируем скролл
    document.body.style.overflow = '';
}

// Сохранение профиля
async function saveProfile() {
    console.log('💾 Сохраняю профиль...');
    
    const username = document.getElementById('edit-username').value.trim();
    const full_name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Валидация
    if (!username || !email || !full_name) {
        alert('Заполните все обязательные поля');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Введите корректный email');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: username,
                email: email,
                full_name: full_name,
                phone: phone
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка обновления профиля');
        }
        
        const result = await response.json();
        
        // Обновляем localStorage
        const updatedUser = {
            ...user,
            username: username,
            email: email,
            full_name: full_name,
            phone: phone
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Обновляем отображение
        updateUserDisplay(updatedUser);
        
        // Закрываем модальное окно
        closeEditModal();
        
        alert('✅ Профиль успешно обновлен!');
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert(`❌ Ошибка: ${error.message}`);
    }
}

// Проверка email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Удаление аккаунта
async function deleteAccount() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка удаления аккаунта');
        }
        
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('cart');
        
        if (typeof updateHeaderAuth === 'function') {
            updateHeaderAuth();
        }
        
        alert('✅ Аккаунт успешно удален');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('❌ Ошибка удаления аккаунта');
    }
}

// ========== ФУНКЦИИ ДЛЯ ОТЛАДКИ ==========
window.debugProfile = {
    openModal: openEditModal,
    closeModal: closeEditModal,
    saveProfile: saveProfile,
    deleteAccount: deleteAccount,
    reloadData: loadUserData
};

console.log('✅ profile.js полностью загружен');