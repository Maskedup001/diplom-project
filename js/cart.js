// ========== УПРАВЛЕНИЕ КОРЗИНОЙ НА СТРАНИЦЕ ==========
class CartPage {
    constructor() {
        console.log('CartPage создан');
        
        // Используем глобальную корзину или создаем новую
        this.cart = window.cart || this.createLocalCart();
        
        this.deliveryPrice = 300;
        this.promoCode = null;
        this.promoDiscount = 0;
        this.orderFormVisible = false;
        
        this.init();
    }
    
    // Создаем локальную корзину для страницы
    createLocalCart() {
        console.log('Создаем локальную корзину для страницы корзины');
        
        // Берем данные из localStorage
        const items = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Создаем объект с методами для работы с корзиной
        return {
            items: items,
            
            // Метод для получения общей стоимости
            getTotalPrice: function() {
                return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },
            
            // Метод для обновления счетчика в шапке
            updateCartDisplay: function() {
                const cartCount = document.querySelector('.cart__count');
                const cartText = document.querySelector('.cart__text');
                const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
                
                if (cartCount) {
                    cartCount.textContent = totalItems;
                    cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
                }
                
                if (cartText) {
                    cartText.textContent = totalItems > 0 ? `Корзина (${totalItems})` : 'Корзина';
                }
            },
            
            // Метод для изменения количества товара
            updateQuantity: function(productId, change) {
                const item = this.items.find(item => String(item.id) === String(productId));
                
                if (item) {
                    item.quantity += change;
                    
                    // Если количество стало 0 или меньше, удаляем товар
                    if (item.quantity < 1) {
                        this.items = this.items.filter(item => String(item.id) !== String(productId));
                    }
                    
                    // Сохраняем в localStorage
                    localStorage.setItem('cart', JSON.stringify(this.items));
                    this.updateCartDisplay();
                    
                    return true;
                }
                return false;
            },
            
            // Метод для удаления товара
            removeItem: function(productId) {
                this.items = this.items.filter(item => String(item.id) !== String(productId));
                localStorage.setItem('cart', JSON.stringify(this.items));
                this.updateCartDisplay();
                return true;
            }
        };
    }
    
    init() {
        console.log('Инициализация CartPage на странице корзины');
        
        // Проверяем элементы на странице
        this.debugElements();
        
        // Отображаем товары в корзине
        this.renderCartItems();
        
        // Обновляем итоги заказа
        this.updateSummary();
        
        // Инициализируем обработчики событий
        this.initEventListeners();
        
        // Обновляем счетчик в шапке
        this.cart.updateCartDisplay();
        
        console.log('CartPage инициализирован');
    }
    
    debugElements() {
        console.log('=== ДЕБАГ CartPage ===');
        console.log('checkout-button:', document.getElementById('checkout-button'));
        console.log('order-form:', document.getElementById('order-form'));
        console.log('Товаров в корзине:', this.cart.items.length);
        console.log('======================');
    }
    
