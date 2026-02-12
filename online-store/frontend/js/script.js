// ========== КОРЗИНА (СЕРВЕРНАЯ ВЕРСИЯ) ==========
class Cart {
    constructor() {
        this.items = [];
        this.isLoading = false;
        this.init();
    }

    async init() {
        // Проверяем авторизован ли пользователь
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (user && user.id) {
            // Авторизован - загружаем корзину с сервера
            await this.loadCartFromServer();
        } else {
            // Не авторизован - загружаем из localStorage
            this.items = JSON.parse(localStorage.getItem('local_cart')) || [];
            this.updateCartDisplay();
        }
    }

    // Загрузка корзины с сервера
    async loadCartFromServer() {
        try {
            this.isLoading = true;
            const token = localStorage.getItem('token');
            
            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const cartItems = await response.json();
                this.items = cartItems.map(item => ({
                    id: String(item.id),
                    title: item.title,
                    price: item.price,
                    image: item.image || 'images/default.jpg',
                    quantity: item.quantity,
                    cart_id: item.cart_id
                }));
                
                // Сохраняем корзину в local_cart
                localStorage.setItem('local_cart', JSON.stringify(this.items));
                
                console.log('✅ Корзина загружена с сервера, local_cart обновлен');
            } else {
                // Если ошибка - используем локальную корзину
                this.items = JSON.parse(localStorage.getItem('local_cart')) || [];
            }
        } catch (error) {
            console.error('Ошибка загрузки корзины:', error);
            this.items = JSON.parse(localStorage.getItem('local_cart')) || [];
        } finally {
            this.isLoading = false;
            this.updateCartDisplay();
        }
    }

    // Добавить товар в корзину
    async addItem(product) {
        const user = JSON.parse(localStorage.getItem('user'));
        const productId = String(product.id);
        
        if (user && user.id) {
            // Авторизован - отправляем на сервер
            return await this.addToServerCart(productId, product.quantity || 1);
        } else {
            // Не авторизован - сохраняем локально
            return this.addToLocalCart(product);
        }
    }

    // Добавление в локальную корзину
    addToLocalCart(product) {
        const productId = String(product.id);
        const existingItem = this.items.find(item => String(item.id) === productId);
        
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            this.items.push({
                ...product,
                id: productId,
                quantity: product.quantity || 1
            });
        }
        
        localStorage.setItem('local_cart', JSON.stringify(this.items));
        this.updateCartDisplay();
        this.showNotification(`"${product.title}" добавлен в корзину!`);
        return true;
    }

    // Добавление на сервер
    async addToServerCart(productId, quantity) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId, quantity })
            });

            if (response.ok) {
                const data = await response.json();
                this.items = data.cart.map(item => ({
                    id: String(item.id),
                    title: item.title,
                    price: item.price,
                    image: item.image || 'images/default.jpg',
                    quantity: item.quantity,
                    cart_id: item.cart_id
                }));
                
                // Сохраняем обновленную корзину в local_cart
                localStorage.setItem('local_cart', JSON.stringify(this.items));
                
                this.updateCartDisplay();
                
                const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
                const title = productCard?.dataset.title || 'Товар';
                this.showNotification(`"${title}" добавлен в корзину!`);
                return true;
            }
        } catch (error) {
            console.error('Ошибка добавления на сервер:', error);
        }
        return false;
    }

    // Удалить товар из корзины
    async removeItem(productId) {
        const user = JSON.parse(localStorage.getItem('user'));
        const item = this.items.find(item => String(item.id) === String(productId));
        
        if (user && user.id && item?.cart_id) {
            // Авторизован - удаляем с сервера
            return await this.removeFromServerCart(item.cart_id, productId);
        } else {
            // Не авторизован - удаляем из локальной
            return this.removeFromLocalCart(productId);
        }
    }

    // Удаление из локальной корзины
    removeFromLocalCart(productId) {
        this.items = this.items.filter(item => String(item.id) !== String(productId));
        localStorage.setItem('local_cart', JSON.stringify(this.items));
        this.updateCartDisplay();
        return true;
    }

    // Удаление с сервера
    async removeFromServerCart(cartId, productId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/cart/${cartId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.items = this.items.filter(item => String(item.id) !== String(productId));
                
                // Сохраняем обновленную корзину в local_cart
                localStorage.setItem('local_cart', JSON.stringify(this.items));
                
                this.updateCartDisplay();
                return true;
            }
        } catch (error) {
            console.error('Ошибка удаления с сервера:', error);
        }
        return false;
    }

    // Изменить количество
    async updateQuantity(productId, change) {
        const item = this.items.find(item => String(item.id) === String(productId));
        
        if (!item) return false;

        item.quantity += change;
        
        if (item.quantity < 1) {
            return this.removeItem(productId);
        }

        const user = JSON.parse(localStorage.getItem('user'));
        
        if (user && user.id && item.cart_id) {
            // Авторизован - обновляем на сервере
            return await this.updateServerQuantity(item.cart_id, item.quantity, productId);
        } else {
            // Не авторизован - обновляем локально
            return this.updateLocalQuantity(productId, item.quantity);
        }
    }

    // Обновление локального количества
    updateLocalQuantity(productId, quantity) {
        const item = this.items.find(item => String(item.id) === String(productId));
        if (item) {
            item.quantity = quantity;
            localStorage.setItem('local_cart', JSON.stringify(this.items));
            this.updateCartDisplay();
            return true;
        }
        return false;
    }

    // Обновление на сервере
    async updateServerQuantity(cartId, quantity, productId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/cart/${cartId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity })
            });

            if (response.ok) {
                const item = this.items.find(item => String(item.id) === String(productId));
                if (item) {
                    item.quantity = quantity;
                }
                
                // Сохраняем обновленную корзину в local_cart
                localStorage.setItem('local_cart', JSON.stringify(this.items));
                
                this.updateCartDisplay();
                return true;
            }
        } catch (error) {
            console.error('Ошибка обновления на сервере:', error);
        }
        return false;
    }

    // Очистить корзину
    async clearCart() {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (user && user.id) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/cart', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    this.items = [];
                    localStorage.setItem('local_cart', JSON.stringify([]));
                    this.updateCartDisplay();
                    console.log('✅ Корзина на сервере очищена');
                }
            } catch (error) {
                console.error('Ошибка очистки корзины:', error);
            }
        } else {
            this.items = [];
            localStorage.setItem('local_cart', JSON.stringify([]));
            this.updateCartDisplay();
        }
    }

    // Общая стоимость
    getTotalPrice() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Сохранить в localStorage
    saveCart() {
        localStorage.setItem('local_cart', JSON.stringify(this.items));
    }

    // ✅ ИСПРАВЛЕНО: Обновить отображение корзины (без циклического вызова)
    updateCartDisplay(updateCartPage = true) {
        // Обновить счетчик в шапке
        const cartCount = document.querySelector('.cart__count');
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartCount) {
            cartCount.textContent = totalItems;
        }

        // Обновить модальное окно корзины
        this.renderCartModal();
        
        // Если мы на странице корзины, обновляем её (но без циклического вызова!)
        if (updateCartPage && window.cartPage && typeof window.cartPage.renderCartItems === 'function') {
            window.cartPage.renderCartItems();
            window.cartPage.updateSummary(false); // false - не вызывать updateCartDisplay снова!
        }
        
        // Всегда сохраняем в local_cart при обновлении
        this.saveCart();
    }

    // Отрисовать содержимое корзины в модальном окне
    renderCartModal() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartItemsContainer || !cartTotal) return;

        let cartEmpty = document.getElementById('cart-empty');
        if (!cartEmpty) {
            cartEmpty = document.createElement('div');
            cartEmpty.id = 'cart-empty';
            cartEmpty.className = 'cart-empty';
            cartEmpty.textContent = 'Корзина пуста';
            cartItemsContainer.appendChild(cartEmpty);
        }

        if (this.items.length === 0) {
            cartEmpty.style.display = 'block';
            const totalPriceSpan = cartTotal.querySelector('.cart-total__price');
            if (totalPriceSpan) totalPriceSpan.textContent = '0';
            
            Array.from(cartItemsContainer.children).forEach(child => {
                if (child !== cartEmpty && child.classList.contains('cart-item')) {
                    child.remove();
                }
            });
            return;
        }

        cartEmpty.style.display = 'none';
        
        Array.from(cartItemsContainer.children).forEach(child => {
            if (child.classList.contains('cart-item')) {
                child.remove();
            }
        });

        this.items.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image || 'images/default.jpg'}" alt="${item.title}" class="cart-item__image">
                <div class="cart-item__info">
                    <div class="cart-item__title">${item.title}</div>
                    <div class="cart-item__price">${item.price.toLocaleString()} ₽ × ${item.quantity} = <strong>${(item.price * item.quantity).toLocaleString()} ₽</strong></div>
                </div>
                <div class="cart-item__quantity">
                    <button class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
                </div>
                <button class="cart-item__remove" data-action="remove" data-id="${item.id}">Удалить</button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });

        const totalPriceSpan = cartTotal.querySelector('.cart-total__price');
        if (totalPriceSpan) {
            totalPriceSpan.textContent = this.getTotalPrice().toLocaleString();
        }
    }

    // Показать уведомление
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-success);
            color: white;
            padding: 15px 25px;
            border-radius: 6px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// ========== МОДАЛЬНЫЕ ОКНА ==========
