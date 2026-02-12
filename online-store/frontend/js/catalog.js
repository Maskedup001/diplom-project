// ========== КАТАЛОГ ТОВАРОВ ==========
class Catalog {
  constructor() {
    this.products = [];
    this.filteredProducts = [];
    this.currentPage = 1;
    this.productsPerPage = 12;
    this.filters = {
      minPrice: 0,
      maxPrice: 500000,
      categories: [],
      brands: [],
    };
    this.sortBy = "default";
    
    // Добавляем свойство для поиска
    this.searchQuery = "";

    this.init();
  }

  async init() {
    // Загружаем товары
    await this.loadProducts();

    // Проверяем поисковый запрос
    this.checkSearchQuery();
    
    // Инициализируем фильтры
    this.initFilters();

    // Инициализируем сортировку
    this.initSorting();

    // Рендерим товары
    this.renderProducts();

    // Инициализируем пагинацию
    this.initPagination();
    
    // Обновляем счетчик товаров
    this.updateProductsCount();
  }

  // Проверяем поисковый запрос
  checkSearchQuery() {
    // Проверяем параметр в URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    
    // Проверяем localStorage
    const savedQuery = localStorage.getItem('searchQuery');
    
    if (searchParam || savedQuery) {
      this.searchQuery = searchParam || savedQuery;
      this.filterBySearch(this.searchQuery);
      
      // Устанавливаем значение в поле поиска в хедере
      const searchInput = document.querySelector('.search__input');
      if (searchInput) {
        searchInput.value = this.searchQuery;
      }
    }
  }

  // Фильтрация по поиску
  filterBySearch(query) {
    if (!query || query.trim() === '') {
      // Если запрос пустой, сбрасываем поиск
      this.clearSearch();
      return;
    }
    
    this.searchQuery = query.toLowerCase().trim();
    
    // Фильтруем товары по поисковому запросу
    this.filteredProducts = this.products.filter(product => {
      return product.title.toLowerCase().includes(this.searchQuery) ||
             product.description.toLowerCase().includes(this.searchQuery) ||
             product.brand.toLowerCase().includes(this.searchQuery) ||
             this.getCategoryName(product.category).toLowerCase().includes(this.searchQuery);
    });
    
    // Обновляем интерфейс
    this.currentPage = 1;
    this.updateProductsCount();
    this.renderProducts();
    this.updatePagination();
    
    // Показываем сообщение о поиске
    this.showSearchMessage(query);
  }

