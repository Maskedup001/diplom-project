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
      categories: [
        "smartphone",
        "laptop",
        "tv",
        "headphones",
        "console",
        "monitor",
        "smartwatch",
        "tablet",
      ],
      brands: [],
      availability: "all",
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

  // Загрузка товаров (в реальном проекте - с сервера)
  async loadProducts() {
    // Имитация загрузки
    this.products = [
      {
        id: 1,
        title: "iPhone 15 Pro",
        price: 99990,
        category: "smartphone",
        brand: "apple",
        image: "images/iphone.jpg",
        rating: 4.8,
        reviews: 128,
        availability: "in-stock",
        description: "Новый флагман Apple с процессором A17 Pro",
      },
      {
        id: 2,
        title: "Samsung Galaxy S23 Ultra",
        price: 89990,
        category: "smartphone",
        brand: "samsung",
        image: "images/samsung.jpg",
        rating: 4.7,
        reviews: 94,
        availability: "in-stock",
        description: "Смартфон с лучшей камерой на рынке",
      },
      {
        id: 3,
        title: "MacBook Air M2",
        price: 129990,
        category: "laptop",
        brand: "apple",
        image: "images/macbook.jpg",
        rating: 4.9,
        reviews: 76,
        availability: "in-stock",
        description: "Ультратонкий ноутбук с чипом Apple M2",
      },
      {
        id: 4,
        title: "Xiaomi Redmi Note 12",
        price: 24990,
        category: "smartphone",
        brand: "xiaomi",
        image: "images/xiaomi.jpg",
        rating: 4.3,
        reviews: 215,
        availability: "in-stock",
        description: "Бюджетный смартфон с AMOLED-экраном",
      },
      {
        id: 5,
        title: "Sony Bravia XR-55A80L",
        price: 159990,
        category: "tv",
        brand: "sony",
        image: "images/sony-tv.jpg",
        rating: 4.6,
        reviews: 42,
        availability: "in-stock",
        description: "OLED телевизор с процессором Cognitive Processor XR",
      },
      {
        id: 6,
        title: "Samsung Odyssey G7",
        price: 64990,
        category: "monitor",
        brand: "samsung",
        image: "images/monitor.jpg",
        rating: 4.5,
        reviews: 89,
        availability: "out-of-stock",
        description: 'Игровой монитор 27" 240Hz',
      },
      {
        id: 7,
        title: "AirPods Pro 2",
        price: 24990,
        category: "headphones",
        brand: "apple",
        image: "images/airpods.jpg",
        rating: 4.7,
        reviews: 312,
        availability: "in-stock",
        description: "Наушники с активным шумоподавлением",
      },
      {
        id: 8,
        title: "PlayStation 5",
        price: 59990,
        category: "console",
        brand: "sony",
        image: "images/ps5.jpg",
        rating: 4.9,
        reviews: 543,
        availability: "in-stock",
        description: "Игровая консоль нового поколения",
      },
      {
        id: 9,
        title: "LG UltraGear 27GP850",
        price: 45990,
        category: "monitor",
        brand: "lg",
        image: "images/monitor2.jpg",
        rating: 4.6,
        reviews: 67,
        availability: "in-stock",
        description: 'Игровой монитор 27" 165Hz Nano IPS',
      },
      {
        id: 10,
        title: "Dell UltraSharp U2720Q",
        price: 68990,
        category: "monitor",
        brand: "dell",
        image: "images/monitor3.jpg",
        rating: 4.8,
        reviews: 42,
        availability: "in-stock",
        description: 'Монитор 27" 4K для профессиональной работы',
      },
      {
        id: 11,
        title: "Samsung Galaxy Watch 6",
        price: 29990,
        category: "smartwatch",
        brand: "samsung",
        image: "images/watch.jpg",
        rating: 4.4,
        reviews: 89,
        availability: "in-stock",
        description: "Смарт-часы с функцией отслеживания здоровья"
      },
      {
        id: 12,
        title: "iPad Air 5",
        price: 59990,
        category: "tablet",
        brand: "apple",
        image: "images/ipad.jpg",
        rating: 4.7,
        reviews: 156,
        availability: "in-stock",
        description: "Планшет с чипом M1 и дисплеем Liquid Retina"
      },
      {
        id: 13,
        title: "Nintendo Switch OLED",
        price: 32990,
        category: "console",
        brand: "nintendo",
        image: "images/switch.jpg",
        rating: 4.8,
        reviews: 423,
        availability: "in-stock",
        description: "Гибридная игровая консоль"
      }
    ];

    // Сначала копируем все товары
    this.filteredProducts = [...this.products];
    
    // Если есть поисковый запрос, применяем его
    if (this.searchQuery) {
      this.filterBySearch(this.searchQuery);
    }
  }

  // Инициализация фильтров
  initFilters() {
    // Фильтр по цене
    const priceMinInput = document.getElementById("price-min");
    const priceMaxInput = document.getElementById("price-max");
    const priceSliderMin = document.getElementById("price-slider-min");
    const priceSliderMax = document.getElementById("price-slider-max");

    // Устанавливаем начальные значения цены
    priceMinInput.value = this.filters.minPrice;
    priceMaxInput.value = this.filters.maxPrice;
    priceSliderMin.value = this.filters.minPrice;
    priceSliderMax.value = this.filters.maxPrice;

    // Обновление ползунков при вводе в инпуты
    priceMinInput.addEventListener("input", (e) => {
      const value = Math.min(
        parseInt(e.target.value) || 0,
        this.filters.maxPrice - 1000
      );
      priceSliderMin.value = value;
      this.filters.minPrice = value;
      this.applyFilters();
    });

    priceMaxInput.addEventListener("input", (e) => {
      const value = Math.max(
        parseInt(e.target.value) || 500000,
        this.filters.minPrice + 1000
      );
      priceSliderMax.value = value;
      this.filters.maxPrice = value;
      this.applyFilters();
    });

    // Обновление инпутов при движении ползунков
    priceSliderMin.addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      priceMinInput.value = value;
      this.filters.minPrice = value;
      this.updatePriceRangeTrack();
      this.applyFilters();
    });

    priceSliderMax.addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      priceMaxInput.value = value;
      this.filters.maxPrice = value;
      this.updatePriceRangeTrack();
      this.applyFilters();
    });

    // КАТЕГОРИИ - СИНХРОНИЗИРУЕМ ЧЕКБОКСЫ ПРИ ЗАГРУЗКЕ
    document.querySelectorAll('input[name="category"]').forEach((checkbox) => {
      // Устанавливаем состояние чекбокса согласно начальным фильтрам
      checkbox.checked = this.filters.categories.includes(checkbox.value);
      
      checkbox.addEventListener("change", () => {
        const checkedCategories = Array.from(
          document.querySelectorAll('input[name="category"]:checked')
        ).map((cb) => cb.value);
        this.filters.categories = checkedCategories;
        this.applyFilters();
      });
    });

    // БРЕНДЫ - СИНХРОНИЗИРУЕМ ЧЕКБОКСЫ ПРИ ЗАГРУЗКЕ
    document.querySelectorAll('input[name="brand"]').forEach((checkbox) => {
      // Устанавливаем состояние чекбокса согласно начальным фильтрам
      checkbox.checked = this.filters.brands.includes(checkbox.value);
      
      checkbox.addEventListener("change", () => {
        const checkedBrands = Array.from(
          document.querySelectorAll('input[name="brand"]:checked')
        ).map((cb) => cb.value);
        this.filters.brands = checkedBrands;
        this.applyFilters();
      });
    });

    // Наличие - СИНХРОНИЗИРУЕМ РАДИО-КНОПКИ ПРИ ЗАГРУЗКЕ
    document.querySelectorAll('input[name="availability"]').forEach((radio) => {
      // Устанавливаем состояние радио-кнопки согласно начальным фильтрам
      if (radio.value === this.filters.availability) {
        radio.checked = true;
      }
      
      radio.addEventListener("change", (e) => {
        this.filters.availability = e.target.value;
        this.applyFilters();
      });
    });

    // Кнопка сброса
    document.getElementById("reset-filters").addEventListener("click", () => {
      this.resetFilters();
    });

    // Инициализируем трек
    this.updatePriceRangeTrack();
  }

  // Обновление трек
  updatePriceRangeTrack() {
    const min = this.filters.minPrice;
    const max = this.filters.maxPrice;
    const track = document.querySelector(".price-range__track");

    if (track) {
      const minPercent = (min / 500000) * 100;
      const maxPercent = (max / 500000) * 100;
      track.style.left = `${minPercent}%`;
      track.style.width = `${maxPercent - minPercent}%`;
    }
  }

  // Применение фильтров (обновленная версия с учетом поиска)
  applyFilters() {
    // Сначала фильтруем по поисковому запросу (если есть)
    let filtered = [...this.products];
    
    if (this.searchQuery) {
      filtered = filtered.filter(product => {
        return product.title.toLowerCase().includes(this.searchQuery) ||
               product.description.toLowerCase().includes(this.searchQuery) ||
               product.brand.toLowerCase().includes(this.searchQuery) ||
               this.getCategoryName(product.category).toLowerCase().includes(this.searchQuery);
      });
    }
    
    // Затем применяем остальные фильтры
    this.filteredProducts = filtered.filter((product) => {
      // Фильтр по цене
      if (
        product.price < this.filters.minPrice ||
        product.price > this.filters.maxPrice
      ) {
        return false;
      }

      // Фильтр по категориям
      if (
        this.filters.categories.length > 0 &&
        !this.filters.categories.includes(product.category)
      ) {
        return false;
      }

      // Фильтр по брендам
      if (
        this.filters.brands.length > 0 &&
        !this.filters.brands.includes(product.brand)
      ) {
        return false;
      }

      // Фильтр по наличию
      if (
        this.filters.availability === "in-stock" &&
        product.availability !== "in-stock"
      ) {
        return false;
      }

      return true;
    });

    // Сбрасываем на первую страницу при фильтрации
    this.currentPage = 1;

    // Применяем сортировку
    this.applySorting();

    // Обновляем отображение
    this.updateProductsCount();
    this.renderProducts();
    this.updatePagination();
  }

  // Сброс фильтров
  resetFilters() {
    // Сбрасываем значения на ПУСТЫЕ массивы
    this.filters = {
      minPrice: 0,
      maxPrice: 500000,
      categories: [], // ← ВАЖНО: пустой массив!
      brands: [],
      availability: "all",
    };

    // Сбрасываем UI
    document.getElementById("price-min").value = 0;
    document.getElementById("price-max").value = 500000;
    document.getElementById("price-slider-min").value = 0;
    document.getElementById("price-slider-max").value = 500000;

    // ВСЕ чекбоксы категорий отключаем
    document.querySelectorAll('input[name="category"]').forEach((cb) => {
      cb.checked = false; // ← ВСЕ false!
    });

    document.querySelectorAll('input[name="brand"]').forEach((cb) => {
      cb.checked = false;
    });

    // Устанавливаем радио-кнопку "Все товары"
    const allRadio = document.querySelector('input[name="availability"][value="all"]');
    if (allRadio) {
      allRadio.checked = true;
    }

    // Сбрасываем сортировку
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.value = "default";
      this.sortBy = "default";
    }

    // Обновляем трек
    this.updatePriceRangeTrack();

    // Применяем сброшенные фильтры
    this.applyFilters();
  }

  // Инициализация сортировки
  initSorting() {
    const sortSelect = document.getElementById("sort-select");
    
    // Устанавливаем начальное значение
    if (sortSelect) {
      sortSelect.value = this.sortBy;
    }

    sortSelect.addEventListener("change", (e) => {
      this.sortBy = e.target.value;
      this.applySorting();
      this.renderProducts();
    });
  }

  // Применение сортировки
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
        // По умолчанию - как загрузили
        break;
    }
  }

  // Обновление счетчика товаров
  updateProductsCount() {
    const countElement = document.getElementById("products-count");
    if (countElement) {
      countElement.textContent = this.filteredProducts.length;
    }
  }

  // Рендеринг товаров
  renderProducts() {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    grid.innerHTML = "";

    // Вычисляем какие товары показывать на текущей странице
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

  // Создание карточки товара
  createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";
    
    // ВСЕ НЕОБХОДИМЫЕ DATA-АТРИБУТЫ ДЛЯ КОРЗИНЫ:
    card.dataset.id = product.id;
    card.dataset.title = product.title;
    card.dataset.price = product.price;
    card.dataset.image = product.image;
    card.dataset.category = product.category;

    // Форматирование цены
    const formattedPrice = product.price.toLocaleString("ru-RU");

    // Звезды рейтинга
    const fullStars = Math.floor(product.rating);
    const emptyStars = 5 - fullStars;
    const stars = "★".repeat(fullStars) + "☆".repeat(emptyStars);

    card.innerHTML = `
            ${
              product.availability === "out-of-stock"
                ? '<div class="product-card__badge">Нет в наличии</div>'
                : ""
            }
            <img src="${product.image}" alt="${
      product.title
    }" class="product-card__image">
            <div class="product-card__content">
                <div class="product-card__category">${this.getCategoryName(
                  product.category
                )}</div>
                <h3 class="product-card__title">${product.title}</h3>
                <p class="product-card__description">${product.description}</p>
                <div class="product-card__rating">
                    <span class="product-card__stars">${stars}</span>
                    <span class="product-card__reviews">(${
                      product.reviews
                    })</span>
                </div>
                <div class="product-card__availability product-card__availability--${
                  product.availability
                }">
                    ${
                      product.availability === "in-stock"
                        ? "✓ В наличии"
                        : "✗ Нет в наличии"
                    }
                </div>
                <div class="product-card__footer">
                    <div>
                        <span class="product-card__price">${formattedPrice} ₽</span>
                    </div>
                    <button class="button product-card__button add-to-cart" ${
                      product.availability === "out-of-stock" ? "disabled" : ""
                    }>
                        ${
                          product.availability === "out-of-stock"
                            ? "Нет в наличии"
                            : "В корзину"
                        }
                    </button>
                </div>
            </div>
        `;

    return card;
  }

  // Получение названия категории
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

  // Инициализация пагинации
  initPagination() {
    const prevBtn = document.querySelector(".pagination__button--prev");
    const nextBtn = document.querySelector(".pagination__button--next");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderProducts();
          this.updatePaginationButtons();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(
          this.filteredProducts.length / this.productsPerPage
        );
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderProducts();
          this.updatePaginationButtons();
        }
      });
    }

    // Обновляем кнопки пагинации
    this.updatePagination();
  }

  // Обновление пагинации
  updatePagination() {
    const totalPages = Math.ceil(
      this.filteredProducts.length / this.productsPerPage
    );
    const pagesContainer = document.querySelector(".pagination__pages");

    if (!pagesContainer) return;

    pagesContainer.innerHTML = "";

    // Показываем максимум 5 страниц
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.type = "button";
      pageBtn.className = `pagination__page ${
        i === this.currentPage ? "pagination__page--active" : ""
      }`;
      pageBtn.textContent = i;

      pageBtn.addEventListener("click", () => {
        this.currentPage = i;
        this.renderProducts();
        this.updatePaginationButtons();
      });

      pagesContainer.appendChild(pageBtn);
    }

    this.updatePaginationButtons();
  }

  // Обновление состояния кнопок пагинации
  updatePaginationButtons() {
    const prevBtn = document.querySelector(".pagination__button--prev");
    const nextBtn = document.querySelector(".pagination__button--next");
    const totalPages = Math.ceil(
      this.filteredProducts.length / this.productsPerPage
    );

    if (prevBtn) {
      prevBtn.disabled = this.currentPage === 1;
    }

    if (nextBtn) {
      nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
    }
  }
}

// Инициализация каталога при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  window.catalog = new Catalog();
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