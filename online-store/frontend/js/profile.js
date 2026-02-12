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
            
            if (typeof window.logoutUser === 'function') {
                window.logoutUser();
            } else if (typeof logoutUser === 'function') {
                logoutUser();
            } else {
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

// ========== ИСПРАВЛЕННЫЙ logoutBackup() - ВЫХОД (КОРЗИНА УДАЛЯЕТСЯ!) ==========
function logoutBackup() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        console.log('🔄 Резервный выход из аккаунта (корзина удаляется)');
        
        // ✅ УДАЛЯЕМ ВСЁ!
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user_orders');
        localStorage.removeItem('searchQuery');
        localStorage.removeItem('cart');
        localStorage.removeItem('local_cart');
        localStorage.removeItem('remember_me');
        
        console.log('✅ Все данные очищены, корзина удалена');
        
        if (typeof updateHeaderAuth === 'function') {
            updateHeaderAuth();
        }
        
        window.location.href = 'index.html';
    }
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
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeEditModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeEditModal);
    }
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeEditModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('modal--active')) {
            closeEditModal();
        }
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProfile();
    });
}

// Открытие модального окна
function openEditModal() {
    console.log('🟢 ОТКРЫВАЮ МОДАЛЬНОЕ ОКНО');
    
    const modal = document.getElementById('edit-modal');
    const overlay = document.getElementById('overlay');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!modal || !overlay || !user) {
        console.error('❌ Не найдены элементы для открытия модального окна');
        return;
    }
    
    document.getElementById('edit-username').value = user.username || '';
    document.getElementById('edit-name').value = user.full_name || user.username || '';
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-phone').value = user.phone || '';
    
    modal.classList.add('modal--active');
    overlay.classList.add('overlay--active');
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Модальное окно открыто');
}

// Закрытие модального окна
function closeEditModal() {
    console.log('🔴 ЗАКРЫВАЮ МОДАЛЬНОЕ ОКНО');
    
    const modal = document.getElementById('edit-modal');
    const overlay = document.getElementById('overlay');
    
    if (modal) modal.classList.remove('modal--active');
    if (overlay) overlay.classList.remove('overlay--active');
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
        
        const updatedUser = {
            ...user,
            username: username,
            email: email,
            full_name: full_name,
            phone: phone
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        updateUserDisplay(updatedUser);
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

// ========== ИСПРАВЛЕННОЕ УДАЛЕНИЕ АККАУНТА (КОРЗИНА УДАЛЯЕТСЯ!) ==========
async function deleteAccount() {
    if (!confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        console.log('🗑️ Удаление аккаунта...');
        
        const response = await fetch(`${API_URL}/profile`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка удаления аккаунта');
        }
        
        // ✅ УДАЛЯЕМ ВСЁ!
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user_orders');
        localStorage.removeItem('searchQuery');
        localStorage.removeItem('cart');
        localStorage.removeItem('local_cart');
        localStorage.removeItem('remember_me');
        
        console.log('✅ Аккаунт удален, все данные очищены');
        
        if (typeof updateHeaderAuth === 'function') {
            updateHeaderAuth();
        }
        
        alert('✅ Аккаунт успешно удален');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('❌ Ошибка удаления:', error);
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