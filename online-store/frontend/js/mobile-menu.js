// burger-menu.js
document.addEventListener('DOMContentLoaded', function() {
    const burgerBtn = document.getElementById('nav-burger');
    const navList = document.getElementById('main-nav');
    
    if (burgerBtn && navList) {
        // Изначально скрываем меню на мобилках
        if (window.innerWidth <= 768) {
            navList.style.display = 'none';
        }
        
        burgerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                if (navList.style.display === 'none' || navList.style.display === '') {
                    navList.style.display = 'flex';
                    navList.classList.add('active');
                    this.classList.add('active');
                } else {
                    navList.style.display = 'none';
                    navList.classList.remove('active');
                    this.classList.remove('active');
                }
            }
        });
        
        // Закрытие меню при клике на пункт
        const navLinks = document.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navList.style.display = 'none';
                    navList.classList.remove('active');
                    burgerBtn.classList.remove('active');
                }
            });
        });
        
        // Закрытие меню при клике вне его
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav') && window.innerWidth <= 768 && navList.style.display === 'flex') {
                navList.style.display = 'none';
                navList.classList.remove('active');
                burgerBtn.classList.remove('active');
            }
        });
        
        // При изменении размера окна
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                navList.style.display = 'flex';
                navList.classList.remove('active');
                burgerBtn.classList.remove('active');
            } else {
                navList.style.display = 'none';
                navList.classList.remove('active');
                burgerBtn.classList.remove('active');
            }
            // Обновляем отображение кнопок авторизации
            if (window.updateHeaderAuth) {
                window.updateHeaderAuth();
            }
        });
    }
});