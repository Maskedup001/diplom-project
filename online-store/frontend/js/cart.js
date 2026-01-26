// ========== УПРАВЛЕНИЕ КОРЗИНОЙ НА СТРАНИЦЕ ==========
class CartPage {
    constructor() {
        console.log('CartPage: Инициализация для страницы корзины');
        
        // Создаем свою корзину
        this.cart = this.createLocalCart();
        
        this.deliveryPrice = 300;
        this.promoCode = null;
        this.promoDiscount = 0;
        this.orderFormVisible = false;
        
        this.init();
    }
    
    createLocalCart() {
        console.log('CartPage: Создание локальной корзины');
        
        const items = JSON.parse(localStorage.getItem('cart')) || [];
        
        const cartInstance = {
            items: items,
            
            getTotalPrice: function() {
                return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },
            
            updateCartDisplay: function() {
                const cartCount = document.querySelector('.cart__count');
                const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
                
                if (cartCount) {
                    cartCount.textContent = totalItems;
                    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
                }
            },
            
            updateQuantity: function(productId, change) {
                const itemIndex = this.items.findIndex(item => String(item.id) === String(productId));
                
                if (itemIndex !== -1) {
                    this.items[itemIndex].quantity += change;
                    
                    if (this.items[itemIndex].quantity < 1) {
                        this.items.splice(itemIndex, 1);
                    }
                    
                    localStorage.setItem('cart', JSON.stringify(this.items));
                    this.updateCartDisplay();
                    return true;
                }
                return false;
            },
            
            removeItem: function(productId) {
                const initialLength = this.items.length;
                this.items = this.items.filter(item => String(item.id) !== String(productId));
                
                if (this.items.length !== initialLength) {
                    localStorage.setItem('cart', JSON.stringify(this.items));
                    this.updateCartDisplay();
                    return true;
                }
                return false;
            }
        };
        
        cartInstance.updateCartDisplay();
        return cartInstance;
    }
    
    init() {
        console.log('CartPage: Начало инициализации');
        
        this.renderCartItems();
        this.updateSummary();
        this.initEventListeners();
        
        console.log('CartPage: Инициализация завершена');
    }
    
    renderCartItems() {
        console.log('CartPage: Отрисовка товаров');
        const cartItemsList = document.getElementById('cart-items-list');
        const cartEmpty = document.getElementById('cart-empty');
        
        if (!cartItemsList) return;
        
        // Всегда скрываем сообщение о пустой корзине на время
        if (cartEmpty) {
            cartEmpty.style.display = 'none';
        }
        
        // Очищаем список
        cartItemsList.innerHTML = '';
        
        // ЕСЛИ КОРЗИНА ПУСТА - ПОКАЗЫВАЕМ СООБЩЕНИЕ
        if (this.cart.items.length === 0) {
            console.log('CartPage: Корзина пуста, показываем сообщение');
            
            // Создаем новый элемент сообщения (на всякий случай)
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'cart-empty';
            emptyMessage.id = 'cart-empty';
            emptyMessage.innerHTML = `
                <div class="cart-empty__icon">🛒</div>
                <h3 class="cart-empty__title">Ваша корзина пуста</h3>
                <p class="cart-empty__text">Добавьте товары из каталога, чтобы сделать заказ</p>
                <a href="catalog.html" class="button cart-empty__button">Перейти в каталог</a>
            `;
            
            cartItemsList.appendChild(emptyMessage);
            
            // Обновляем счетчик товаров
            const cartTotalCount = document.getElementById('cart-total-count');
            if (cartTotalCount) {
                cartTotalCount.textContent = '0';
            }
            
            return;
        }
        
        console.log('CartPage: Отображаем', this.cart.items.length, 'товаров');
        
        // Обновляем счетчик товаров
        const totalItems = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        const cartTotalCount = document.getElementById('cart-total-count');
        if (cartTotalCount) {
            cartTotalCount.textContent = totalItems;
        }
        
        // Создаем элементы для каждого товара
        this.cart.items.forEach(item => {
            const cartItemElement = this.createCartItemElement(item);
            cartItemsList.appendChild(cartItemElement);
        });
    }
    
