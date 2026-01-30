// ========== АУТЕНТИФИКАЦИЯ И РЕГИСТРАЦИЯ ==========

// DOM элементы
let loginForm, registerForm;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Форма входа
    loginForm = document.getElementById('loginForm');
    if (loginForm) {
        initLoginForm();
    }
    
    // Форма регистрации
    registerForm = document.getElementById('registerForm');
    if (registerForm) {
        initRegisterForm();
    }
});

// ========== ФОРМА ВХОДА ==========
function initLoginForm() {
    const form = loginForm;
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const rememberCheckbox = document.getElementById('remember-me');
    
    // Добавляем глазок для пароля
    addPasswordToggle(passwordInput);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Валидация
        if (!validateLoginForm()) {
            return;
        }
        
        // Данные формы
        const formData = {
            email: emailInput.value.trim(),
            password: passwordInput.value,
            remember: rememberCheckbox.checked
        };
        
        // Показываем загрузку
        showLoading(form, true);
        
        try {
            // Отправляем запрос на сервер
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Успешный вход
                showMessage(form, 'success', 'Вход выполнен успешно!');
                
                // Сохраняем токен
                if (result.token) {
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    
                    if (formData.remember) {
                        localStorage.setItem('remember_me', 'true');
                    }
                }
                
                // Редирект через 1.5 секунды
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                
            } else {
                // Ошибка от сервера
                showMessage(form, 'error', result.error || 'Ошибка входа');
                showLoading(form, false);
            }
            
        } catch (error) {
            console.error('Ошибка при входе:', error);
            showMessage(form, 'error', 'Ошибка соединения с сервером');
            showLoading(form, false);
        }
    });
    
    // Валидация в реальном времени
    emailInput.addEventListener('blur', () => validateEmail(emailInput));
    passwordInput.addEventListener('blur', () => validatePassword(passwordInput));
}

// ========== ФОРМА РЕГИСТРАЦИИ ==========
function initRegisterForm() {
    const form = registerForm;
    const passwordInput = document.getElementById('register-password');
    const confirmInput = document.getElementById('register-confirm');
    const phoneInput = document.getElementById('register-phone');
    
    // Добавляем глазки для паролей
    addPasswordToggle(passwordInput);
    addPasswordToggle(confirmInput);
    
    // ФОРМАТИРОВАНИЕ ТЕЛЕФОНА - ИСПРАВЛЕННЫЙ ВАРИАНТ
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            formatPhoneNumber(e.target);
        });
        
        // Разрешаем ввод любых символов
        phoneInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                e.preventDefault();
            }
        });
    }
    
    // Реальная проверка пароля
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePasswordStrength);
        confirmInput.addEventListener('input', validatePasswordMatch);
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Валидация
        if (!validateRegisterForm()) {
            return;
        }
        
        // Собираем данные
        const name = document.getElementById('register-name').value.trim();
        const surname = document.getElementById('register-surname').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const password = document.getElementById('register-password').value;
        
        // Показываем загрузку
        showLoading(form, true);
        
        try {
            // Подготавливаем данные для нашего backend
            const backendData = {
                username: email.split('@')[0], // Берем часть email как username
                email: email,
                password: password,
                full_name: `${name} ${surname}`.trim(),
                phone: phone || ''
            };
            
            // Отправляем запрос на сервер
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(backendData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Успешная регистрация
                showMessage(form, 'success', 'Регистрация успешна!');
                
                // Сохраняем токен
                if (result.token) {
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                }
                
                // Автоматический вход или редирект
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
                
            } else {
                // Ошибка от сервера
                showMessage(form, 'error', result.error || 'Ошибка регистрации');
                showLoading(form, false);
            }
            
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            showMessage(form, 'error', 'Ошибка соединения с сервером');
            showLoading(form, false);
        }
    });
    
    // Валидация в реальном времени
    const inputs = form.querySelectorAll('.form__input');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            if (input.id.includes('email')) validateEmail(input);
            if (input.id.includes('password')) validatePassword(input);
            if (input.id.includes('name') || input.id.includes('surname')) validateName(input);
        });
    });
}

