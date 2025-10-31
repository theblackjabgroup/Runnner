/**
 * Sticky Add-to-Cart Bar
 * Shows ATC bar when main button scrolls out of view
 */

class StickyATCBar {
  constructor() {
    this.bar = document.querySelector('.sticky-atc-bar');
    if (!this.bar) return;

    // Try multiple selectors to find the main form (desktop and mobile)
    this.mainForm =
      document.querySelector('#add-to-cart-form') ||
      document.querySelector('.mobile-add-to-cart-form') ||
      document.querySelector('form[id^="product-form"]');

    // Find all potential ATC buttons
    const allButtons = [
      ...document.querySelectorAll('.product-form__submit'),
      ...document.querySelectorAll('.add-to-cart-tertiary-btn'),
      ...document.querySelectorAll('.mobile-add-to-cart-tertiary-btn'),
      ...document.querySelectorAll('button[name="add"]'),
    ];

    // Filter to find the first visible button that actually has dimensions
    this.mainATCButton =
      allButtons.find((button) => {
        const style = window.getComputedStyle(button);
        const rect = button.getBoundingClientRect();
        const isVisible =
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          rect.height > 0 &&
          rect.width > 0;

        return isVisible;
      }) || allButtons[0]; // Fallback to first button if none are visible

    if (!this.mainForm || !this.mainATCButton) {
      return;
    }

    this.init();
  }

  init() {
    // Setup elements
    this.setupElements();

    // Setup observers
    this.setupIntersectionObserver();
    this.setupFooterObserver();

    // Setup event listeners
    this.setupEventListeners();

    // Sync initial state
    this.syncWithMainForm();
  }

  setupElements() {
    // Get sticky bar elements
    this.stickyForm = this.bar.querySelector('.sticky-atc-bar__form');
    // Button might be rendered by secondary-button snippet, so use multiple selectors
    this.stickyButton = this.bar.querySelector('.sticky-atc-bar__button') || 
                        this.bar.querySelector('.sticky-atc-bar__form button[type="submit"]') ||
                        this.bar.querySelector('.sticky-atc-bar__form button');
    this.stickyVariantSelect = this.bar.querySelector('.sticky-atc-bar__variant-select');
    this.stickyQuantityInput = this.bar.querySelector('.sticky-atc-bar__quantity-input');
    this.stickyQuantityButtons = this.bar.querySelectorAll('.sticky-atc-bar__quantity-button');
    this.stickyPrice = this.bar.querySelector('.sticky-atc-bar__price');
    this.stickyImage = this.bar.querySelector('.sticky-atc-bar__image img');
  }

