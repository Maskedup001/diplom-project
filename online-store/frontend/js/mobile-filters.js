// mobile-filters.js - управление мобильными фильтрами
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mobile filters: загружаю...');
    initMobileFilters();
});

function initMobileFilters() {
    const filtersToggle = document.getElementById('mobile-filters-toggle');
    const filtersModal = document.getElementById('filters-modal');
    const mobileFiltersContainer = document.getElementById('mobile-filters-container');
    const desktopFilters = document.querySelector('.catalog-filters');
    const overlay = document.getElementById('overlay');
    
    console.log('Элементы найдены:', {
        filtersToggle: !!filtersToggle,
        filtersModal: !!filtersModal,
        mobileFiltersContainer: !!mobileFiltersContainer,
        desktopFilters: !!desktopFilters,
        overlay: !!overlay
    });
    
    if (!filtersToggle || !filtersModal || !mobileFiltersContainer || !desktopFilters || !overlay) {
        console.error('Mobile filters: не все элементы найдены!');
        return;
    }
    
    // ========== ОСНОВНЫЕ ФУНКЦИИ ==========
    
    // 1. ОТКРЫТИЕ МОДАЛЬНОГО ОКНА
    function openFiltersModal() {
        console.log('📱 Открываю модальное окно фильтров');
        
        // Ждем немного чтобы DOM обновился
        setTimeout(() => {
            // Копируем фильтры из десктопной версии
            copyFiltersToModal();
            
            // Инициализируем слайдер цен для мобильной версии
            initPriceRangeSlider();
            
            // Показываем модальное окно
            filtersModal.classList.add('modal--active');
            overlay.classList.add('overlay--active');
            document.body.style.overflow = 'hidden';
            
            console.log('✅ Модальное окно открыто');
        }, 50);
    }
    
    // 2. ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА
    function closeFiltersModal() {
        console.log('📱 Закрываю модальное окно фильтров');
        
        filtersModal.classList.remove('modal--active');
        overlay.classList.remove('overlay--active');
        document.body.style.overflow = '';
        
        // Очищаем контейнер при закрытии
        setTimeout(() => {
            mobileFiltersContainer.innerHTML = '';
        }, 300);
        
        console.log('✅ Модальное окно закрыто');
    }
    
    // 3. КОПИРОВАНИЕ ФИЛЬТРОВ В МОДАЛЬНОЕ ОКНО
    function copyFiltersToModal() {
        console.log('📱 Копирую фильтры...');
        
        // Очищаем контейнер
        mobileFiltersContainer.innerHTML = '';
        
        // Проверяем что есть что копировать
        if (!desktopFilters || desktopFilters.children.length === 0) {
            console.error('❌ desktopFilters пустой или не найден');
            mobileFiltersContainer.innerHTML = '<div class="no-filters">Фильтры не найдены</div>';
            return;
        }
        
        // Копируем HTML фильтров
        const filtersHTML = desktopFilters.innerHTML;
        
        // Удаляем кнопку сброса если она есть
        const cleanedHTML = filtersHTML.replace(
            /<button[^>]*class="[^"]*\bcatalog-filters__reset\b[^"]*"[^>]*>.*?<\/button>/gi,
            ''
        );
        
        // Вставляем фильтры
        mobileFiltersContainer.innerHTML = cleanedHTML;
        
        // Синхронизируем значения с десктопными фильтрами
        syncFiltersFromDesktop();
        
        // Добавляем обработчики
        addEventListenersToMobileFilters();
        
        console.log('✅ Фильтры скопированы');
    }
    
    // 4. СИНХРОНИЗАЦИЯ ЗНАЧЕНИЙ ИЗ ДЕСКТОПНЫХ ФИЛЬТРОВ
    function syncFiltersFromDesktop() {
        const mobileContainer = document.getElementById('mobile-filters-container');
        if (!mobileContainer) return;
        
        console.log('📱 Синхронизирую значения...');
        
        // А. Синхронизируем чекбоксы
        const mobileCheckboxes = mobileContainer.querySelectorAll('input[type="checkbox"]');
        mobileCheckboxes.forEach(mobileCheckbox => {
            const name = mobileCheckbox.getAttribute('name');
            const value = mobileCheckbox.value;
            
            const desktopCheckbox = document.querySelector(
                `.catalog-filters input[name="${name}"][value="${value}"]`
            );
            
            if (desktopCheckbox) {
                mobileCheckbox.checked = desktopCheckbox.checked;
            }
        });
        
        // Б. Синхронизируем поля цены
        const priceMin = mobileContainer.querySelector('#price-min');
        const priceMax = mobileContainer.querySelector('#price-max');
        const priceSliderMin = mobileContainer.querySelector('#price-slider-min');
        const priceSliderMax = mobileContainer.querySelector('#price-slider-max');
        
        const desktopMin = document.querySelector('#price-min');
        const desktopMax = document.querySelector('#price-max');
        const desktopSliderMin = document.querySelector('#price-slider-min');
        const desktopSliderMax = document.querySelector('#price-slider-max');
        
        if (priceMin && desktopMin) priceMin.value = desktopMin.value;
        if (priceMax && desktopMax) priceMax.value = desktopMax.value;
        if (priceSliderMin && desktopSliderMin) priceSliderMin.value = desktopSliderMin.value;
        if (priceSliderMax && desktopSliderMax) priceSliderMax.value = desktopSliderMax.value;
        
        console.log('✅ Значения синхронизированы');
    }
    
    // 5. ИНИЦИАЛИЗАЦИЯ СЛАЙДЕРА ЦЕН (КАК В CATALOG.JS)
    function initPriceRangeSlider() {
        const mobileContainer = document.getElementById('mobile-filters-container');
        if (!mobileContainer) return;
        
        const priceMinInput = mobileContainer.querySelector('#price-min');
        const priceMaxInput = mobileContainer.querySelector('#price-max');
        const priceSliderMin = mobileContainer.querySelector('#price-slider-min');
        const priceSliderMax = mobileContainer.querySelector('#price-slider-max');
        const track = mobileContainer.querySelector('.price-range__track');
        
        const desktopMin = document.querySelector('#price-min');
        const desktopMax = document.querySelector('#price-max');
        const desktopSliderMin = document.querySelector('#price-slider-min');
        const desktopSliderMax = document.querySelector('#price-slider-max');
        
        if (!priceMinInput || !priceMaxInput || !priceSliderMin || !priceSliderMax) {
            console.warn('❌ Элементы слайдера не найдены в мобильной версии');
            return;
        }
        
        console.log('📱 Инициализирую слайдер цен...');
        
        // Функция обновления трека
        function updatePriceRangeTrack() {
            if (!track) return;
            
            const min = parseInt(priceSliderMin.value) || 0;
            const max = parseInt(priceSliderMax.value) || 500000;
            const maxPrice = 500000;
            
            const minPercent = (min / maxPrice) * 100;
            const maxPercent = (max / maxPrice) * 100;
            
            track.style.left = `${minPercent}%`;
            track.style.right = `${100 - maxPercent}%`;
        }
        
        // Обновление полей при вводе в инпуты
        priceMinInput.addEventListener('input', function(e) {
            let value = parseInt(e.target.value) || 0;
            
            // Ограничиваем минимальное значение
            value = Math.max(value, 0);
            
            // Проверяем чтобы не было больше max
            const maxValue = parseInt(priceMaxInput.value);
            if (value >= maxValue) {
                value = maxValue - 1000;
                e.target.value = value;
            }
            
            // Обновляем слайдер
            priceSliderMin.value = value;
            
            // Обновляем десктопные значения
            if (desktopMin) desktopMin.value = value;
            if (desktopSliderMin) desktopSliderMin.value = value;
            
            // Триггерим событие на десктопе
            if (desktopMin) desktopMin.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Обновляем трек
            updatePriceRangeTrack();
            
            // Применяем фильтры
            if (window.catalog && typeof window.catalog.applyFilters === 'function') {
                window.catalog.applyFilters();
            }
        });
        
        priceMaxInput.addEventListener('input', function(e) {
            let value = parseInt(e.target.value) || 500000;
            
            // Ограничиваем максимальное значение
            value = Math.min(value, 500000);
            
            // Проверяем чтобы не было меньше min
            const minValue = parseInt(priceMinInput.value);
            if (value <= minValue) {
                value = minValue + 1000;
                e.target.value = value;
            }
            
            // Обновляем слайдер
            priceSliderMax.value = value;
            
            // Обновляем десктопные значения
            if (desktopMax) desktopMax.value = value;
            if (desktopSliderMax) desktopSliderMax.value = value;
            
            // Триггерим событие на десктопе
            if (desktopMax) desktopMax.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Обновляем трек
            updatePriceRangeTrack();
            
            // Применяем фильтры
            if (window.catalog && typeof window.catalog.applyFilters === 'function') {
                window.catalog.applyFilters();
            }
        });
        
        // Обновление при движении слайдеров
        priceSliderMin.addEventListener('input', function(e) {
            let value = parseInt(e.target.value);
            const maxValue = parseInt(priceSliderMax.value);
            
            // Если пытаемся пройти через max ползунок
            if (value >= maxValue) {
                value = maxValue - 1;
                priceSliderMin.value = value;
            }
            
            // Обновляем поле ввода
            priceMinInput.value = value;
            
            // Обновляем десктопные значения
            if (desktopMin) desktopMin.value = value;
            if (desktopSliderMin) desktopSliderMin.value = value;
            
            // Триггерим событие на десктопе
            if (desktopSliderMin) {
                desktopSliderMin.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            // Обновляем трек
            updatePriceRangeTrack();
            
            // Применяем фильтры
            if (window.catalog && typeof window.catalog.applyFilters === 'function') {
                window.catalog.applyFilters();
            }
        });
        
        priceSliderMax.addEventListener('input', function(e) {
            let value = parseInt(e.target.value);
            const minValue = parseInt(priceSliderMin.value);
            
            // Если пытаемся пройти через min ползунок
            if (value <= minValue) {
                value = minValue + 1;
                priceSliderMax.value = value;
            }
            
            // Обновляем поле ввода
            priceMaxInput.value = value;
            
            // Обновляем десктопные значения
            if (desktopMax) desktopMax.value = value;
            if (desktopSliderMax) desktopSliderMax.value = value;
            
            // Триггерим событие на десктопе
            if (desktopSliderMax) {
                desktopSliderMax.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            // Обновляем трек
            updatePriceRangeTrack();
            
            // Применяем фильтры
            if (window.catalog && typeof window.catalog.applyFilters === 'function') {
                window.catalog.applyFilters();
            }
        });
        
        // Инициализация трека при загрузке
        setTimeout(updatePriceRangeTrack, 100);
        
        console.log('✅ Слайдер цен инициализирован');
    }
    
    // 6. ДОБАВЛЕНИЕ ОБРАБОТЧИКОВ НА МОБИЛЬНЫЕ ФИЛЬТРЫ
    function addEventListenersToMobileFilters() {
        const mobileContainer = document.getElementById('mobile-filters-container');
        if (!mobileContainer) return;
        
        console.log('📱 Добавляю обработчики...');
        
        // А. Обработчики на чекбоксах (категории и бренды)
        const mobileCheckboxes = mobileContainer.querySelectorAll('input[type="checkbox"]');
        mobileCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const name = this.getAttribute('name');
                const value = this.value;
                const isChecked = this.checked;
                
                console.log(`Чекбокс изменен: ${name}=${value} ${isChecked}`);
                
                // Ищем соответствующий десктопный чекбокс
                const desktopCheckbox = document.querySelector(
                    `.catalog-filters input[name="${name}"][value="${value}"]`
                );
                
                if (desktopCheckbox) {
                    // Синхронизируем состояние
                    desktopCheckbox.checked = isChecked;
                    
                    // Триггерим событие на десктопном чекбоксе
                    const changeEvent = new Event('change', { bubbles: true });
                    desktopCheckbox.dispatchEvent(changeEvent);
                }
            });
        });
        
        console.log('✅ Обработчики добавлены');
    }
    
    // 7. ПРИМЕНЕНИЕ ФИЛЬТРОВ
    function applyFilters() {
        console.log('📱 Применяю фильтры...');
        
        // Закрываем модальное окно
        closeFiltersModal();
        
        // Вызываем метод из основного каталога
        if (window.catalog && typeof window.catalog.applyFilters === 'function') {
            window.catalog.applyFilters();
        } else {
            console.warn('catalog.applyFilters не найден');
        }
    }
    
    // 8. СБРОС ВСЕХ ФИЛЬТРОВ
    function resetAllFilters() {
        console.log('📱 Сбрасываю все фильтры');
        
        // Вызываем метод из основного каталога
        if (window.catalog && typeof window.catalog.resetFilters === 'function') {
            window.catalog.resetFilters();
        } else {
            console.warn('catalog.resetFilters не найден');
        }
        
        // Обновляем мобильные фильтры через 100мс
        setTimeout(() => {
            if (filtersModal.classList.contains('modal--active')) {
                copyFiltersToModal();
                initPriceRangeSlider();
            }
        }, 100);
    }
    
    // ========== НАЗНАЧАЕМ ОБРАБОТЧИКИ СОБЫТИЙ ==========
    
    // Открытие модального окна
    filtersToggle.addEventListener('click', openFiltersModal);
    console.log('✅ Обработчик для кнопки фильтров добавлен');
    
    // Закрытие по крестику
    const closeBtn = filtersModal.querySelector('.modal__close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFiltersModal);
        console.log('✅ Обработчик для крестика добавлен');
    }
    
    // Закрытие по кнопке "Отмена"
    const cancelBtn = filtersModal.querySelector('.button--outline');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeFiltersModal);
        console.log('✅ Обработчик для "Отмена" добавлен');
    }
    
    // Применение фильтров
    const applyBtn = document.getElementById('apply-filters');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
        console.log('✅ Обработчик для "Применить" добавлен');
    }
    
    // Сброс фильтров (в модальном окне)
    const mobileResetBtn = document.getElementById('mobile-reset-filters');
    if (mobileResetBtn) {
        mobileResetBtn.addEventListener('click', resetAllFilters);
        console.log('✅ Обработчик для сброса в модальном окне добавлен');
    }
    
    // Сброс фильтров (в десктопной версии)
    const desktopResetBtn = document.getElementById('reset-filters');
    if (desktopResetBtn) {
        desktopResetBtn.addEventListener('click', resetAllFilters);
        console.log('✅ Обработчик для сброса в десктопе добавлен');
    }
    
    // Закрытие по клику на оверлей
    overlay.addEventListener('click', closeFiltersModal);
    console.log('✅ Обработчик для overlay добавлен');
    
    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && filtersModal.classList.contains('modal--active')) {
            closeFiltersModal();
        }
    });
    console.log('✅ Обработчик для ESC добавлен');
    
    // Закрытие при переходе на десктоп
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && filtersModal.classList.contains('modal--active')) {
            closeFiltersModal();
        }
    });
    console.log('✅ Обработчик для resize добавлен');
    
    console.log('🚀 Mobile filters успешно инициализированы!');
    
    // Дебаг функции для консоли
    window.debugMobileFilters = {
        open: openFiltersModal,
        close: closeFiltersModal,
        copy: copyFiltersToModal,
        sync: syncFiltersFromDesktop,
        initSlider: initPriceRangeSlider
    };
    console.log('🔧 Для отладки в консоли используй: debugMobileFilters.open()');
}