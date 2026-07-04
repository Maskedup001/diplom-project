// carousel.js - управление каруселью
document.addEventListener('DOMContentLoaded', function() {
    initCarousels();
});

function initCarousels() {
    // Используем делегирование событий
    document.addEventListener('click', handleCarouselClick);
}

function handleCarouselClick(e) {
    const target = e.target;
    
    // Кнопка "вперед"
    if (target.classList.contains('product-card__carousel-btn--next')) {
        e.preventDefault();
        e.stopPropagation();
        const container = target.closest('.product-card__carousel-container');
        if (container) nextSlide(container);
    }
    
    // Кнопка "назад"
    if (target.classList.contains('product-card__carousel-btn--prev')) {
        e.preventDefault();
        e.stopPropagation();
        const container = target.closest('.product-card__carousel-container');
        if (container) prevSlide(container);
    }
    
    // Точки
    if (target.classList.contains('product-card__carousel-dot')) {
        e.preventDefault();
        e.stopPropagation();
        const container = target.closest('.product-card__carousel-container');
        const index = parseInt(target.dataset.index);
        if (container && !isNaN(index)) goToSlide(container, index);
    }
}

function nextSlide(container) {
    const track = container.querySelector('.product-card__carousel-track');
    const slides = track.children;
    const dots = container.querySelectorAll('.product-card__carousel-dot');
    let currentIndex = parseInt(container.dataset.currentIndex || '0');
    
    if (isNaN(currentIndex)) {
        dots.forEach((dot, i) => {
            if (dot.classList.contains('active')) currentIndex = i;
        });
    }
    
    const nextIndex = (currentIndex + 1) % slides.length;
    updateCarousel(container, nextIndex);
}

function prevSlide(container) {
    const track = container.querySelector('.product-card__carousel-track');
    const slides = track.children;
    const dots = container.querySelectorAll('.product-card__carousel-dot');
    let currentIndex = parseInt(container.dataset.currentIndex || '0');
    
    if (isNaN(currentIndex)) {
        dots.forEach((dot, i) => {
            if (dot.classList.contains('active')) currentIndex = i;
        });
    }
    
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateCarousel(container, prevIndex);
}

function goToSlide(container, index) {
    updateCarousel(container, index);
}

function updateCarousel(container, newIndex) {
    const track = container.querySelector('.product-card__carousel-track');
    const dots = container.querySelectorAll('.product-card__carousel-dot');
    
    if (!track) return;
    
    container.dataset.currentIndex = newIndex;
    track.style.transform = `translateX(-${newIndex * 100}%)`;
    
    dots.forEach((dot, i) => {
        if (i === newIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}