  setupIntersectionObserver() {
    // Track states
    this.isMainButtonVisible = true;
    this.isFooterVisible = false;

    // Watch when main ATC button goes out of view
    const options = {
      root: null,
      threshold: 0.1, // Trigger when at least 10% of button is visible
      rootMargin: '0px', // No margin adjustments
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // If button is intersecting (visible in viewport), hide sticky bar
        // If button is NOT intersecting (scrolled out of view), show sticky bar
        if (entry.isIntersecting) {
          // Main button is visible - hide sticky bar
          this.isMainButtonVisible = true;
          this.hideBar();
        } else {
          // Main button is not visible - show sticky bar (unless footer is visible)
          this.isMainButtonVisible = false;
          this.updateBarVisibility();
        }
      });
    }, options);

    // Wait for the page to fully load before observing
    if (document.readyState === 'complete') {
      this.startObserving();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.startObserving(), 100);
      });
    }
  }

  setupFooterObserver() {
    // Find the footer
    const footer =
      document.querySelector('footer') ||
      document.querySelector('.footer-container') ||
      document.querySelector('[role="contentinfo"]');

    if (!footer) return;

    // Watch when footer comes into view
    const footerOptions = {
      root: null,
      threshold: 0, // Trigger as soon as any part of footer is visible
      rootMargin: '0px',
    };

    this.footerObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this.isFooterVisible = entry.isIntersecting;
        this.updateBarVisibility();
      });
    }, footerOptions);

    // Wait for the page to fully load before observing
    if (document.readyState === 'complete') {
      this.footerObserver.observe(footer);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.footerObserver.observe(footer), 100);
      });
    }
  }

  updateBarVisibility() {
    // Show bar only if main button is not visible AND footer is not visible
    if (!this.isMainButtonVisible && !this.isFooterVisible) {
      this.showBar();
    } else {
      this.hideBar();
    }
  }

  startObserving() {
    if (!this.mainATCButton) {
      return;
    }

    this.observer.observe(this.mainATCButton);

    // Do an immediate check
    const rect = this.mainATCButton.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

    if (isVisible) {
      this.hideBar();
    } else {
      // Don't show on initial load if button is below viewport
      if (rect.top > window.innerHeight) {
        this.hideBar();
      }
    }
  }

  setupEventListeners() {
    // Sticky form submission
    if (this.stickyForm) {
      this.stickyForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Variant selection
    if (this.stickyVariantSelect) {
      this.stickyVariantSelect.addEventListener('change', (e) => {
        const variantId = e.target.value;
        
        // Update the hidden input in the form
        const hiddenVariantInput = this.stickyForm.querySelector('input[name="id"]');
        if (hiddenVariantInput) {
          hiddenVariantInput.value = variantId;
        }
        
        // Sync with main form
        this.syncVariantToMain(variantId);
      });
    }

    // Quantity buttons
    this.stickyQuantityButtons.forEach((button) => {
      button.addEventListener('click', (e) => this.handleQuantityChange(e));
    });

    // Quantity input
    if (this.stickyQuantityInput) {
      this.stickyQuantityInput.addEventListener('change', (e) => {
        this.validateQuantity(e.target);
      });
    }

    // Listen to main form changes
    if (this.mainForm) {
      // Variant changes - check multiple possible selectors
      const mainVariantInputs = this.mainForm.querySelectorAll(
        'input[name="id"], select[name="id"], #variant-id, .mobile-variant-id'
      );
      mainVariantInputs.forEach((input) => {
        input.addEventListener('change', () => this.syncFromMainForm());
      });

      // Quantity changes
      const mainQuantityInput = this.mainForm.querySelector('[name="quantity"]');
      if (mainQuantityInput) {
        mainQuantityInput.addEventListener('change', () => this.syncFromMainForm());
      }
    }

    // Listen to variant-selects custom element (if using Shopify's variant picker)
    const variantSelects = document.querySelector('variant-selects');
    if (variantSelects) {
      variantSelects.addEventListener('variant-change', () => {
        setTimeout(() => this.syncFromMainForm(), 100);
      });
    }
  }

  showBar() {
    requestAnimationFrame(() => {
      this.bar.classList.add('is-visible');
      this.bar.classList.remove('is-hidden');
    });
  }

  hideBar() {
    requestAnimationFrame(() => {
      this.bar.classList.remove('is-visible');
      this.bar.classList.add('is-hidden');
    });
  }

  handleSubmit(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(this.stickyForm);

    // Show loading state
    if (this.stickyButton) {
      this.stickyButton.classList.add('sticky-atc-bar__button--loading');
      this.stickyButton.disabled = true;
    }

    // Add to cart via Shopify API
    fetch('/cart/add.js', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // Success - trigger cart update
        this.handleAddToCartSuccess(data);
      })
      .catch((error) => {
        this.handleAddToCartError(error);
      })
      .finally(() => {
        // Remove loading state
        if (this.stickyButton) {
          this.stickyButton.classList.remove('sticky-atc-bar__button--loading');
          this.stickyButton.disabled = false;
        }
      });
  }

  handleAddToCartSuccess(data) {
    // Publish cart update event (if your theme uses this)
    document.dispatchEvent(new CustomEvent('cart:updated'));

    // Update cart count
    this.updateCartCount();

    // Refresh cart drawer content then open it
    this.refreshCartDrawer()
      .then(() => {
        this.openCartDrawer();
      })
      .catch((error) => {
        // Fallback: just update count and open
        this.updateCartCount();
        this.openCartDrawer();
      });
  }

  handleAddToCartError(error) {
    // Show error notification
    this.showNotification('Error adding to cart. Please try again.', 'error');
  }

  updateCartCount() {
    // Fetch updated cart
    fetch('/cart.js')
      .then((response) => response.json())
      .then((cart) => {
        // Update cart count in header
        const cartCounts = document.querySelectorAll('.cart-count-bubble span');
        cartCounts.forEach((count) => {
          count.textContent = cart.item_count;
        });
      });
  }

  refreshCartDrawer() {
    // Fetch updated cart drawer content
    return fetch(`${window.location.pathname}?section_id=cart-drawer`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');

        // Update cart drawer content
        const cartDrawerElement = document.querySelector('cart-drawer');
        const newCartDrawerContent = html.querySelector('cart-drawer');

        if (cartDrawerElement && newCartDrawerContent) {
          // Store the current state
          const isActive = cartDrawerElement.classList.contains('active');
          const isAnimating = cartDrawerElement.classList.contains('animate');

          // Replace the content
          cartDrawerElement.innerHTML = newCartDrawerContent.innerHTML;

          // Restore necessary classes
          if (isActive) cartDrawerElement.classList.add('active');
          if (isAnimating) cartDrawerElement.classList.add('animate');

          // Remove empty state if it has items
          if (!newCartDrawerContent.classList.contains('is-empty')) {
            cartDrawerElement.classList.remove('is-empty');
          } else {
            cartDrawerElement.classList.add('is-empty');
          }
        }

        // Also update cart icon bubble
        const cartIconBubble = document.querySelector('#cart-icon-bubble');
        const newCartIconBubble = html.querySelector('#cart-icon-bubble');

        if (cartIconBubble && newCartIconBubble) {
          cartIconBubble.innerHTML = newCartIconBubble.innerHTML;
        }

        // Re-initialize cart drawer quantity inputs (cart-drawer-custom.js handles close buttons via event delegation)
        if (typeof initializeCartDrawerQuantities === 'function') {
          setTimeout(() => initializeCartDrawerQuantities(), 50);
        }
      });
  }

  openCartDrawer() {
    // Open cart drawer if available
    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer && typeof cartDrawer.open === 'function') {
      cartDrawer.open();
    }
  }

  showNotification(message, type = 'success') {
    // Simple notification (you can enhance this)
    const notification = document.createElement('div');
    notification.className = `sticky-atc-notification sticky-atc-notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#4caf50' : '#f44336'};
      color: white;
      border-radius: 4px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  syncVariantToMain(variantId) {
    // Update main form's variant - try multiple selectors
    const mainVariantInput =
      this.mainForm.querySelector('#variant-id') ||
      this.mainForm.querySelector('.mobile-variant-id') ||
      this.mainForm.querySelector('input[name="id"]') ||
      this.mainForm.querySelector('select[name="id"]');
    if (mainVariantInput) {
      mainVariantInput.value = variantId;

      // Trigger change event
      mainVariantInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Sync back from main to update price, image, etc.
    setTimeout(() => this.syncFromMainForm(), 100);
  }

  syncFromMainForm() {
    // Sync variant - try multiple selectors
    const mainVariantInput =
      this.mainForm.querySelector('#variant-id') ||
      this.mainForm.querySelector('.mobile-variant-id') ||
      this.mainForm.querySelector('input[name="id"]:checked') ||
      this.mainForm.querySelector('select[name="id"]');
    
    if (mainVariantInput) {
      const variantId = mainVariantInput.value;
      
      // Update sticky bar's visible select
      if (this.stickyVariantSelect) {
        this.stickyVariantSelect.value = variantId;
      }
      
      // Update sticky bar's hidden form input
      const hiddenVariantInput = this.stickyForm?.querySelector('input[name="id"]');
      if (hiddenVariantInput) {
        hiddenVariantInput.value = variantId;
      }
    }

    // Sync quantity
    const mainQuantityInput = this.mainForm.querySelector('[name="quantity"]');
    if (mainQuantityInput) {
      // Update visible quantity input
      if (this.stickyQuantityInput) {
        this.stickyQuantityInput.value = mainQuantityInput.value;
      }
      
      // Update hidden quantity input in form
      const hiddenQuantityInput = this.stickyForm?.querySelector('input[name="quantity"]');
      if (hiddenQuantityInput) {
        hiddenQuantityInput.value = mainQuantityInput.value;
      }
    }

    // Update price
    this.updatePrice();

    // Update image
    this.updateImage();

    // Update button state
    this.updateButtonState();
  }

  syncWithMainForm() {
    this.syncFromMainForm();
  }

  updatePrice() {
    // Get current price container from main form - try multiple selectors
    const mainPriceContainer =
      document.querySelector('.main-product-price') ||
      document.querySelector('.mobile-main-product-price');

    if (mainPriceContainer && this.stickyPrice) {
      // Clone the price container classes to sync sale state
      const isOnSale = mainPriceContainer.classList.contains('price--on-sale');
      
      if (isOnSale) {
        this.stickyPrice.classList.add('price--on-sale');
      } else {
        this.stickyPrice.classList.remove('price--on-sale');
      }

      // Update all price items
      const mainPriceItems = mainPriceContainer.querySelectorAll('.price-item');
      const stickyPriceItems = this.stickyPrice.querySelectorAll('.price-item');
      
      mainPriceItems.forEach((mainItem, index) => {
        if (stickyPriceItems[index]) {
          stickyPriceItems[index].textContent = mainItem.textContent;
        }
      });
    }
  }

  updateImage() {
    // Get current variant image or featured image
    // Look for active gallery items or main product images
    const activeImage =
      document.querySelector('.gallery-item.is-active img') ||
      document.querySelector('.mobile-gallery-item.is-active img') ||
      document.querySelector('.product__media img[src*="variant"]') ||
      document.querySelector('.product__media img') ||
      document.querySelector('.product-gallery img');

    if (activeImage && this.stickyImage) {
      this.stickyImage.src = activeImage.src;
      this.stickyImage.alt = activeImage.alt || '';
    }
  }

  updateButtonState() {
    // Check if variant is available
    const mainButton = this.mainATCButton;
    if (!mainButton || !this.stickyButton) return;
    
    this.stickyButton.disabled = mainButton.disabled;

    // Find the text element in secondary-button (it's a direct child span)
    // Could also be in other button types, so try multiple selectors
    const buttonTextSpan = 
      this.stickyButton.querySelector('span:not(.rotate-arrow)') ||
      this.stickyButton.querySelector('.button-text') ||
      this.stickyButton.querySelector('.secondary-slide-button-text') ||
      this.stickyButton;

    if (buttonTextSpan) {
      const newText = mainButton.disabled ? 'Sold Out' : 'Add to Cart';
      buttonTextSpan.textContent = newText;
    }
  }

  handleQuantityChange(e) {
    const button = e.currentTarget;
    const action = button.dataset.action;
    const input = this.stickyQuantityInput;

    if (!input) return;

    let currentValue = parseInt(input.value) || 1;
    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || 999;

    if (action === 'increase') {
      currentValue = Math.min(currentValue + 1, max);
    } else if (action === 'decrease') {
      currentValue = Math.max(currentValue - 1, min);
    }

    // Update visible quantity input
    input.value = currentValue;

    // Update hidden quantity input in sticky form
    const hiddenQuantityInput = this.stickyForm?.querySelector('input[name="quantity"]');
    if (hiddenQuantityInput) {
      hiddenQuantityInput.value = currentValue;
    }

    // Update main form quantity
    const mainQuantityInput = this.mainForm?.querySelector('[name="quantity"]');
    if (mainQuantityInput) {
      mainQuantityInput.value = currentValue;
    }
  }

  validateQuantity(input) {
    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || 999;
    let value = parseInt(input.value);

    if (isNaN(value) || value < min) {
      value = min;
    } else if (value > max) {
      value = max;
    }

    input.value = value;
    
    // Update hidden quantity input in sticky form
    const hiddenQuantityInput = this.stickyForm?.querySelector('input[name="quantity"]');
    if (hiddenQuantityInput) {
      hiddenQuantityInput.value = value;
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.footerObserver) {
      this.footerObserver.disconnect();
    }
  }
}

// Initialize when DOM is ready and after a brief delay to ensure all elements are rendered
function initStickyBar() {
  // Wait a bit for all elements to be fully rendered
  setTimeout(() => {
    new StickyATCBar();
  }, 200);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStickyBar);
} else {
  // DOM is already interactive or complete - DOMContentLoaded has already fired
  initStickyBar();
}

// Make available globally for debugging
window.StickyATCBar = StickyATCBar;