// ========== ДОБАВЛЕНИЕ ГЛАЗКА ДЛЯ ПАРОЛЯ ==========
function addPasswordToggle(passwordInput) {
    if (!passwordInput || passwordInput.type !== 'password') return;
    
    // Проверяем, не добавлен ли уже глазок
    if (passwordInput.closest('.password-field')) {
        return;
    }
    
    // Создаем контейнер для поля
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'password-field';
    
    // Получаем родительский контейнер
    const formGroup = passwordInput.closest('.form__group');
    if (!formGroup) return;
    
    // Оборачиваем input в контейнер
    const parent = passwordInput.parentNode;
    parent.insertBefore(fieldContainer, passwordInput);
    fieldContainer.appendChild(passwordInput);
    
    // Добавляем отступ для глазка
    passwordInput.style.paddingRight = '45px';
    
    // Создаем кнопку глазка
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'password-toggle';
    toggleButton.setAttribute('aria-label', 'Показать/скрыть пароль');
    toggleButton.setAttribute('tabindex', '-1');
    toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
    `;
    
    // Добавляем кнопку в контейнер
    fieldContainer.appendChild(toggleButton);
    
    // Обработчик переключения видимости
    toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        
        // Меняем иконку
        toggleButton.innerHTML = isPassword ? `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
            </svg>
        ` : `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
        `;
    });
}

// ========== ФОРМАТИРОВАНИЕ ТЕЛЕФОНА ==========
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        // Формат: +7 (XXX) XXX-XX-XX
        let formatted = '+7 ';
        
        if (value.length > 1) {
            formatted += '(' + value.substring(1, 4);
        }
        
        if (value.length > 4) {
            formatted += ') ' + value.substring(4, 7);
        }
        
        if (value.length > 7) {
            formatted += '-' + value.substring(7, 9);
        }
        
        if (value.length > 9) {
            formatted += '-' + value.substring(9, 11);
        }
        
        input.value = formatted;
    }
}

// ========== ВАЛИДАЦИЯ ==========
function validateLoginForm() {
    let isValid = true;
    
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    if (!validateEmail(emailInput)) {
        isValid = false;
    }
    
    if (!validatePassword(passwordInput)) {
        isValid = false;
    }
    
    return isValid;
}

function validateRegisterForm() {
    let isValid = true;
    
    const requiredInputs = registerForm.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            showFieldError(input, 'Это поле обязательно для заполнения');
            isValid = false;
        } else {
            clearFieldError(input);
        }
    });
    
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const confirmInput = document.getElementById('register-confirm');
    const termsCheckbox = document.getElementById('agree-terms');
    
    if (!validateEmail(emailInput)) isValid = false;
    if (!validatePassword(passwordInput)) isValid = false;
    if (!validatePasswordMatch()) isValid = false;
    if (!termsCheckbox.checked) {
        showFieldError(termsCheckbox, 'Необходимо согласие с условиями');
        isValid = false;
    }
    
    return isValid;
}

function validateEmail(inputElement) {
    const input = inputElement;
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        showFieldError(input, 'Email обязателен');
        return false;
    }
    
    if (!emailRegex.test(email)) {
        showFieldError(input, 'Введите корректный email');
        return false;
    }
    
    clearFieldError(input);
    return true;
}

function validatePassword(inputElement) {
    const input = inputElement;
    const password = input.value;
    
    if (!password) {
        showFieldError(input, 'Пароль обязателен');
        return false;
    }
    
    if (password.length < 6) {
        showFieldError(input, 'Пароль должен быть не менее 6 символов');
        return false;
    }
    
    clearFieldError(input);
    return true;
}

function validatePasswordStrength() {
    const input = document.getElementById('register-password');
    const password = input.value;
    const strengthBar = document.querySelector('.password-strength__bar');
    
    if (!strengthBar) return;
    
    let strength = 'weak';
    if (password.length >= 8) {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
        
        if (score >= 3 && password.length >= 10) strength = 'strong';
        else if (score >= 2) strength = 'medium';
    }
    
    strengthBar.className = 'password-strength__bar password-strength__bar--' + strength;
}

function validatePasswordMatch() {
    const passwordInput = document.getElementById('register-password');
    const confirmInput = document.getElementById('register-confirm');
    
    if (!passwordInput || !confirmInput) return true;
    
    if (passwordInput.value !== confirmInput.value) {
        showFieldError(confirmInput, 'Пароли не совпадают');
        return false;
    }
    
    clearFieldError(confirmInput);
    return true;
}

function validateName(input) {
    const name = input.value.trim();
    
    if (!name) {
        showFieldError(input, 'Это поле обязательно');
        return false;
    }
    
    if (name.length < 2) {
        showFieldError(input, 'Минимум 2 символа');
        return false;
    }
    
    clearFieldError(input);
    return true;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function showFieldError(input, message) {
    const errorElement = input.closest('.form__group').querySelector('.form__error');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('form__error--visible');
        input.classList.add('form__input--error');
    }
}

function clearFieldError(input) {
    const errorElement = input.closest('.form__group').querySelector('.form__error');
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('form__error--visible');
        input.classList.remove('form__input--error');
    }
}

function showMessage(form, type, message) {
    const oldMessages = form.querySelectorAll('.auth__message');
    oldMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth__message auth__message--${type}`;
    messageDiv.textContent = message;
    
    const title = form.closest('.auth__card').querySelector('.auth__title');
    title.after(messageDiv);
    
    if (type === 'error') {
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

function showLoading(form, show) {
    const button = form.querySelector('.auth__button');
    const buttonText = button.querySelector('.button__text');
    
    if (show) {
        button.disabled = true;
        buttonText.innerHTML = '<span class="auth__spinner"></span> Загрузка...';
        button.classList.add('auth__loading--visible');
    } else {
        button.disabled = false;
        buttonText.textContent = button.getAttribute('data-original-text') || 
                                (form.id === 'loginForm' ? 'Войти' : 'Зарегистрироваться');
        button.classList.remove('auth__loading--visible');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('remember_me');
    window.location.href = 'index.html';
}

// Экспорт для использования в других файлах
window.authModule = {
    validateEmail,
    validatePassword,
    logout
};