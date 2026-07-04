// admin.js
const API_URL = 'http://localhost:3000/api';

// Проверка прав администратора
async function checkAdminAccess() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
        alert('Необходимо авторизоваться');
        window.location.href = 'login.html';
        return false;
    }
    
    if (!user.is_admin) {
        alert('У вас нет прав доступа к этой странице');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Загрузка статистики
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки статистики');
        
        const stats = await response.json();
        
        document.getElementById('stats-container').innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.totalOrders}</div>
                <div class="stat-label">Всего заказов</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalRevenue.toLocaleString()} ₽</div>
                <div class="stat-label">Выручка</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalUsers}</div>
                <div class="stat-label">Пользователей</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalProducts}</div>
                <div class="stat-label">Товаров</div>
            </div>
        `;
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('stats-container').innerHTML = `
            <div class="error-message">Ошибка загрузки статистики</div>
        `;
    }
}

// Загрузка всех заказов
async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки заказов');
        
        const orders = await response.json();
        renderOrders(orders);
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('orders-table').innerHTML = `
            <div class="error-message">Ошибка загрузки заказов</div>
        `;
    }
}

function getStatusText(status) {
    const statuses = {
        'pending': 'В обработке',
        'processing': 'Обрабатывается',
        'shipped': 'Отправлен',
        'delivered': 'Доставлен',
        'cancelled': 'Отменён'
    };
    return statuses[status] || status;
}

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

// Отрисовка заказов
function renderOrders(orders) {
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    let html = `
        <table class="orders-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Номер заказа</th>
                    <th>Пользователь</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                    <th>Товаров</th>
                    <th>Дата</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('ru-RU');
        const statusClass = getStatusClass(order.status);
        
        html += `
            <tr>
                <td>#${order.id}</td>
                <td>${order.order_number}</td>
                <td>${order.full_name || order.username || 'Пользователь удален'}</td>
                <td>${order.total_amount.toLocaleString()} ₽</td>
                <td>
                    <select class="status-select ${statusClass}" data-order-id="${order.id}" data-original-status="${order.status}">
                        ${statuses.map(s => `
                            <option value="${s}" ${order.status === s ? 'selected' : ''}>
                                ${getStatusText(s)}
                            </option>
                        `).join('')}
                    </select>
                </td>
                <td>${order.items_count}</td>
                <td>${date}</td>
                <td>
                    <button class="button button--sm view-order" data-order-id="${order.id}">
                        Детали
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    
    document.getElementById('orders-table').innerHTML = html;
    
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const orderId = e.target.dataset.orderId;
            const originalStatus = e.target.dataset.originalStatus;
            const newStatus = e.target.value;
            
            const success = await updateOrderStatus(orderId, newStatus);
            
            if (success) {
                e.target.className = `status-select ${getStatusClass(newStatus)}`;
                e.target.dataset.originalStatus = newStatus;
            } else {
                e.target.value = originalStatus;
            }
        });
    });
    
    document.querySelectorAll('.view-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.target.dataset.orderId;
            viewOrderDetails(orderId);
        });
    });
}

// Обновление статуса заказа
async function updateOrderStatus(orderId, status) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('Ошибка обновления статуса');
        
        return true;
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось обновить статус заказа');
        return false;
    }
}

// Просмотр деталей заказа
function viewOrderDetails(orderId) {
    console.log('Просмотр заказа:', orderId);
    alert('Функция просмотра деталей заказа будет добавлена позже');
}

// Загрузка пользователей
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки пользователей');
        
        const users = await response.json();
        renderUsers(users);
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('users-table').innerHTML = `
            <div class="error-message">Ошибка загрузки пользователей</div>
        `;
    }
}

function renderUsers(users) {
    let html = `
        <table class="users-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Имя пользователя</th>
                    <th>Полное имя</th>
                    <th>Email</th>
                    <th>Телефон</th>
                    <th>Админ</th>
                    <th>Дата регистрации</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach(user => {
        const date = new Date(user.created_at).toLocaleDateString('ru-RU');
        html += `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.full_name || '-'}</td>
                <td>${user.email}</td>
                <td>${user.phone || '-'}</td>
                <td>${user.is_admin ? 'Да' : 'Нет'}</td>
                <td>${date}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    document.getElementById('users-table').innerHTML = html;
}

function setupTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const sections = document.querySelectorAll('.admin-section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(`${tabName}-section`).classList.add('active');
            
            if (tabName === 'orders') loadOrders();
            else if (tabName === 'users') loadUsers();
        });
    });
}

function filterOrders(searchTerm) {
    const rows = document.querySelectorAll('#orders-table tbody tr');
    rows.forEach(row => {
        const orderNumber = row.cells[1].textContent.toLowerCase();
        row.style.display = orderNumber.includes(searchTerm) ? '' : 'none';
    });
}

function filterOrdersByStatus(status) {
    const rows = document.querySelectorAll('#orders-table tbody tr');
    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
            return;
        }
        const statusSelect = row.querySelector('.status-select');
        const currentStatus = statusSelect.value;
        row.style.display = currentStatus === status ? '' : 'none';
    });
}

function filterUsers(searchTerm) {
    const rows = document.querySelectorAll('#users-table tbody tr');
    rows.forEach(row => {
        const username = row.cells[1].textContent.toLowerCase();
        const email = row.cells[3].textContent.toLowerCase();
        row.style.display = (username.includes(searchTerm) || email.includes(searchTerm)) ? '' : 'none';
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;
    
    await loadStats();
    await loadOrders();
    setupTabs();
    
    const orderSearch = document.getElementById('order-search');
    if (orderSearch) {
        orderSearch.addEventListener('input', (e) => filterOrders(e.target.value.toLowerCase()));
    }
    
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => filterOrdersByStatus(e.target.value));
    }
    
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
        userSearch.addEventListener('input', (e) => filterUsers(e.target.value.toLowerCase()));
    }
});