class ModalManager {
    constructor() {
        this.modals = document.querySelectorAll('.modal');
        this.overlay = document.getElementById('overlay');
        if (this.overlay) {
            this.init();
        }
    }

    init() {
        document.querySelectorAll('[data-modal-close]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modalClose;
                this.closeModal(modalId);
            });
        });

        this.overlay.addEventListener('click', () => {
            this.closeAllModals();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('modal--active');
            this.overlay.classList.add('overlay--active');
            document.body.style.overflow = 'hidden';
            
            if (modalId === 'cart-modal' && window.cart) {
                window.cart.renderCartModal();
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('modal--active');
            this.overlay.classList.remove('overlay--active');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        this.modals.forEach(modal => modal.classList.remove('modal--active'));
        if (this.overlay) {
            this.overlay.classList.remove('overlay--active');
        }
        document.body.style.overflow = '';
    }
}

// ========== ОБРАБОТЧИК ДЛЯ КНОПОК "В КОРЗИНУ" ==========
function handleAddToCartClick(e) {
    if (e.target.classList.contains('add-to-cart') && window.cart) {
        const isCartPage = window.location.href.includes('cart.html');
        const isCartModal = e.target.closest('#cart-modal');
        
        if (isCartPage || isCartModal) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        const productCard = e.target.closest('.product-card');
        
        if (productCard && !e.target.disabled) {
            if (e.target.hasAttribute('data-adding')) {
                return;
            }
            e.target.setAttribute('data-adding', 'true');
            
            const productId = productCard.dataset.id;
            const productTitle = productCard.dataset.title;
            const productPrice = parseInt(productCard.dataset.price);
            const productImage = productCard.dataset.image || 'images/default.jpg';
            
            if (!productId || !productTitle || isNaN(productPrice)) {
                console.error('Недостаточно данных для добавления в корзину:', {
                    id: productId,
                    title: productTitle,
                    price: productPrice,
                    image: productImage
                });
                e.target.removeAttribute('data-adding');
                return;
            }
            
            const product = {
                id: productId,
                title: productTitle,
                price: productPrice,
                image: productImage,
                quantity: 1
            };
            
            console.log('Добавляем товар в корзину:', product);
            window.cart.addItem(product);
            
            if (window.modals && document.getElementById('cart-modal')) {
                window.modals.openModal('cart-modal');
            }
            
            e.stopPropagation();
            
            setTimeout(() => {
                e.target.removeAttribute('data-adding');
            }, 1000);
        }
    }
}

// ========== ОБРАБОТЧИК ДЛЯ КОРЗИНЫ В ШАПКЕ ==========
function handleCartClick(e) {
    e.preventDefault();
    
    if (window.cart) {
        window.cart.renderCartModal();
    }
    
    if (window.modals && document.getElementById('cart-modal')) {
        window.modals.openModal('cart-modal');
    } else {
        window.location.href = 'cart.html';
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем корзину
    window.cart = new Cart();
    
    // Инициализируем модальные окна
    if (document.getElementById('overlay')) {
        window.modals = new ModalManager();
    }

    // Открытие корзины по клику
    const cartButton = document.querySelector('.header__cart, .cart');
    if (cartButton) {
        cartButton.addEventListener('click', handleCartClick);
    }

    // Обработка событий корзины в МОДАЛЬНОМ ОКНЕ
    document.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;

        const isInCartModal = e.target.closest('#cart-modal');
        const isOnCartPage = window.location.pathname.includes('cart.html');
        
        if (action && id && window.cart && isInCartModal && !isOnCartPage) {
            switch(action) {
                case 'increase':
                    window.cart.updateQuantity(id, 1);
                    break;
                case 'decrease':
                    window.cart.updateQuantity(id, -1);
                    break;
                case 'remove':
                    window.cart.removeItem(id);
                    break;
            }
            e.stopPropagation();
        }
    });

    // Обработчик для кнопок "В корзину"
    document.addEventListener('click', handleAddToCartClick);

    console.log('✅ Скрипт корзины инициализирован');
});

// ========== АНИМАЦИИ ДЛЯ УВЕДОМЛЕНИЙ ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);