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
                id: productId, // Сохраняем как строку
                quantity: product.quantity || 1
            });
        }
        
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification(`"${product.title}" добавлен в корзину!`);
    }

    // Удалить товар из корзины
    removeItem(productId) {
        this.items = this.items.filter(item => String(item.id) !== String(productId));
        this.saveCart();
        this.updateCartDisplay();
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
            // cartCount.style.display = totalItems > 0 ? 'flex' : 'none';               ###### БЫЛ БАГ С ОТОБРАЖЕНИЕМ ТОВАРОВ ###### 
        }

        // Обновить модальное окно корзины (если оно открыто)
        this.renderCartModal();
    }

    // Отрисовать содержимое корзины в модальном окне
    renderCartModal() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        // Если модального окна нет на странице - выходим
        if (!cartItemsContainer || !cartTotal) return;

        // Получаем или создаем элемент сообщения о пустой корзине
        let cartEmpty = document.getElementById('cart-empty');
        if (!cartEmpty) {
            cartEmpty = document.createElement('div');
            cartEmpty.id = 'cart-empty';
            cartEmpty.className = 'cart-empty';
            cartEmpty.textContent = 'Корзина пуста';
            cartItemsContainer.appendChild(cartEmpty);
        }

        if (this.items.length === 0) {
            // Корзина пуста - показываем сообщение и скрываем блок с товарами
            cartEmpty.style.display = 'block';
            cartTotal.querySelector('.cart-total__price').textContent = '0';
            
            // Удаляем все товары кроме сообщения о пустой корзине
            Array.from(cartItemsContainer.children).forEach(child => {
                if (child !== cartEmpty && child.classList.contains('cart-item')) {
                    child.remove();
                }
            });
            return;
        }

        // Корзина не пуста - скрываем сообщение
        cartEmpty.style.display = 'none';
        
        // Очищаем контейнер (но оставляем сообщение о пустой корзине)
        Array.from(cartItemsContainer.children).forEach(child => {
            if (child.classList.contains('cart-item')) {
                child.remove();
            }
        });

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
            background: var(--color-success);															
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
            
            // При открытии модального окна корзины обновляем его содержимое
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
    // ПРОВЕРЯЕМ, что клик по кнопке "В корзину" 
    // И мы не на странице корзины
    // И не в модальном окне корзины
    if (e.target.classList.contains('add-to-cart') && window.cart) {
        // Проверяем, где мы
        const isCartPage = window.location.href.includes('cart.html');
        const isCartModal = e.target.closest('#cart-modal');
        
        if (isCartPage || isCartModal) {
            // Не обрабатываем клики на странице корзины или в модальном окне
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        const productCard = e.target.closest('.product-card');
        
        if (productCard && !e.target.disabled) {
            // Защита от быстрых повторных кликов
            if (e.target.hasAttribute('data-adding')) {
                return;
            }
            e.target.setAttribute('data-adding', 'true');
            
            // Получаем данные из data-атрибутов
            const productId = productCard.dataset.id;
            const productTitle = productCard.dataset.title;
            const productPrice = parseInt(productCard.dataset.price);
            const productImage = productCard.dataset.image || 'images/no-image.jpg';
            
            // Проверяем, что все данные есть
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
            
            // Открываем модальное окно корзины, если оно есть
            if (window.modals && document.getElementById('cart-modal')) {
                window.modals.openModal('cart-modal');
            }
            
            // Предотвращаем всплытие события
            e.stopPropagation();
            
            // Через секунду разрешаем снова кликать
            setTimeout(() => {
                e.target.removeAttribute('data-adding');
            }, 1000);
        }
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

    // Обработка событий корзины в МОДАЛЬНОМ ОКНЕ (делегирование)
    document.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;

        // Проверяем, что клик внутри модального окна корзины
        const isInCartModal = e.target.closest('#cart-modal');
        
        // ДОБАВЛЯЕМ ПРОВЕРКУ: если мы на странице корзины - не обрабатываем
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
            
            // Предотвращаем всплытие
            e.stopPropagation();
        }
    });

    // Добавляем глобальный обработчик для кнопок "В корзину" на ВСЕХ страницах
    document.addEventListener('click', handleAddToCartClick);

    console.log('Скрипт инициализирован');
});