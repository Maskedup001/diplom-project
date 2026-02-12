// ========== ГЛАВНАЯ СТРАНИЦА ==========
class HomePage {
  constructor() {
    this.products = [];
    this.hitsProducts = [];
    this.newProducts = [];
    
    this.init();
  }

  async init() {
    console.log('🏠 Загружаю товары для главной страницы...');
    
    try {
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error(`Ошибка API: ${response.status}`);
      }
      
      this.products = await response.json();
      console.log(`✅ Загружено ${this.products.length} товаров из базы данных`);
      
      // Хиты продаж - первые 6 товаров
      this.hitsProducts = this.products.slice(0, 6);
      
      // Новинки - последние 3 товара
      this.newProducts = [...this.products].reverse().slice(0, 3);
      
      // Рендерим товары
      this.renderHits();
      this.renderNew();
      
    } catch (error) {
      console.error('❌ Ошибка загрузки товаров:', error);
      this.showError();
    }
  }

  renderHits() {
    const hitsGrid = document.querySelector('.products__grid');
    if (!hitsGrid) return;
    
    if (this.hitsProducts.length === 0) {
      hitsGrid.innerHTML = '<div class="no-products">Товары временно отсутствуют</div>';
      return;
    }
    
    hitsGrid.innerHTML = this.hitsProducts.map(product => 
      this.createProductCard(product)
    ).join('');
    
    console.log(`✅ Отображено ${this.hitsProducts.length} хитов продаж`);
  }

  renderNew() {
    const grids = document.querySelectorAll('.products__grid');
    if (grids.length < 2) return;
    
    const newGrid = grids[1];
    
    if (this.newProducts.length === 0) {
      newGrid.innerHTML = '<div class="no-products">Новинки скоро появятся</div>';
      return;
    }
    
    newGrid.innerHTML = this.newProducts.map(product => 
      this.createProductCard(product)
    ).join('');
    
    console.log(`✅ Отображено ${this.newProducts.length} новинок`);
  }

  createProductCard(product) {
    const formattedPrice = product.price.toLocaleString("ru-RU");
    const fullStars = Math.floor(product.rating || 4.0);
    const emptyStars = 5 - fullStars;
    const stars = "★".repeat(fullStars) + "☆".repeat(emptyStars);
    const stock = product.stock || 0;
    const isInStock = stock > 0;
    
    // ✅ ИСПРАВЛЕНО: data:image заглушка с названием товара (без onerror, без loading="lazy")
    const imageSrc = product.image && product.image !== 'images/default.jpg' 
      ? product.image 
      : `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='55' font-size='14' text-anchor='middle' fill='%23999' font-family='Arial'%3E${encodeURIComponent(product.title)}%3C/text%3E%3C/svg%3E`;

    return `
      <div class="product-card" 
           data-id="${product.id}" 
           data-title="${product.title}" 
           data-price="${product.price}" 
           data-image="${product.image || 'images/default.jpg'}"
           data-category="${product.category}">
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
          <div class="product-card__availability product-card__availability--${isInStock ? 'in-stock' : 'out-of-stock'}">
            ${isInStock ? `✓ В наличии (${stock} шт.)` : '✗ Нет в наличии'}
          </div>
          <div class="product-card__footer">
            <span class="product-card__price">${formattedPrice} ₽</span>
            <button class="button add-to-cart" ${!isInStock ? 'disabled' : ''}>
              ${isInStock ? 'В корзину' : 'Нет в наличии'}
            </button>
          </div>
        </div>
      </div>
    `;
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
      appliances: "Бытовая техника"
    };
    return categories[category] || category || 'Другое';
  }

  showError() {
    const grids = document.querySelectorAll('.products__grid');
    grids.forEach(grid => {
      grid.innerHTML = `
        <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
          <h3>❌ Не удалось загрузить товары</h3>
          <p>Проверьте подключение к серверу</p>
          <button onclick="location.reload()" class="button">Повторить</button>
        </div>
      `;
    });
  }
}

// ========== Инициализация ТОЛЬКО на главной странице ==========
document.addEventListener("DOMContentLoaded", () => {
  // Проверяем что мы на главной странице
  const isHomePage = 
    window.location.pathname === '/' || 
    window.location.pathname.includes('index.html') ||
    window.location.pathname.endsWith('/');
  
  if (isHomePage) {
    // Даем небольшую задержку для полной загрузки DOM
    setTimeout(() => {
      window.homePage = new HomePage();
      console.log('🏠 Главная страница инициализирована');
    }, 50);
  } else {
    console.log('🏠 Не главная страница, пропускаем инициализацию');
  }
});