    // Отрисовка товаров в корзине
    renderCartItems() {
        const cartItemsList = document.getElementById('cart-items-list');
        const cartEmpty = document.getElementById('cart-empty');
        const cartTotalCount = document.getElementById('cart-total-count');
        
        if (!cartItemsList) {
            console.error('CartPage: Не найден элемент cart-items-list');
            return;
        }
        
        // Прячем блок "корзина пуста" на время
        if (cartEmpty) {
            cartEmpty.style.display = 'none';
        }
        
        // Очищаем список
        cartItemsList.innerHTML = '';
        
        // Если корзина пуста
        if (this.cart.items.length === 0) {
            console.log('CartPage: Корзина пуста');
            if (cartEmpty) {
                cartEmpty.style.display = 'block';
                cartItemsList.appendChild(cartEmpty);
            }
            
            if (cartTotalCount) {
                cartTotalCount.textContent = '0';
            }
            
            return;
        }
        
        console.log('CartPage: Отображаем товары в корзине');
        
        // Обновляем счетчик товаров
        const totalItems = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
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
        cartItem.setAttribute('data-id', item.id);
        
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
                    <button class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
                </div>
                <button class="cart-item-card__remove" data-action="remove" data-id="${item.id}">🗑️ Удалить</button>
            </div>
        `;
        
        return cartItem;
    }
    
    // Обновление итоговой суммы
    updateSummary() {
        const totalItems = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        const itemsPrice = this.cart.getTotalPrice();
        
        const deliveryInput = document.querySelector('input[name="delivery"]:checked');
        const deliveryPrice = deliveryInput && deliveryInput.value === 'pickup' ? 0 : this.deliveryPrice;
        
        const subtotal = itemsPrice + deliveryPrice;
        const discount = (subtotal * this.promoDiscount) / 100;
        const total = Math.max(0, subtotal - discount);
        
        // Обновляем значения на странице
        this.updateElement('summary-items-count', totalItems);
        this.updateElement('summary-items-price', `${itemsPrice.toLocaleString()} ₽`);
        this.updateElement('summary-delivery', `${deliveryPrice.toLocaleString()} ₽`);
        this.updateElement('summary-total', `${total.toLocaleString()} ₽`);
        
        // Обновляем кнопку оформления
        this.updateCheckoutButton(total, totalItems);
        
        // Обновляем счетчик в шапке
        this.cart.updateCartDisplay();
    }
    
    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
    
    updateCheckoutButton(total, totalItems) {
        const checkoutButton = document.getElementById('checkout-button');
        if (!checkoutButton) return;
        
        // Разрешаем кнопку только если есть товары
        checkoutButton.disabled = totalItems === 0;
        
        if (this.orderFormVisible) {
            checkoutButton.textContent = '← Назад к корзине';
            checkoutButton.classList.add('button--outline');
        } else {
            checkoutButton.textContent = totalItems === 0 ? 'Корзина пуста' : `Оформить заказ за ${total.toLocaleString()} ₽`;
            checkoutButton.classList.remove('button--outline');
        }
    }
    
    // Инициализация обработчиков событий
    initEventListeners() {
        console.log('CartPage: Добавление обработчиков событий');
        
        // Обработка изменения количества товаров (делегирование)
        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const id = e.target.dataset.id;
            
            if (action && id) {
                console.log('CartPage: Действие:', action, 'ID:', id);
                
                switch(action) {
                    case 'increase':
                        if (this.cart.updateQuantity(id, 1)) {
                            this.renderCartItems();
                            this.updateSummary();
                        }
                        break;
                    case 'decrease':
                        if (this.cart.updateQuantity(id, -1)) {
                            this.renderCartItems();
                            this.updateSummary();
                        }
                        break;
                    case 'remove':
                        if (confirm('Удалить товар из корзины?')) {
                            if (this.cart.removeItem(id)) {
                                this.renderCartItems();
                                this.updateSummary();
                            }
                        }
                        break;
                }
            }
        });
        
        // Способ доставки
        document.querySelectorAll('input[name="delivery"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateSummary();
            });
        });
        
        // Промокод
        const applyPromoBtn = document.getElementById('apply-promo');
        if (applyPromoBtn) {
            applyPromoBtn.addEventListener('click', () => {
                this.applyPromoCode();
            });
        }
        
        const promoInput = document.getElementById('promo-code-input');
        if (promoInput) {
            promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyPromoCode();
                }
            });
        }
        
        // КНОПКА ОФОРМЛЕНИЯ ЗАКАЗА - ГЛАВНЫЙ ЭЛЕМЕНТ
        const checkoutButton = document.getElementById('checkout-button');
        if (checkoutButton) {
            console.log('CartPage: Обработчик кнопки оформления добавлен');
            
            checkoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('CartPage: Кнопка "Оформить заказ" нажата!');
                
                if (this.cart.items.length === 0) {
                    alert('Корзина пуста! Добавьте товары для оформления заказа.');
                    return;
                }
                
                this.toggleOrderForm();
            });
        }
        
        // Кнопка подтверждения заказа
        const orderSubmit = document.getElementById('order-submit');
        if (orderSubmit) {
            orderSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                this.submitOrder();
            });
        }
    }
    
    // Применение промокода
    applyPromoCode() {
        const promoInput = document.getElementById('promo-code-input');
        const applyPromoBtn = document.getElementById('apply-promo');
        const code = promoInput.value.trim().toUpperCase();
        
        if (!code) {
            this.showPromoMessage('Введите промокод', 'error');
            return;
        }
        
        // Проверяем промокоды
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
        
        // Автоматически скрываем сообщение через 3 секунды
        setTimeout(() => {
            promoMessage.textContent = '';
            promoMessage.className = 'promo-code__message';
        }, 3000);
    }
    
    // Показать/скрыть форму оформления
    toggleOrderForm() {
        console.log('CartPage: toggleOrderForm вызван');
        
        const orderForm = document.getElementById('order-form');
        const cartSummaryDetails = document.querySelector('.cart-summary__details');
        const deliveryMethod = document.querySelector('.delivery-method');
        const promoCode = document.querySelector('.promo-code');
        const agreement = document.querySelector('.cart-summary__agreement');
        const checkoutButton = document.getElementById('checkout-button');
        
        if (!orderForm || !checkoutButton) {
            console.error('CartPage: Не найдены элементы формы');
            return;
        }
        
        // Переключаем состояние
        this.orderFormVisible = !this.orderFormVisible;
        
        if (this.orderFormVisible) {
            // ПОКАЗЫВАЕМ ФОРМУ ОФОРМЛЕНИЯ
            orderForm.style.display = 'block';
            orderForm.classList.add('order-form--active');
            
            // Скрываем остальные элементы
            if (cartSummaryDetails) cartSummaryDetails.style.display = 'none';
            if (deliveryMethod) deliveryMethod.style.display = 'none';
            if (promoCode) promoCode.style.display = 'none';
            if (agreement) agreement.style.display = 'none';
            
            checkoutButton.textContent = '← Назад к корзине';
            checkoutButton.classList.add('button--outline');
            
            console.log('CartPage: Форма оформления ПОКАЗАНА');
            
            // Фокус на первое поле формы
            setTimeout(() => {
                const firstInput = document.getElementById('order-name');
                if (firstInput) firstInput.focus();
            }, 100);
        } else {
            // СКРЫВАЕМ ФОРМУ ОФОРМЛЕНИЯ
            orderForm.style.display = 'none';
            orderForm.classList.remove('order-form--active');
            
            // Показываем остальные элементы
            if (cartSummaryDetails) cartSummaryDetails.style.display = 'block';
            if (deliveryMethod) deliveryMethod.style.display = 'block';
            if (promoCode) promoCode.style.display = 'block';
            if (agreement) agreement.style.display = 'block';
            
            const total = this.calculateTotal();
            checkoutButton.textContent = `Оформить заказ за ${total.toLocaleString()} ₽`;
            checkoutButton.classList.remove('button--outline');
            
            console.log('CartPage: Форма оформления СКРЫТА');
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
    
    // Отправка заказа
    submitOrder() {
        console.log('CartPage: Начало оформления заказа');
        
        if (!this.validateOrderForm()) {
            return;
        }
        
        // Собираем данные заказа
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
        
        console.log('CartPage: Данные заказа:', orderData);
        
        // Показываем подтверждение
        this.showOrderConfirmation(orderData);
        
        // Очищаем корзину
        this.cart.items = [];
        localStorage.setItem('cart', JSON.stringify(this.cart.items));
        
        // Обновляем отображение
        this.renderCartItems();
        this.updateSummary();
        this.toggleOrderForm();
        
        // Очищаем поля формы (без использования reset())
        this.clearOrderForm();
    }
    
    // Очистка полей формы (без использования reset())
    clearOrderForm() {
        const formFields = ['order-name', 'order-phone', 'order-email', 'order-address', 'order-comment'];
        
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });
        
        // Снимаем чекбокс согласия
        const agreementCheckbox = document.getElementById('order-agreement');
        if (agreementCheckbox) {
            agreementCheckbox.checked = false;
        }
        
        console.log('CartPage: Поля формы очищены');
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

// Инициализация страницы корзины
console.log('cart.js загружен');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, проверяем страницу корзины');
    
    // Проверяем, что мы на странице корзины
    if (window.location.pathname.includes('cart.html') || 
        document.querySelector('.cart__content')) {
        console.log('На странице корзины, инициализируем CartPage...');
        window.cartPage = new CartPage();
    } else {
        console.log('Не страница корзины, CartPage не инициализируется');
    }
});