// mobile-filters.js - с обработчиками событий на фильтрах
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
    
    console.log('Найдены элементы:', {
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
    
    // Переменная для хранения ссылки на мобильные фильтры
    let mobileFiltersElement = null;
    
    // 1. ОТКРЫТИЕ МОДАЛЬНОГО ОКНА
    function openFiltersModal() {
        console.log('Открываю модальное окно фильтров');
        
        // Копируем фильтры из десктопной версии
        copyFiltersToModal();
        
        // Добавляем обработчики на элементы фильтров
        addEventListenersToMobileFilters();
        
        // Показываем модальное окно
        filtersModal.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            filtersModal.classList.add('modal--active');
            overlay.classList.add('overlay--active');
        }, 10);
    }
    
    // 2. КОПИРОВАНИЕ ФИЛЬТРОВ В МОДАЛЬНОЕ ОКНО
    function copyFiltersToModal() {
        console.log('Копирую фильтры в модальное окно...');
        
        mobileFiltersContainer.innerHTML = '';
        
        // Создаем контейнер для фильтров
        mobileFiltersElement = document.createElement('div');
        mobileFiltersElement.className = 'catalog-filters mobile-version';
        mobileFiltersElement.style.cssText = 'display: block !important; opacity: 1 !important; width: 100% !important;';
        
        // Копируем ТОЛЬКО группы фильтров
        const filterGroups = desktopFilters.querySelectorAll('.filter-group');
        
        if (filterGroups.length === 0) {
            console.error('Не найдены группы фильтров!');
            mobileFiltersContainer.innerHTML = '<p>Фильтры не найдены</p>';
            return;
        }
        
        console.log(`Найдено ${filterGroups.length} групп фильтров`);
        
        // Копируем каждую группу
        filterGroups.forEach((group, index) => {
            const groupClone = group.cloneNode(true);
            
            // Синхронизируем значения
            syncGroupFromDesktop(groupClone, group);
            
            mobileFiltersElement.appendChild(groupClone);
        });
        
        // Добавляем в контейнер
        mobileFiltersContainer.appendChild(mobileFiltersElement);
        
        console.log('Фильтры скопированы в модальное окно');
    }
    
    // 3. ДОБАВЛЕНИЕ ОБРАБОТЧИКОВ СОБЫТИЙ НА МОБИЛЬНЫЕ ФИЛЬТРЫ
    function addEventListenersToMobileFilters() {
        if (!mobileFiltersElement) return;
        
        console.log('Добавляю обработчики на мобильные фильтры...');
        
        // 1. Обработчики на чекбоксы категорий и брендов
        const checkboxes = mobileFiltersElement.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            // Удаляем старые обработчики (если есть)
            checkbox.replaceWith(checkbox.cloneNode(true));
            
            // Находим новый чекбокс
            const newCheckbox = mobileFiltersElement.querySelector(
                `input[name="${checkbox.name}"][value="${checkbox.value}"]`
            );
            
            if (newCheckbox) {
                newCheckbox.addEventListener('change', function() {
                    console.log('Чекбокс изменен:', this.name, this.value, this.checked);
                    
                    // Сразу синхронизируем с десктопом
                    const desktopCheckbox = desktopFilters.querySelector(
                        `input[name="${this.name}"][value="${this.value}"]`
                    );
                    if (desktopCheckbox) {
                        desktopCheckbox.checked = this.checked;
                        
                        // ТРИГГЕРИМ СОБЫТИЕ на десктопном чекбоксе
                        desktopCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            }
        });
        
        // 2. Обработчики на поля цены
        const priceInputs = ['price-min', 'price-max'];
        priceInputs.forEach(id => {
            const mobileInput = mobileFiltersElement.querySelector(`#${id}`);
            const desktopInput = desktopFilters.querySelector(`#${id}`);
            
            if (mobileInput && desktopInput) {
                // Удаляем старый обработчик
                mobileInput.replaceWith(mobileInput.cloneNode(true));
                const newMobileInput = mobileFiltersElement.querySelector(`#${id}`);
                
                newMobileInput.addEventListener('input', function() {
                    console.log('Цена изменена:', id, this.value);
                    
                    // Синхронизируем с десктопом
                    desktopInput.value = this.value;
                    
                    // ТРИГГЕРИМ СОБЫТИЕ на десктопном инпуте
                    desktopInput.dispatchEvent(new Event('input', { bubbles: true }));
                });
            }
        });
        
        // 3. Обработчики на слайдеры цены
        const priceSliders = ['price-slider-min', 'price-slider-max'];
        priceSliders.forEach(id => {
            const mobileSlider = mobileFiltersElement.querySelector(`#${id}`);
            const desktopSlider = desktopFilters.querySelector(`#${id}`);
            
            if (mobileSlider && desktopSlider) {
                // Удаляем старый обработчик
                mobileSlider.replaceWith(mobileSlider.cloneNode(true));
                const newMobileSlider = mobileFiltersElement.querySelector(`#${id}`);
                
                newMobileSlider.addEventListener('input', function() {
                    console.log('Слайдер изменен:', id, this.value);
                    
                    // Синхронизируем с десктопом
                    desktopSlider.value = this.value;
                    
                    // ТРИГГЕРИМ СОБЫТИЕ на десктопном слайдере
                    desktopSlider.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // Также обновляем соответствующее поле ввода
                    if (id === 'price-slider-min') {
                        const priceMin = mobileFiltersElement.querySelector('#price-min');
                        const desktopMin = desktopFilters.querySelector('#price-min');
                        if (priceMin && desktopMin) {
                            priceMin.value = this.value;
                            desktopMin.value = this.value;
                            desktopMin.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    } else if (id === 'price-slider-max') {
                        const priceMax = mobileFiltersElement.querySelector('#price-max');
                        const desktopMax = desktopFilters.querySelector('#price-max');
                        if (priceMax && desktopMax) {
                            priceMax.value = this.value;
                            desktopMax.value = this.value;
                            desktopMax.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                });
            }
        });
        
        console.log('Обработчики событий добавлены на мобильные фильтры');
    }
    
    // 4. СИНХРОНИЗАЦИЯ ОДНОЙ ГРУППЫ ФИЛЬТРОВ
    function syncGroupFromDesktop(mobileGroup, desktopGroup) {
        // Синхронизируем чекбоксы
        const mobileCheckboxes = mobileGroup.querySelectorAll('input[type="checkbox"]');
        const desktopCheckboxes = desktopGroup.querySelectorAll('input[type="checkbox"]');
        
        mobileCheckboxes.forEach((mobileCheckbox, index) => {
            if (desktopCheckboxes[index]) {
                mobileCheckbox.checked = desktopCheckboxes[index].checked;
            }
        });
        
        // Синхронизируем поля цены (только для первой группы)
        if (mobileGroup.querySelector('#price-min')) {
            const priceIds = ['price-min', 'price-max', 'price-slider-min', 'price-slider-max'];
            priceIds.forEach(id => {
                const mobileInput = mobileGroup.querySelector(`#${id}`);
                const desktopInput = desktopGroup.querySelector(`#${id}`);
                if (mobileInput && desktopInput) {
                    mobileInput.value = desktopInput.value;
                }
            });
        }
    }
    
    // 5. ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА
    function closeFiltersModal() {
        console.log('Закрываю модальное окно');
        
        filtersModal.style.display = 'none';
        overlay.style.display = 'none';
        document.body.style.overflow = '';
        
        filtersModal.classList.remove('modal--active');
        overlay.classList.remove('overlay--active');
    }
    
    // 6. ПРИМЕНЕНИЕ ФИЛЬТРОВ (просто закрывает окно, фильтры уже применяются в реальном времени)
    function applyFilters() {
        console.log('Применяю фильтры и закрываю окно...');
        
        // Фильтры уже применены через обработчики событий выше
        // Просто закрываем окно
        closeFiltersModal();
    }
    
    // 7. СБРОС ФИЛЬТРОВ
    function resetAllFilters() {
        console.log('Сбрасываю все фильтры');
        
        // Сбрасываем в основном каталоге
        if (window.catalog && typeof window.catalog.resetFilters === 'function') {
            window.catalog.resetFilters();
        }
        
        // Обновляем модальное окно
        setTimeout(copyFiltersToModal, 100);
    }
    
    // НАЗНАЧАЕМ ОБРАБОТЧИКИ СОБЫТИЙ
    filtersToggle.addEventListener('click', openFiltersModal);
    console.log('Обработчик для кнопки фильтров добавлен');
    
    // Закрытие по крестику
    const closeBtn = filtersModal.querySelector('.modal__close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFiltersModal);
        console.log('Обработчик для крестика добавлен');
    }
    
    // Закрытие по кнопке "Отмена"
    const cancelBtn = filtersModal.querySelector('.button--outline');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeFiltersModal);
        console.log('Обработчик для "Отмена" добавлен');
    }
    
    // Применение фильтров
    const applyBtn = document.getElementById('apply-filters');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
        console.log('Обработчик для "Применить" добавлен');
    }
    
    // Сброс в модальном окне
    const mobileResetBtn = document.getElementById('mobile-reset-filters');
    if (mobileResetBtn) {
        mobileResetBtn.addEventListener('click', resetAllFilters);
        console.log('Обработчик для сброса в модальном окне добавлен');
    }
    
    // Сброс в десктопной версии
    const desktopResetBtn = document.getElementById('reset-filters');
    if (desktopResetBtn) {
        desktopResetBtn.addEventListener('click', resetAllFilters);
        console.log('Обработчик для сброса в десктопе добавлен');
    }
    
    // Закрытие по клику на оверлей
    overlay.addEventListener('click', closeFiltersModal);
    
    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && filtersModal.style.display === 'block') {
            closeFiltersModal();
        }
    });
    
    // Закрытие при переходе на десктоп
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && filtersModal.style.display === 'block') {
            closeFiltersModal();
        }
    });
    
    console.log('Mobile filters успешно инициализированы!');
}