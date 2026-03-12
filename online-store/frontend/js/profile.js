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
    
    // 3. Загружаем историю заказов
    await loadOrders();
    
    // 4. Настраиваем все обработчики
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

// ========== ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ ==========
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

// ========== ЗАГРУЗКА ИСТОРИИ ЗАКАЗОВ ==========
async function loadOrders() {
    console.log('📦 Загружаю историю заказов...');
    
    const token = localStorage.getItem('token');
    const ordersList = document.getElementById('orders-list');
    
    if (!ordersList) {
        console.error('❌ Не найден элемент #orders-list');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки заказов: ${response.status}`);
        }
        
        const orders = await response.json();
        console.log(`✅ Загружено ${orders.length} заказов`);
        
        if (orders.length === 0) {
            showEmptyOrders();
            return;
        }
        
        renderOrders(orders);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки заказов:', error);
        showOrdersError();
    }
}

// Отображение пустой истории
function showEmptyOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = `
        <div class="empty-orders">
            <div class="empty-orders__icon">📭</div>
            <h3 class="empty-orders__title">У вас пока нет заказов</h3>
            <p class="empty-orders__text">Перейдите в каталог, чтобы выбрать товары</p>
            <a href="catalog.html" class="button button--primary">Перейти в каталог</a>
        </div>
    `;
}

// Отображение ошибки
function showOrdersError() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = `
        <div class="orders-error">
            <div class="orders-error__icon">❌</div>
            <h3 class="orders-error__title">Не удалось загрузить заказы</h3>
            <p class="orders-error__text">Попробуйте обновить страницу</p>
            <button class="button button--primary" onclick="location.reload()">Обновить</button>
        </div>
    `;
}

// Функция для получения статуса на русском
function getStatusRu(status) {
    const statuses = {
        'pending': '🟡 В обработке',
        'processing': '⚙️ Обрабатывается',
        'shipped': '🚚 Отправлен',
        'delivered': '✅ Доставлен',
        'cancelled': '❌ Отменён'
    };
    return statuses[status] || status || '🟡 В обработке';
}

// Функция для получения цвета статуса
function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'processing': 'status-processing',
        'shipped': 'status-shipped',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return classes[status] || 'status-pending';
}

// ========== ОТМЕНА ЗАКАЗА ==========
async function cancelOrder(orderId) {
    if (!confirm('Вы уверены, что хотите отменить заказ?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка отмены заказа');
        }
        
        alert('✅ Заказ успешно отменен');
        
        // Перезагружаем список заказов
        await loadOrders();
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert(`❌ ${error.message}`);
    }
}

// ========== ОТРИСОВКА ЗАКАЗОВ ==========
function renderOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    let html = '<div class="orders-history__list">';
    
    orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const statusRu = getStatusRu(order.status);
        const statusClass = getStatusClass(order.status);
        
        // Можно отменить только заказы в статусе pending или processing
        const canCancel = ['pending', 'processing'].includes(order.status);
        
        html += `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-card__header">
                    <div class="order-card__number">
                        <span class="order-card__number-label">Заказ</span>
                        <span class="order-card__number-value">#${order.order_number}</span>
                    </div>
                    <div class="order-card__status ${statusClass}">
                        ${statusRu}
                    </div>
                </div>
                
                <div class="order-card__body">
                    <div class="order-card__info">
                        <div class="order-card__date">
                            <span class="order-card__info-label">Дата:</span>
                            <span class="order-card__info-value">${date}</span>
                        </div>
                        <div class="order-card__amount">
                            <span class="order-card__info-label">Сумма:</span>
                            <span class="order-card__info-value">${order.total_amount.toLocaleString()} ₽</span>
                        </div>
                        <div class="order-card__items">
                            <span class="order-card__info-label">Товаров:</span>
                            <span class="order-card__info-value">${order.items_count} шт.</span>
                        </div>
                    </div>
                    
                    <div class="order-card__actions">
                        <button class="button button--outline order-details-btn" data-order-id="${order.id}">
                            Подробнее
                        </button>
                        ${canCancel ? `
                        <button class="button button--danger order-cancel-btn" data-order-id="${order.id}">
                            Отменить
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    ordersList.innerHTML = html;
    
    // Добавляем обработчики для кнопок "Подробнее"
    document.querySelectorAll('.order-details-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.orderId;
            await showOrderDetails(orderId);
        });
    });
    
    // Добавляем обработчики для кнопок "Отменить"
    document.querySelectorAll('.order-cancel-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.orderId;
            await cancelOrder(orderId);
        });
    });
}

// Показать детали заказа
async function showOrderDetails(orderId) {
    console.log(`🔍 Загружаю детали заказа #${orderId}`);
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки деталей заказа');
        }
        
        const order = await response.json();
        
        // Создаём модальное окно с деталями
        showOrderDetailsModal(order);
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить детали заказа');
    }
}

