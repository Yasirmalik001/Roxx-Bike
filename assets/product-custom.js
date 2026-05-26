class CustomProductInfo extends HTMLElement {
  constructor() {
    super();
    this.thumbnails = this.querySelectorAll('.product-custom__thumbnail-item');
    this.mainImageContainer = this.querySelector('.product-custom__main-image');
    this.accessories = this.querySelectorAll('.product-custom__accessory-checkbox');
    this.priceFinal = this.querySelector('.product-custom__price-final');
    this.basePriceStr = this.priceFinal ? this.priceFinal.innerText : '€0.00';
    
    // Parse base price
    this.basePrice = this.parsePrice(this.basePriceStr);

    this.bindEvents();
  }

  bindEvents() {
    // Thumbnail clicks
    this.thumbnails.forEach(thumb => {
      thumb.addEventListener('click', (e) => this.handleThumbnailClick(e.currentTarget));
    });

    // Accessory checks
    this.accessories.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => this.handleAccessoryChange(e.currentTarget));
    });
  }

  handleThumbnailClick(thumb) {
    // Remove active class
    this.thumbnails.forEach(t => t.classList.remove('is-active'));
    thumb.classList.add('is-active');

    // Swap main image
    const img = thumb.querySelector('img');
    if (img && this.mainImageContainer) {
      const mainImg = this.mainImageContainer.querySelector('img');
      if (mainImg) {
        // Just swap src for simple demo, ideally use srcset/sizes or high-res
        const src = img.getAttribute('src').replace('width=100', 'width=1200');
        mainImg.setAttribute('src', src);
        mainImg.setAttribute('srcset', src);
      }
    }
  }

  handleAccessoryChange(checkbox) {
    const card = checkbox.closest('.product-custom__accessory-card');
    if (checkbox.checked) {
      card.classList.add('is-selected');
    } else {
      card.classList.remove('is-selected');
    }
    this.updateTotalPrice();
  }

  updateTotalPrice() {
    let total = this.basePrice;
    this.accessories.forEach(checkbox => {
      if (checkbox.checked) {
        total += parseFloat(checkbox.dataset.price) / 100;
      }
    });
    
    if (this.priceFinal) {
      this.priceFinal.innerText = this.formatPrice(total);
    }
  }

  parsePrice(priceStr) {
    return parseFloat(priceStr.replace(/[^0-9,-]+/g, '').replace(',', '.'));
  }

  formatPrice(priceNum) {
    // Basic EUR formatter matching standard Shopify output for demo
    return '€' + priceNum.toFixed(2).replace('.', ',');
  }
}

customElements.define('custom-product-info', CustomProductInfo);

// Initialize script logic
document.addEventListener('DOMContentLoaded', () => {
  // Wrap section in custom element if needed, or instantiate manually
  const sections = document.querySelectorAll('.product-custom');
  sections.forEach(section => {
    if (!section.closest('custom-product-info')) {
      // Just adding basic logic here if not using custom element structure
      const thumbnails = section.querySelectorAll('.product-custom__thumbnail-item');
      const mainImageContainer = section.querySelector('.product-custom__main-image');
      const accessories = section.querySelectorAll('.product-custom__accessory-checkbox');
      const cards = section.querySelectorAll('.product-custom__accessory-card');
      
      thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
          thumbnails.forEach(t => t.classList.remove('is-active'));
          this.classList.add('is-active');
          const img = this.querySelector('img');
          if (img && mainImageContainer) {
            const mainImg = mainImageContainer.querySelector('img');
            if (mainImg) {
              const src = img.getAttribute('src').replace('width=100', 'width=1200');
              mainImg.setAttribute('src', src);
              mainImg.setAttribute('srcset', src);
            }
          }
        });
      });

      accessories.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
          const card = this.closest('.product-custom__accessory-card');
          if (this.checked) {
            card.classList.add('is-selected');
          } else {
            card.classList.remove('is-selected');
          }
        });
      });
    }
  });
});
