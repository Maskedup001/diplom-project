// burger-menu.js
document.addEventListener('DOMContentLoaded', function() {
    const burgerBtn = document.getElementById('nav-burger');
    const navList = document.getElementById('main-nav');
    
    if (!burgerBtn || !navList) return;
    
    // Функция для применения стилей в зависимости от ширины
    function applyMobileStyles() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // На мобилке: меню скрыто, бургер виден
            navList.classList.remove('active');
            burgerBtn.classList.remove('active');
        } else {
            // На десктопе: меню видно, бургер скрыт
            navList.classList.remove('active');
            burgerBtn.classList.remove('active');
            navList.style.display = ''; // сбрасываем inline-стили
        }
    }
    
    // Применяем при загрузке
    applyMobileStyles();
    
    // Клик по бургеру
    burgerBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (window.innerWidth <= 768) {
            // Переключаем класс active
            this.classList.toggle('active');
            navList.classList.toggle('active');
        }
    });
    
    // Закрытие при клике на ссылку
    navList.querySelectorAll('a, button').forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                navList.classList.remove('active');
                burgerBtn.classList.remove('active');
            }
        });
    });
    
    // Закрытие при клике вне меню
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            const isClickInside = e.target.closest('#main-nav') || e.target.closest('#nav-burger');
            
            if (!isClickInside && navList.classList.contains('active')) {
                navList.classList.remove('active');
                burgerBtn.classList.remove('active');
            }
        }
    });
    
    // При изменении размера окна
    window.addEventListener('resize', function() {
        applyMobileStyles();
        
        // Обновляем авторизацию
        if (window.updateHeaderAuth) {
            window.updateHeaderAuth();
        }
    });
});