/**
 * Currency Update Handler
 * Updates prices across the site when currency changes
 * Works with existing localization form system
 */

class CurrencyUpdateHandler {
  constructor() {
    this.init();
  }

  init() {
    // Check if we need to update prices on page load
    this.checkForCurrencyChange();
  }

  checkForCurrencyChange() {
    // Check if this is a page load after currency change
    const urlParams = new URLSearchParams(window.location.search);
    const hasCurrencyChange =
      urlParams.has('country') || urlParams.has('currency') || sessionStorage.getItem('currencyChanged');

    if (hasCurrencyChange) {
      // Clear the flag
      sessionStorage.removeItem('currencyChanged');

      // Update all prices after a short delay to ensure page is fully loaded
      setTimeout(() => {
        this.updateAllPrices();
      }, 500);
    }
  }

  async updateAllPrices() {
    try {
      // Fetch current cart data with new currency
      const response = await fetch('/cart.js');
      const cartData = await response.json();

      // Update cart prices
      this.updateCartPrices(cartData);

      // Update product grid prices
      this.updateProductGridPrices();

      // Update cart drawer if open
      this.updateCartDrawerPrices(cartData);
    } catch (error) {
      console.error('Error updating prices after currency change:', error);
    }
  }

  updateCartPrices(cartData) {
    // Update cart page total
    const cartTotal = document.querySelector('.total-amount');
    if (cartTotal) {
      cartTotal.textContent = this.formatMoney(cartData.total_price);
    }

    // Update cart page item prices
    cartData.items.forEach((item) => {
      const itemElement = document.querySelector(`[data-item-key="${item.key}"]`);
      if (itemElement) {
        const priceElement = itemElement.closest('.cart-item')?.querySelector('.item-price');
        if (priceElement) {
          priceElement.textContent = this.formatMoney(item.final_price);
        }
      }
    });
  }

  updateProductGridPrices() {
    // Update all product prices in grids
    const productPrices = document.querySelectorAll('.price, .product-price, .card__price');
    productPrices.forEach((priceElement) => {
      // Get the product handle or variant ID from the element
      const productHandle = priceElement.closest('[data-product-handle]')?.dataset.productHandle;
      const variantId = priceElement.closest('[data-variant-id]')?.dataset.variantId;

      if (productHandle || variantId) {
        this.updateProductPrice(priceElement, productHandle, variantId);
      }
    });
  }

  async updateProductPrice(priceElement, productHandle, variantId) {
    try {
      // Fetch product data to get updated price
      const productUrl = productHandle ? `/products/${productHandle}.js` : null;
      if (productUrl) {
        const response = await fetch(productUrl);
        const productData = await response.json();

        // Find the variant and update price
        const variant = variantId
          ? productData.variants.find((v) => v.id.toString() === variantId)
          : productData.variants[0];

        if (variant) {
          priceElement.textContent = this.formatMoney(variant.price);
        }
      }
    } catch (error) {
      console.error('Error updating product price:', error);
    }
  }

  updateCartDrawerPrices(cartData) {
    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer) {
      // Update cart drawer total
      const drawerTotal = cartDrawer.querySelector('.totals span');
      if (drawerTotal) {
        drawerTotal.textContent = this.formatMoney(cartData.total_price);
      }

      // Update cart drawer item prices
      cartData.items.forEach((item, index) => {
        const itemElement = cartDrawer.querySelector(`#CartDrawer-Item-${index + 1}`);
        if (itemElement) {
          const priceElement = itemElement.querySelector('.item-price');
          if (priceElement) {
            priceElement.textContent = this.formatMoney(item.final_price);
          }
        }
      });
    }
  }

  formatMoney(cents) {
    // Use Shopify's money formatting if available
    if (window.Shopify && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(cents);
    }

    // Fallback to basic formatting
    const amount = (cents / 100).toFixed(2);
    return `$${amount}`;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CurrencyUpdateHandler();
});

// Also set up listener for localization form submissions
document.addEventListener('DOMContentLoaded', () => {
  const localizationForms = document.querySelectorAll('localization-form');
  localizationForms.forEach((form) => {
    const formElement = form.querySelector('form');
    if (formElement) {
      formElement.addEventListener('submit', () => {
        // Set flag that currency is changing
        sessionStorage.setItem('currencyChanged', 'true');
      });
    }
  });
});
