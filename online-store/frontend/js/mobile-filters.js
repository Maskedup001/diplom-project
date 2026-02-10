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
        
        // СОЗДАЕМ ПРОСТУЮ КОПИЮ БЕЗ ИЗМЕНЕНИЯ ID
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
        const priceElements = [
            { mobileSelector: '#price-min', desktopSelector: '#price-min' },
            { mobileSelector: '#price-max', desktopSelector: '#price-max' },
            { mobileSelector: '#price-slider-min', desktopSelector: '#price-slider-min' },
            { mobileSelector: '#price-slider-max', desktopSelector: '#price-slider-max' }
        ];
        
        priceElements.forEach(({ mobileSelector, desktopSelector }) => {
            const mobileEl = mobileContainer.querySelector(mobileSelector);
            const desktopEl = document.querySelector(desktopSelector);
            
            if (mobileEl && desktopEl) {
                mobileEl.value = desktopEl.value;
            }
        });
        
        console.log('✅ Значения синхронизированы');
    }
    
    // 5. ДОБАВЛЕНИЕ ОБРАБОТЧИКОВ НА МОБИЛЬНЫЕ ФИЛЬТРЫ
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
        
        // Б. Обработчики на полях цены (ручной ввод)
        const priceMin = mobileContainer.querySelector('#price-min');
        const priceMax = mobileContainer.querySelector('#price-max');
        const desktopMin = document.querySelector('#price-min');
        const desktopMax = document.querySelector('#price-max');
        
        if (priceMin && desktopMin) {
            priceMin.addEventListener('input', function() {
                const value = this.value;
                desktopMin.value = value;
                
                // Триггерим событие
                const inputEvent = new Event('input', { bubbles: true });
                desktopMin.dispatchEvent(inputEvent);
            });
        }
        
        if (priceMax && desktopMax) {
            priceMax.addEventListener('input', function() {
                const value = this.value;
                desktopMax.value = value;
                
                // Триггерим событие
                const inputEvent = new Event('input', { bubbles: true });
                desktopMax.dispatchEvent(inputEvent);
            });
        }
        
        // В. Обработчики на слайдерах цены
        const priceSliderMin = mobileContainer.querySelector('#price-slider-min');
        const priceSliderMax = mobileContainer.querySelector('#price-slider-max');
        const desktopSliderMin = document.querySelector('#price-slider-min');
        const desktopSliderMax = document.querySelector('#price-slider-max');
        
        if (priceSliderMin && desktopSliderMin) {
            priceSliderMin.addEventListener('input', function() {
                const value = this.value;
                desktopSliderMin.value = value;
                
                // Также обновляем поле ввода
                if (priceMin && desktopMin) {
                    priceMin.value = value;
                    desktopMin.value = value;
                }
                
                // Триггерим событие
                const inputEvent = new Event('input', { bubbles: true });
                desktopSliderMin.dispatchEvent(inputEvent);
            });
        }
        
        if (priceSliderMax && desktopSliderMax) {
            priceSliderMax.addEventListener('input', function() {
                const value = this.value;
                desktopSliderMax.value = value;
                
                // Также обновляем поле ввода
                if (priceMax && desktopMax) {
                    priceMax.value = value;
                    desktopMax.value = value;
                }
                
                // Триггерим событие
                const inputEvent = new Event('input', { bubbles: true });
                desktopSliderMax.dispatchEvent(inputEvent);
            });
        }
        
        console.log('✅ Обработчики добавлены');
    }
    
    // 6. ПРИМЕНЕНИЕ ФИЛЬТРОВ
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
    
    // 7. СБРОС ВСЕХ ФИЛЬТРОВ
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
        sync: syncFiltersFromDesktop
    };
    console.log('🔧 Для отладки в консоли используй: debugMobileFilters.open()');
}