// ========== КОРЗИНА ==========
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.updateCartDisplay();
    }

    // Добавить товар в корзину
    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            this.items.push({
                ...product,
                quantity: product.quantity || 1
            });
        }
        
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification(`"${product.title}" добавлен в корзину!`);
    }

    // Удалить товар из корзины
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
    }

    // Изменить количество
    updateQuantity(productId, change) {
        const item = this.items.find(item => item.id === productId);
        
        if (item) {
            item.quantity += change;
            
            if (item.quantity < 1) {
                this.removeItem(productId);
            } else {
                this.saveCart();
                this.updateCartDisplay();
            }
        }
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
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        // Обновить модальное окно корзины (если оно открыто)
        this.renderCartModal();
    }

    // Отрисовать содержимое корзины в модальном окне
    renderCartModal() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        const cartEmpty = document.getElementById('cart-empty');
        
        // Если модального окна нет на странице - выходим
        if (!cartItemsContainer || !cartTotal) return;

        // Очищаем контейнер
        cartItemsContainer.innerHTML = '';

        if (this.items.length === 0) {
            if (cartEmpty) cartEmpty.style.display = 'block';
            if (cartTotal) cartTotal.querySelector('.cart-total__price').textContent = '0';
            return;
        }

        if (cartEmpty) cartEmpty.style.display = 'none';

        // Добавляем каждый товар
        this.items.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="cart-item__image">
                <div class="cart-item__info">
                    <div class="cart-item__title">${item.title}</div>
                    <div class="cart-item__price">${item.price} ₽ × ${item.quantity} = <strong>${item.price * item.quantity} ₽</strong></div>
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

        // Обновляем итоговую сумму
        cartTotal.querySelector('.cart-total__price').textContent = this.getTotalPrice();
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
            background: #2ecc71;
            color: white;
            padding: 15px 25px;
            border-radius: 6px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
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
        // Закрытие по кнопке
        document.querySelectorAll('[data-modal-close]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modalClose;
                this.closeModal(modalId);
            });
        });

        // Закрытие по клику на overlay
        this.overlay.addEventListener('click', () => {
            this.closeAllModals();
        });

        // Закрытие по Escape
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

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем корзину
    window.cart = new Cart();
    
    // Инициализируем модальные окна (если есть overlay)
    if (document.getElementById('overlay')) {
        window.modals = new ModalManager();
    }

    // Открытие корзины по клику (с проверкой)
    const cartButton = document.querySelector('.header__cart');
    if (cartButton) {
        cartButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Если есть корзина - обновляем и открываем
            if (window.cart) {
                window.cart.renderCartModal();
            }
            
            // Если есть менеджер модалок - открываем
            if (window.modals && document.getElementById('cart-modal')) {
                window.modals.openModal('cart-modal');
            } else {
                // Иначе просто переходим на страницу корзины
                window.location.href = 'cart.html';
            }
        });
    }

    // Обработка событий корзины (делегирование)
    document.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;

        if (action && id && window.cart) {
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
        }

        // Кнопки "В корзину" на карточках товаров
        if (e.target.classList.contains('add-to-cart') && window.cart) {
            const productCard = e.target.closest('.product-card');
            if (productCard) {
                const product = {
                    id: productCard.dataset.id,
                    title: productCard.dataset.title,
                    price: parseInt(productCard.dataset.price),
                    image: productCard.dataset.image
                };
                window.cart.addItem(product);
                
                // Открываем модальное окно, если оно есть
                if (window.modals && document.getElementById('cart-modal')) {
                    window.modals.openModal('cart-modal');
                }
            }
        }
    });

    console.log('Скрипт инициализирован');
});