    createCartItemElement(item) {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item-card';
        cartItem.setAttribute('data-cart-item-id', item.id);
        
        const totalPrice = item.price * item.quantity;
        
        cartItem.innerHTML = `
            <img src="${item.image || 'images/no-image.jpg'}" alt="${item.title}" class="cart-item-card__image">
            <div class="cart-item-card__info">
                <h3 class="cart-item-card__title">${item.title}</h3>
                <div class="cart-item-card__price">${item.price.toLocaleString()} ₽</div>
                <div class="cart-item-card__total">Итого: <strong>${totalPrice.toLocaleString()} ₽</strong></div>
            </div>
            <div class="cart-item-card__controls">
                <div class="cart-item-card__quantity">
                    <button type="button" class="quantity-btn" data-page-action="decrease" data-page-id="${item.id}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button type="button" class="quantity-btn" data-page-action="increase" data-page-id="${item.id}">+</button>
                </div>
                <button type="button" class="cart-item-card__remove" data-page-action="remove" data-page-id="${item.id}">🗑️ Удалить</button>
            </div>
        `;
        
        return cartItem;
    }
    
    // Инициализация обработчиков событий
    initEventListeners() {
        console.log('CartPage: Инициализация обработчиков событий');
        
        // Обработчик для кнопок на странице корзины
        document.addEventListener('click', (e) => {
            // Используем УНИКАЛЬНЫЕ атрибуты data-page-*
            const action = e.target.getAttribute('data-page-action');
            const id = e.target.getAttribute('data-page-id');
            
            if (action && id) {
                console.log('CartPage: Обработка действия', action, 'для товара', id);
                e.preventDefault();
                e.stopPropagation();
                
                switch(action) {
                    case 'increase':
                        if (this.cart.updateQuantity(id, 1)) {
                            console.log('Товар увеличен, перерисовываем корзину');
                            this.renderCartItems();
                            this.updateSummary();
                        }
                        break;
                    case 'decrease':
                        if (this.cart.updateQuantity(id, -1)) {
                            console.log('Товар уменьшен, перерисовываем корзину');
                            this.renderCartItems();
                            this.updateSummary();
                        }
                        break;
                    case 'remove':
                        if (confirm('Удалить товар из корзины?')) {
                            if (this.cart.removeItem(id)) {
                                console.log('Товар удален, перерисовываем корзину');
                                this.renderCartItems();
                                this.updateSummary();
                            }
                        }
                        break;
                }
                return false;
            }
        });
        
        // Остальные обработчики...
        document.querySelectorAll('input[name="delivery"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateSummary();
            });
        });
        
        const applyPromoBtn = document.getElementById('apply-promo');
        if (applyPromoBtn) {
            applyPromoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyPromoCode();
            });
        }
        
        const promoInput = document.getElementById('promo-code-input');
        if (promoInput) {
            promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.applyPromoCode();
                }
            });
        }
        
        const checkoutButton = document.getElementById('checkout-button');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (this.cart.items.length === 0) {
                    alert('Корзина пуста! Добавьте товары для оформления заказа.');
                    return;
                }
                
                this.toggleOrderForm();
            });
        }
        
        const orderSubmit = document.getElementById('order-submit');
        if (orderSubmit) {
            orderSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                this.submitOrder();
            });
        }
        
        console.log('CartPage: Обработчики событий установлены');
    }
    
    updateSummary() {
        const totalItems = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        const itemsPrice = this.cart.getTotalPrice();
        
        const deliveryInput = document.querySelector('input[name="delivery"]:checked');
        const deliveryPrice = deliveryInput && deliveryInput.value === 'pickup' ? 0 : this.deliveryPrice;
        
        const subtotal = itemsPrice + deliveryPrice;
        const discount = (subtotal * this.promoDiscount) / 100;
        const total = Math.max(0, subtotal - discount);
        
        this.updateElement('summary-items-count', totalItems);
        this.updateElement('summary-items-price', `${itemsPrice.toLocaleString()} ₽`);
        this.updateElement('summary-delivery', `${deliveryPrice.toLocaleString()} ₽`);
        this.updateElement('summary-total', `${total.toLocaleString()} ₽`);
        
        this.updateCheckoutButton(total, totalItems);
        this.cart.updateCartDisplay();
    }
    
    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
    
    updateCheckoutButton(total, totalItems) {
        const checkoutButton = document.getElementById('checkout-button');
        if (!checkoutButton) return;
        
        checkoutButton.disabled = totalItems === 0;
        
        if (this.orderFormVisible) {
            checkoutButton.textContent = '← Назад к корзине';
            checkoutButton.classList.add('button--outline');
        } else {
            checkoutButton.textContent = totalItems === 0 ? 'Корзина пуста' : `Оформить заказ за ${total.toLocaleString()} ₽`;
            checkoutButton.classList.remove('button--outline');
        }
    }
    
    // Остальные методы без изменений...
    applyPromoCode() {
        const promoInput = document.getElementById('promo-code-input');
        const applyPromoBtn = document.getElementById('apply-promo');
        const code = promoInput.value.trim().toUpperCase();
        
        if (!code) {
            this.showPromoMessage('Введите промокод', 'error');
            return;
        }
        
        const validPromoCodes = {
            'TECHNO10': 10,
            'WELCOME5': 5,
            'SUMMER15': 15
        };
        
        if (validPromoCodes[code]) {
            this.promoCode = code;
            this.promoDiscount = validPromoCodes[code];
            this.showPromoMessage(`Промокод "${code}" применен! Скидка ${this.promoDiscount}%`, 'success');
            
            promoInput.disabled = true;
            if (applyPromoBtn) {
                applyPromoBtn.textContent = '✓ Применено';
                applyPromoBtn.disabled = true;
                applyPromoBtn.style.backgroundColor = '#27ae60';
            }
        } else {
            this.showPromoMessage('Неверный промокод', 'error');
        }
        
        this.updateSummary();
    }
    
    showPromoMessage(message, type = 'info') {
        const promoMessage = document.getElementById('promo-message');
        if (!promoMessage) return;
        
        promoMessage.textContent = message;
        promoMessage.className = 'promo-code__message';
        
        if (type === 'success') {
            promoMessage.classList.add('promo-code__message--success');
        } else if (type === 'error') {
            promoMessage.classList.add('promo-code__message--error');
        }
        
        setTimeout(() => {
            promoMessage.textContent = '';
            promoMessage.className = 'promo-code__message';
        }, 3000);
    }
    
    toggleOrderForm() {
        const orderForm = document.getElementById('order-form');
        const cartSummaryDetails = document.querySelector('.cart-summary__details');
        const deliveryMethod = document.querySelector('.delivery-method');
        const promoCode = document.querySelector('.promo-code');
        const agreement = document.querySelector('.cart-summary__agreement');
        const checkoutButton = document.getElementById('checkout-button');
        
        if (!orderForm || !checkoutButton) return;
        
        this.orderFormVisible = !this.orderFormVisible;
        
        if (this.orderFormVisible) {
            orderForm.style.display = 'block';
            orderForm.classList.add('order-form--active');
            
            if (cartSummaryDetails) cartSummaryDetails.style.display = 'none';
            if (deliveryMethod) deliveryMethod.style.display = 'none';
            if (promoCode) promoCode.style.display = 'none';
            if (agreement) agreement.style.display = 'none';
            
            checkoutButton.textContent = '← Назад к корзине';
            checkoutButton.classList.add('button--outline');
            
            setTimeout(() => {
                const firstInput = document.getElementById('order-name');
                if (firstInput) firstInput.focus();
            }, 100);
        } else {
            orderForm.style.display = 'none';
            orderForm.classList.remove('order-form--active');
            
            if (cartSummaryDetails) cartSummaryDetails.style.display = 'block';
            if (deliveryMethod) deliveryMethod.style.display = 'block';
            if (promoCode) promoCode.style.display = 'block';
            if (agreement) agreement.style.display = 'block';
            
            const total = this.calculateTotal();
            checkoutButton.textContent = `Оформить заказ за ${total.toLocaleString()} ₽`;
            checkoutButton.classList.remove('button--outline');
        }
        
        this.updateSummary();
    }
    
    calculateTotal() {
        const itemsPrice = this.cart.getTotalPrice();
        const deliveryInput = document.querySelector('input[name="delivery"]:checked');
        const deliveryPrice = deliveryInput && deliveryInput.value === 'pickup' ? 0 : this.deliveryPrice;
        const subtotal = itemsPrice + deliveryPrice;
        const discount = (subtotal * this.promoDiscount) / 100;
        return Math.max(0, subtotal - discount);
    }
    
    submitOrder() {
        if (!this.validateOrderForm()) {
            return;
        }
        
        const orderData = {
            items: this.cart.items,
            total: this.calculateTotal(),
            customer: {
                name: document.getElementById('order-name').value.trim(),
                phone: document.getElementById('order-phone').value.trim(),
                email: document.getElementById('order-email').value.trim() || null,
                address: document.getElementById('order-address').value.trim() || null,
                comment: document.getElementById('order-comment').value.trim() || null
            },
            delivery: document.querySelector('input[name="delivery"]:checked').value,
            promoCode: this.promoCode,
            promoDiscount: this.promoDiscount,
            date: new Date().toISOString()
        };
        
        this.showOrderConfirmation(orderData);
        
        this.cart.items = [];
        localStorage.setItem('cart', JSON.stringify(this.cart.items));
        
        // Перерисовываем корзину после оформления заказа
        this.renderCartItems();
        this.updateSummary();
        this.toggleOrderForm();
        
        this.clearOrderForm();
    }
    
    clearOrderForm() {
        const formFields = ['order-name', 'order-phone', 'order-email', 'order-address', 'order-comment'];
        
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });
        
        const agreementCheckbox = document.getElementById('order-agreement');
        if (agreementCheckbox) agreementCheckbox.checked = false;
    }
    
    validateOrderForm() {
        const name = document.getElementById('order-name').value.trim();
        const phone = document.getElementById('order-phone').value.trim();
        const agreement = document.getElementById('order-agreement').checked;
        
        let isValid = true;
        let errorMessage = '';
        
        if (!name || name.length < 2) {
            isValid = false;
            errorMessage = 'Введите корректное имя (минимум 2 символа)';
        } else if (!phone || phone.replace(/\D/g, '').length < 10) {
            isValid = false;
            errorMessage = 'Введите корректный номер телефона';
        } else if (!agreement) {
            isValid = false;
            errorMessage = 'Необходимо согласие с обработкой персональных данных';
        }
        
        if (!isValid) {
            alert(`Ошибка оформления:\n${errorMessage}`);
            return false;
        }
        
        return true;
    }
    
    showOrderConfirmation(orderData) {
        const totalItems = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
        const orderNumber = Math.floor(Math.random() * 9000) + 1000;
        
        const confirmationMessage = `
✅ ЗАКАЗ УСПЕШНО ОФОРМЛЕН!

📋 Номер заказа: #${orderNumber}
📦 Товаров: ${totalItems} шт.
💰 Сумма: ${orderData.total.toLocaleString()} ₽
${orderData.promoCode ? `🎁 Промокод: ${orderData.promoCode} (скидка ${orderData.promoDiscount}%)` : ''}
📞 Способ доставки: ${orderData.delivery === 'courier' ? 'Курьером' : 'Самовывоз'}

👤 Данные клиента:
   • Имя: ${orderData.customer.name}
   • Телефон: ${orderData.customer.phone}
   ${orderData.customer.email ? `• Email: ${orderData.customer.email}` : ''}
   ${orderData.customer.address ? `• Адрес: ${orderData.customer.address}` : ''}

Благодарим за покупку! Наш менеджер свяжется с вами в течение 30 минут.
        `;
        
        alert(confirmationMessage);
    }
}

// Инициализация
console.log('cart.js загружен');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, проверяем страницу корзины');
    
    if (window.location.pathname.includes('cart.html') || 
        document.querySelector('.cart__content')) {
        console.log('На странице корзины, инициализируем CartPage...');
        window.cartPage = new CartPage();
    } else {
        console.log('Не страница корзины, CartPage не инициализируется');
    }
});