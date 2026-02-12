// ========== КОРЗИНА ==========
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.updateCartDisplay();
    }

    // Добавить товар в корзину
    addItem(product) {
        // Преобразуем ID в строку для надежности
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
        
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification(`"${product.title}" добавлен в корзину!`);
        return true;
    }

    // Очистить корзину (при выходе из аккаунта)
    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
        console.log('Корзина очищена');
    }

    // Удалить товар из корзины
    removeItem(productId) {
        this.items = this.items.filter(item => String(item.id) !== String(productId));
        this.saveCart();
        this.updateCartDisplay();
        return true;
    }

    // Изменить количество
    updateQuantity(productId, change) {
        const item = this.items.find(item => String(item.id) === String(productId));
        
        if (item) {
            item.quantity += change;
            
            if (item.quantity < 1) {
                this.removeItem(productId);
            } else {
                this.saveCart();
                this.updateCartDisplay();
            }
        }
        return true;
    }

    // Общая стоимость
    getTotalPrice() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Сохранить в localStorage
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    // Обновить отображение корзины
    updateCartDisplay() {
        // Обновить счетчик в шапке
        const cartCount = document.querySelector('.cart__count');
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartCount) {
            cartCount.textContent = totalItems;
        }

        // Обновить модальное окно корзины (если оно открыто)
        this.renderCartModal();
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
                <img src="${item.image}" alt="${item.title}" class="cart-item__image">
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
    
    // Просто открываем корзину без проверки авторизации
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