// Показать модальное окно с деталями заказа
function showOrderDetailsModal(order) {
    const date = new Date(order.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const statusRu = getStatusRu(order.status);
    const statusClass = getStatusClass(order.status);
    
    let itemsHtml = '';
    let itemsSubtotal = 0;
    let totalQuantity = 0;
    
    order.items.forEach(item => {
        itemsSubtotal += item.total_price;
        totalQuantity += item.quantity;
        
        itemsHtml += `
            <div class="order-item">
                <div class="order-item__info">
                    <div class="order-item__name">${item.product_name}</div>
                    <div class="order-item__meta">
                        <span class="order-item__price">${item.product_price.toLocaleString()} ₽</span>
                        <span class="order-item__quantity">× ${item.quantity}</span>
                    </div>
                </div>
                <div class="order-item__total">${item.total_price.toLocaleString()} ₽</div>
            </div>
        `;
    });
    
    // Проверяем, была ли применена скидка
    const hasDiscount = itemsSubtotal > order.total_amount;
    const discountAmount = itemsSubtotal - order.total_amount;
    const discountPercent = hasDiscount ? Math.round((discountAmount / itemsSubtotal) * 100) : 0;
    
    const modalHtml = `
        <div class="modal modal--order-details" id="order-details-modal">
            <div class="modal__content">
                <button class="modal__close" onclick="closeOrderDetailsModal()">×</button>
                <h2 class="modal__title">Детали заказа #${order.order_number}</h2>
                
                <div class="order-details">
                    <div class="order-details__header">
                        <div class="order-details__status ${statusClass}">
                            ${statusRu}
                        </div>
                        <div class="order-details__date">${date}</div>
                    </div>
                    
                    <div class="order-details__customer">
                        <h3>📞 Контактные данные</h3>
                        <div class="customer-info">
                            <div class="customer-info__row">
                                <span class="customer-info__label">Телефон:</span>
                                <span class="customer-info__value">${order.phone}</span>
                            </div>
                            ${order.email ? `
                            <div class="customer-info__row">
                                <span class="customer-info__label">Email:</span>
                                <span class="customer-info__value">${order.email}</span>
                            </div>
                            ` : ''}
                            ${order.shipping_address ? `
                            <div class="customer-info__row">
                                <span class="customer-info__label">Адрес доставки:</span>
                                <span class="customer-info__value">${order.shipping_address}</span>
                            </div>
                            ` : ''}
                            ${order.notes ? `
                            <div class="customer-info__row">
                                <span class="customer-info__label">Комментарий:</span>
                                <span class="customer-info__value">${order.notes}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="order-details__items">
                        <h3>🛍️ Состав заказа</h3>
                        <div class="order-items-list">
                            ${itemsHtml}
                        </div>
                        
                        <div class="order-total">
                            <div class="order-total__row">
                                <span class="order-total__label">Товаров:</span>
                                <span class="order-total__value">${totalQuantity} шт.</span>
                            </div>
                            
                            <div class="order-total__row">
                                <span class="order-total__label">Сумма без скидки:</span>
                                <span class="order-total__value">${itemsSubtotal.toLocaleString()} ₽</span>
                            </div>
                            
                            ${hasDiscount ? `
                            <div class="order-total__row order-total__row--discount">
                                <span class="order-total__label">Скидка ${discountPercent}%:</span>
                                <span class="order-total__value order-total__value--discount">-${discountAmount.toLocaleString()} ₽</span>
                            </div>
                            ` : ''}
                            
                            <div class="order-total__row order-total__row--final">
                                <span class="order-total__label">ИТОГО К ОПЛАТЕ:</span>
                                <span class="order-total__value order-total__value--final">${order.total_amount.toLocaleString()} ₽</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal__buttons">
                    <button class="button button--primary" onclick="closeOrderDetailsModal()">Закрыть</button>
                </div>
            </div>
        </div>
        <div class="overlay" id="order-details-overlay" onclick="closeOrderDetailsModal()"></div>
    `;
    
    // Удаляем предыдущее модальное окно если есть
    const oldModal = document.getElementById('order-details-modal');
    if (oldModal) oldModal.remove();
    
    const oldOverlay = document.getElementById('order-details-overlay');
    if (oldOverlay) oldOverlay.remove();
    
    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Показываем модальное окно
    setTimeout(() => {
        const modal = document.getElementById('order-details-modal');
        const overlay = document.getElementById('order-details-overlay');
        if (modal && overlay) {
            modal.classList.add('modal--active');
            overlay.classList.add('overlay--active');
            document.body.style.overflow = 'hidden';
        }
    }, 10);
}

// Закрыть модальное окно с деталями заказа
window.closeOrderDetailsModal = function() {
    const modal = document.getElementById('order-details-modal');
    const overlay = document.getElementById('order-details-overlay');
    
    if (modal) {
        modal.classList.remove('modal--active');
        setTimeout(() => modal.remove(), 300);
    }
    
    if (overlay) {
        overlay.classList.remove('overlay--active');
        setTimeout(() => overlay.remove(), 300);
    }
    
    document.body.style.overflow = '';
};

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
function setupAllEventListeners() {
    // 1. Кнопка редактирования профиля
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        editBtn.addEventListener('click', openEditModal);
    }
    
    // 2. Кнопка выхода
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
            deleteAccount();
      	});
			}
    
    // 4. Модальное окно редактирования
    setupEditModalListeners();
}

// ========== РЕЗЕРВНЫЙ ВЫХОД ==========
function logoutBackup() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        console.log('🔄 Резервный выход из аккаунта');
        
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user_orders');
        localStorage.removeItem('searchQuery');
        localStorage.removeItem('cart');
        localStorage.removeItem('local_cart');
        localStorage.removeItem('remember_me');
        
        console.log('✅ Все данные очищены');
        
        if (typeof updateHeaderAuth === 'function') {
            updateHeaderAuth();
        }
        
        window.location.href = 'index.html';
    }
}

// ========== МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ ==========
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

// ========== УДАЛЕНИЕ АККАУНТА ==========
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
        
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user_orders');
        localStorage.removeItem('searchQuery');
        localStorage.removeItem('cart');
        localStorage.removeItem('local_cart');
        localStorage.removeItem('remember_me');
        
        console.log('✅ Аккаунт удален');
        
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
    reloadData: loadUserData,
    loadOrders: loadOrders
};

console.log('✅ profile.js полностью загружен');