// ========== ПОИСК ПО САЙТУ ==========
class SiteSearch {
    constructor() {
        this.searchForm = document.querySelector('.search');
        this.searchInput = document.querySelector('.search__input');
        
        if (this.searchForm) {
            this.init();
        }
    }

    init() {
        // Восстанавливаем сохраненный запрос из localStorage
        this.restoreSearchQuery();
        
        // Обработка отправки формы поиска
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });
    }

    restoreSearchQuery() {
        const savedQuery = localStorage.getItem('searchQuery');
        if (savedQuery && this.searchInput) {
            this.searchInput.value = savedQuery;
        }
    }

    handleSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            this.clearSearch();
            return;
        }
        
        // Сохраняем запрос
        localStorage.setItem('searchQuery', query);
        
        // Проверяем, на какой мы странице
        const isCatalogPage = window.location.pathname.includes('catalog.html');
        
        if (isCatalogPage && window.catalog) {
            // Если уже на странице каталога, фильтруем товары
            window.catalog.filterBySearch(query);
        } else {
            // Иначе переходим на страницу каталога с поиском
            window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
        }
    }

    // Метод для очистки поиска
    clearSearch() {
        localStorage.removeItem('searchQuery');
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        
        // Если мы на странице каталога, очищаем фильтрацию
        if (window.catalog && window.location.pathname.includes('catalog.html')) {
            window.catalog.clearSearch();
        }
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ПОИСКА ==========
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем поиск
    window.siteSearch = new SiteSearch();
    
    // Очистка поиска при загрузке страницы без параметров
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('search')) {
        localStorage.removeItem('searchQuery');
    }
});