  // Показать сообщение о поиске
  showSearchMessage(query) {
    const grid = document.getElementById("products-grid");
    if (!grid) return;
    
    // Удаляем предыдущее сообщение если есть
    const existingMessage = document.querySelector('.search-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    const resultsCount = this.filteredProducts.length;
    
    // Добавляем сообщение о поиске
    const searchMessage = document.createElement('div');
    searchMessage.className = 'search-message';
    searchMessage.innerHTML = `
      <h3>Результаты поиска: "${query}"</h3>
      <p>Найдено товаров: ${resultsCount}</p>
      <button class="button button--outline" id="clear-search">Очистить поиск</button>
    `;
    
    // Вставляем перед списком товаров
    grid.parentNode.insertBefore(searchMessage, grid);
    
    // Обработчик кнопки очистки
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearSearch();
      });
    }
  }

  // Очистка поиска
  clearSearch() {
    this.searchQuery = '';
    localStorage.removeItem('searchQuery');
    
    // Очищаем URL без перезагрузки
    const url = new URL(window.location);
    url.searchParams.delete('search');
    window.history.replaceState({}, '', url);
    
    // Очищаем поле ввода в хедере
    const searchInput = document.querySelector('.search__input');
    if (searchInput) {
      searchInput.value = '';
    }
    
    // Удаляем сообщение о поиске
    const searchMessage = document.querySelector('.search-message');
    if (searchMessage) {
      searchMessage.remove();
    }
    
    // Сбрасываем фильтры
    this.resetFilters();
  }

  // Загрузка товаров
  async loadProducts() {
    console.log('🔄 Загружаю товары из API...');
    
    try {
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error(`Ошибка API: ${response.status}`);
      }
      
      this.products = await response.json();
      
      console.log(`✅ Загружено ${this.products.length} товаров из базы данных`);
      
      this.filteredProducts = [...this.products];
      
      if (this.searchQuery) {
        this.filterBySearch(this.searchQuery);
      }
      
    } catch (error) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Не удалось загрузить товары:', error.message);
      
      this.products = [];
      this.filteredProducts = [];
      
      const grid = document.getElementById("products-grid");
      if (grid) {
        grid.innerHTML = `
          <div class="no-products" style="text-align: center; padding: 50px; color: #d32f2f;">
            <h3>❌ База данных недоступна</h3>
            <p>Не удалось загрузить товары. Пожалуйста, проверьте:</p>
            <ol style="text-align: left; display: inline-block;">
              <li>Запущен ли SQL Server</li>
              <li>Запущен ли Node.js сервер (порт 3000)</li>
              <li>Существует ли база данных OnlineShopDB</li>
            </ol>
            <p style="margin-top: 20px;">
              <button onclick="location.reload()" class="button">Повторить попытку</button>
            </p>
          </div>
        `;
      }
    }
  }

  // Инициализация фильтров
  initFilters() {
    const priceMinInput = document.getElementById("price-min");
    const priceMaxInput = document.getElementById("price-max");
    const priceSliderMin = document.getElementById("price-slider-min");
    const priceSliderMax = document.getElementById("price-slider-max");

    if (priceMinInput && priceMaxInput && priceSliderMin && priceSliderMax) {
      priceMinInput.value = this.filters.minPrice;
      priceMaxInput.value = this.filters.maxPrice;
      priceSliderMin.value = this.filters.minPrice;
      priceSliderMax.value = this.filters.maxPrice;

      priceMinInput.addEventListener("input", (e) => {
        let value = parseInt(e.target.value) || 0;
        value = Math.max(value, 0);
        
        const maxValue = parseInt(priceMaxInput.value);
        if (value >= maxValue) {
          value = maxValue - 1000;
          e.target.value = value;
        }
        
        priceSliderMin.value = value;
        this.filters.minPrice = value;
        this.updatePriceRangeTrack();
        this.applyFilters();
      });

      priceMaxInput.addEventListener("input", (e) => {
        let value = parseInt(e.target.value) || 500000;
        value = Math.min(value, 500000);
        
        const minValue = parseInt(priceMinInput.value);
        if (value <= minValue) {
          value = minValue + 1000;
          e.target.value = value;
        }
        
        priceSliderMax.value = value;
        this.filters.maxPrice = value;
        this.updatePriceRangeTrack();
        this.applyFilters();
      });

      priceSliderMin.addEventListener("input", (e) => {
        let value = parseInt(e.target.value);
        const maxValue = parseInt(priceSliderMax.value);
        
        if (value >= maxValue) {
          value = maxValue - 1;
          priceSliderMin.value = value;
        }
        
        priceMinInput.value = value;
        this.filters.minPrice = value;
        this.updatePriceRangeTrack();
        this.applyFilters();
      });

      priceSliderMax.addEventListener("input", (e) => {
        let value = parseInt(e.target.value);
        const minValue = parseInt(priceSliderMin.value);
        
        if (value <= minValue) {
          value = minValue + 1;
          priceSliderMax.value = value;
        }
        
        priceMaxInput.value = value;
        this.filters.maxPrice = value;
        this.updatePriceRangeTrack();
        this.applyFilters();
      });

      this.updatePriceRangeTrack();
    }

    document.querySelectorAll('input[name="category"]').forEach((checkbox) => {
      checkbox.checked = false;
      
      checkbox.addEventListener("change", () => {
        const checkedCategories = Array.from(
          document.querySelectorAll('input[name="category"]:checked')
        ).map((cb) => cb.value);
        this.filters.categories = checkedCategories;
        this.applyFilters();
      });
    });

    document.querySelectorAll('input[name="brand"]').forEach((checkbox) => {
      checkbox.checked = false;
      
      checkbox.addEventListener("change", () => {
        const checkedBrands = Array.from(
          document.querySelectorAll('input[name="brand"]:checked')
        ).map((cb) => cb.value);
        this.filters.brands = checkedBrands;
        this.applyFilters();
      });
    });

    const resetBtn = document.getElementById("reset-filters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetFilters();
      });
    }
  }

  updatePriceRangeTrack() {
    const min = this.filters.minPrice;
    const max = this.filters.maxPrice;
    const track = document.querySelector(".price-range__track");
    const maxPrice = 500000;

    if (track) {
      const minPercent = (min / maxPrice) * 100;
      const maxPercent = (max / maxPrice) * 100;
      track.style.left = `${minPercent}%`;
      track.style.right = `${100 - maxPercent}%`;
    }
  }

  applyFilters() {
    let filtered = [...this.products];
    
    if (this.searchQuery) {
      filtered = filtered.filter(product => {
        return product.title.toLowerCase().includes(this.searchQuery) ||
               product.description.toLowerCase().includes(this.searchQuery) ||
               product.brand.toLowerCase().includes(this.searchQuery) ||
               this.getCategoryName(product.category).toLowerCase().includes(this.searchQuery);
      });
    }
    
    this.filteredProducts = filtered.filter((product) => {
      if (
        product.price < this.filters.minPrice ||
        product.price > this.filters.maxPrice
      ) {
        return false;
      }

      if (
        this.filters.categories.length > 0 &&
        !this.filters.categories.includes(product.category)
      ) {
        return false;
      }

      if (
        this.filters.brands.length > 0 &&
        !this.filters.brands.includes(product.brand)
      ) {
        return false;
      }

      return true;
    });

    this.currentPage = 1;
    this.applySorting();
    this.updateProductsCount();
    this.renderProducts();
    this.updatePagination();
    this.scrollToCatalogTitle();
  }

  scrollToCatalogTitle() {
    if (window.innerWidth <= 768) return;
    const catalogTitle = document.querySelector('.catalog__title');
    if (catalogTitle) {
      const headerHeight = 80;
      const titlePosition = catalogTitle.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      
      window.scrollTo({
        top: titlePosition,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 100,
        behavior: 'smooth'
      });
    }
  }

  resetFilters() {
    this.filters = {
      minPrice: 0,
      maxPrice: 500000,
      categories: [],
      brands: [],
    };

    const priceMinInput = document.getElementById("price-min");
    const priceMaxInput = document.getElementById("price-max");
    const priceSliderMin = document.getElementById("price-slider-min");
    const priceSliderMax = document.getElementById("price-slider-max");

    if (priceMinInput && priceMaxInput && priceSliderMin && priceSliderMax) {
      priceMinInput.value = 0;
      priceMaxInput.value = 500000;
      priceSliderMin.value = 0;
      priceSliderMax.value = 500000;
    }

    document.querySelectorAll('input[name="category"]').forEach((cb) => {
      cb.checked = false;
    });

    document.querySelectorAll('input[name="brand"]').forEach((cb) => {
      cb.checked = false;
    });

    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.value = "default";
      this.sortBy = "default";
    }

    this.updatePriceRangeTrack();
    this.applyFilters();
  }

  initSorting() {
    const sortSelect = document.getElementById("sort-select");
    
    if (sortSelect) {
      sortSelect.value = this.sortBy;

      sortSelect.addEventListener("change", (e) => {
        this.sortBy = e.target.value;
        this.applySorting();
        this.renderProducts();
        this.updatePagination();
        this.scrollToCatalogTitle();
      });
    }
  }

  applySorting() {
    switch (this.sortBy) {
      case "price-asc":
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        this.filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        this.filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
  }

  updateProductsCount() {
    const countElement = document.getElementById("products-count");
    if (countElement) {
      countElement.textContent = this.filteredProducts.length;
    }
  }

  renderProducts() {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    grid.innerHTML = "";

    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

    if (productsToShow.length === 0) {
      grid.innerHTML = `
        <div class="no-products">
          <h3>${
            this.searchQuery
              ? "По вашему запросу ничего не найдено"
              : this.filters.categories.length === 0
              ? "Выберите категории"
              : "Товары не найдены"
          }</h3>
          <p>${
            this.searchQuery
              ? "Попробуйте изменить поисковый запрос или параметры фильтрации"
              : this.filters.categories.length === 0
              ? "Выберите категории товаров для отображения"
              : "Попробуйте изменить параметры фильтрации"
          }</p>
        </div>
      `;
      return;
    }

    productsToShow.forEach((product) => {
      const productElement = this.createProductCard(product);
      grid.appendChild(productElement);
    });
  }

  createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  
  card.dataset.id = product.id;
  card.dataset.title = product.title;
  card.dataset.price = product.price;
  card.dataset.image = product.image;
  card.dataset.category = product.category;

  const formattedPrice = product.price.toLocaleString("ru-RU");
  const fullStars = Math.floor(product.rating || 4.0);
  const emptyStars = 5 - fullStars;
  const stars = "★".repeat(fullStars) + "☆".repeat(emptyStars);
  const stock = product.stock || 0;
  const availability = product.availability || (stock > 0 ? 'in-stock' : 'out-of-stock');
  const isInStock = availability === 'in-stock';
  
  // ✅ ИСПРАВЛЕНО: data:image заглушка с названием товара (без onerror, без loading="lazy")
  const imageSrc = product.image && product.image !== 'images/default.jpg' 
    ? product.image 
    : `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='55' font-size='14' text-anchor='middle' fill='%23999' font-family='Arial'%3E${encodeURIComponent(product.title)}%3C/text%3E%3C/svg%3E`;

  card.innerHTML = `
    ${!isInStock ? '<div class="product-card__badge">Нет в наличии</div>' : ''}
    <img src="${imageSrc}" 
         alt="${product.title}" 
         class="product-card__image">
    <div class="product-card__content">
      <div class="product-card__category">${this.getCategoryName(product.category)}</div>
      <h3 class="product-card__title">${product.title}</h3>
      <p class="product-card__description">${product.description || 'Описание товара'}</p>
      <div class="product-card__rating">
        <span class="product-card__stars">${stars}</span>
        <span class="product-card__reviews">(${product.reviews || 0})</span>
      </div>
      <div class="product-card__availability product-card__availability--${availability}">
        ${isInStock ? `✓ В наличии (${stock} шт.)` : '✗ Нет в наличии'}
      </div>
      <div class="product-card__footer">
        <div>
          <span class="product-card__price">${formattedPrice} ₽</span>
        </div>
        <button class="button product-card__button add-to-cart" ${!isInStock ? "disabled" : ""}>
          ${isInStock ? "В корзину" : "Нет в наличии"}
        </button>
      </div>
    </div>
  `;

  return card;
}

  getCategoryName(category) {
    const categories = {
      smartphone: "Смартфоны",
      laptop: "Ноутбуки",
      tv: "Телевизоры",
      headphones: "Наушники",
      console: "Игровые консоли",
      monitor: "Мониторы",
      smartwatch: "Смарт-часы",
      tablet: "Планшеты",
    };
    return categories[category] || category;
  }

  initPagination() {
    const prevBtn = document.querySelector(".pagination__button--prev");
    const nextBtn = document.querySelector(".pagination__button--next");

    if (prevBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderProducts();
          this.updatePagination();
          this.updatePaginationButtons();
          this.scrollToCatalogTitle();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const totalPages = Math.ceil(
          this.filteredProducts.length / this.productsPerPage
        );
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderProducts();
          this.updatePagination();
          this.updatePaginationButtons();
          this.scrollToCatalogTitle();
        }
      });
    }

    this.updatePagination();
  }

  updatePagination() {
    const totalPages = Math.ceil(
      this.filteredProducts.length / this.productsPerPage
    );
    const pagesContainer = document.querySelector(".pagination__pages");

    if (!pagesContainer) return;

    pagesContainer.innerHTML = "";

    if (totalPages <= 1) {
      pagesContainer.style.display = "none";
      return;
    } else {
      pagesContainer.style.display = "flex";
    }

    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.type = "button";
      pageBtn.className = `pagination__page`;
      
      if (i === this.currentPage) {
        pageBtn.classList.add("pagination__page--active");
      }
      
      pageBtn.textContent = i;
      pageBtn.dataset.page = i;

      pageBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page);
        
        if (page && page !== this.currentPage) {
          this.currentPage = page;
          this.renderProducts();
          this.updatePagination();
          this.updatePaginationButtons();
          this.scrollToCatalogTitle();
        }
      });

      pagesContainer.appendChild(pageBtn);
    }

    this.updatePaginationButtons();
  }

  updatePaginationButtons() {
    const prevBtn = document.querySelector(".pagination__button--prev");
    const nextBtn = document.querySelector(".pagination__button--next");
    const totalPages = Math.ceil(
      this.filteredProducts.length / this.productsPerPage
    );

    if (prevBtn) {
      prevBtn.disabled = this.currentPage === 1;
      prevBtn.classList.toggle("pagination__button--disabled", this.currentPage === 1);
    }

    if (nextBtn) {
      nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
      nextBtn.classList.toggle("pagination__button--disabled", this.currentPage === totalPages || totalPages === 0);
    }
  }
}

// ========== ✅ ИСПРАВЛЕНО: Инициализация ТОЛЬКО на странице каталога ==========
document.addEventListener("DOMContentLoaded", () => {
  // Проверяем что мы на странице каталога
  const isCatalogPage = 
    window.location.pathname.includes('catalog.html') || 
    document.querySelector('.catalog__title') ||
    document.getElementById('products-grid');
  
  if (isCatalogPage) {
    window.catalog = new Catalog();
    console.log('📦 Каталог инициализирован');
  } else {
    console.log('📦 Не страница каталога, пропускаем инициализацию');
  }
});

// Вспомогательная функция для задержки
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}