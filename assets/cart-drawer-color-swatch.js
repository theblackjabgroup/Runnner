class CartDrawerColorSwatch {
  constructor() {
    if (CartDrawerColorSwatch.instance) {
      return CartDrawerColorSwatch.instance;
    }

    this.isInitialized = false;
    this.boundHandlers = {
      handleClick: this.handleClick.bind(this),
      handleCartUpdate: this.handleCartUpdate.bind(this),
    };

    CartDrawerColorSwatch.instance = this;
    this.init();
  }

  init() {
    if (this.isInitialized) {
      return;
    }

    this.bindEvents();
    this.isInitialized = true;
  }

  bindEvents() {
    // Remove existing listeners first to prevent duplicates
    this.removeEvents();

    // Listen for color picker clicks
    document.addEventListener('click', this.boundHandlers.handleClick);

    // Listen for cart drawer updates
    document.addEventListener('cart:updated', this.boundHandlers.handleCartUpdate);
  }

  removeEvents() {
    document.removeEventListener('click', this.boundHandlers.handleClick);
    document.removeEventListener('cart:updated', this.boundHandlers.handleCartUpdate);
  }

  handleClick(e) {
    if (e.target.classList.contains('color-picker')) {
      this.handleColorChange(e.target);
    }
  }

  handleCartUpdate() {
    this.updateColorSwatches();
  }

  handleColorChange(colorButton) {
    const selectedColor = colorButton.dataset.color;
    const variantId = colorButton.dataset.variantId;
    const itemKey = colorButton.dataset.itemKey;
    const currentSize = colorButton.dataset.currentSize;
    const cartItem = colorButton.closest('tr');
    const currentVariantId = this.getCurrentVariantId(cartItem);

    if (!selectedColor || !variantId || !itemKey || variantId === currentVariantId) {
      return;
    }

    // Update the cart item with the new variant
    this.updateCartItemVariant(cartItem, itemKey, variantId, selectedColor, currentSize);
  }

  getCurrentVariantId(cartItem) {
    const quantityInput = cartItem.querySelector('input[data-quantity-variant-id]');
    return quantityInput ? quantityInput.dataset.quantityVariantId : null;
  }

  async updateCartItemVariant(cartItem, itemKey, newVariantId, selectedColor, currentSize) {
    const quantityInput = cartItem.querySelector('input[data-quantity-variant-id]');
    const currentQuantity = parseInt(quantityInput.value);
    const currentVariantId = quantityInput.dataset.quantityVariantId;

    try {
      // Show loading state
      this.showLoadingState(cartItem);

      // Use cart change API to update the variant
      await this.changeCartItemVariant(itemKey, newVariantId, currentQuantity);

      // Update the cart drawer
      await this.refreshCartDrawer();

      // Update color swatch selection
      this.updateColorSwatchSelection(cartItem, selectedColor);
    } catch (error) {
      this.showError(cartItem, 'Failed to update color selection');
    }
  }

  async changeCartItemVariant(itemKey, newVariantId, quantity) {
    // First remove the current item
    const removeResponse = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: itemKey,
        quantity: 0,
      }),
    });

    if (!removeResponse.ok) {
      throw new Error('Failed to remove current variant from cart');
    }

    // Then add the new variant
    const addResponse = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: newVariantId,
        quantity: quantity,
      }),
    });

    if (!addResponse.ok) {
      throw new Error('Failed to add new variant to cart');
    }

    return addResponse.json();
  }

  async refreshCartDrawer() {
    // Fetch updated cart content
    const response = await fetch('/cart?view=drawer', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh cart drawer');
    }

    const cartHTML = await response.text();

    // Update the cart drawer content
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(cartHTML, 'text/html');
    const newCartItems = newDoc.querySelector('cart-drawer-items');
    const currentCartItems = document.querySelector('cart-drawer-items');

    if (newCartItems && currentCartItems) {
      currentCartItems.innerHTML = newCartItems.innerHTML;
    }

    // Trigger cart updated event
    document.dispatchEvent(new CustomEvent('cart:updated'));
  }

  updateColorSwatches() {
    // Update color swatch selection states after cart updates
    const colorPickers = document.querySelectorAll('.color-picker');

    colorPickers.forEach((picker) => {
      const cartItem = picker.closest('tr');
      const currentColor = this.getCurrentItemColor(cartItem);

      if (picker.dataset.color === currentColor) {
        picker.classList.add('selected');
      } else {
        picker.classList.remove('selected');
      }
    });
  }

  updateColorSwatchSelection(cartItem, selectedColor) {
    // Update selection state for a specific cart item
    const colorPickers = cartItem.querySelectorAll('.color-picker');

    colorPickers.forEach((picker) => {
      if (picker.dataset.color === selectedColor) {
        picker.classList.add('selected');
      } else {
        picker.classList.remove('selected');
      }
    });
  }

  getCurrentItemColor(cartItem) {
    // Find the current color from the item options
    const colorLabel = cartItem.querySelector('.option-row .option-label');
    if (colorLabel && colorLabel.textContent.includes('COLOR:')) {
      const colorContainer = colorLabel.closest('.option-row');
      const selectedSwatch = colorContainer.querySelector('.color-picker.selected');
      return selectedSwatch ? selectedSwatch.dataset.color : null;
    }
    return null;
  }

  showLoadingState(cartItem) {
    const colorOptions = cartItem.querySelector('.color-options');
    if (colorOptions) {
      colorOptions.style.opacity = '0.5';
      colorOptions.style.pointerEvents = 'none';
    }
  }

  hideLoadingState(cartItem) {
    const colorOptions = cartItem.querySelector('.color-options');
    if (colorOptions) {
      colorOptions.style.opacity = '1';
      colorOptions.style.pointerEvents = 'auto';
    }
  }

  showError(cartItem, message) {
    this.hideLoadingState(cartItem);

    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'color-swatch-error';
    errorElement.style.cssText = `
      color: #ff0000;
      font-size: 12px;
      margin-top: 4px;
      padding: 4px;
      border: 1px solid #ff0000;
      border-radius: 3px;
      background: rgba(255, 0, 0, 0.1);
    `;
    errorElement.textContent = message;

    // Insert error message
    const colorOptions = cartItem.querySelector('.color-options');
    if (colorOptions && !cartItem.querySelector('.color-swatch-error')) {
      colorOptions.parentNode.appendChild(errorElement);

      // Remove error message after 3 seconds
      setTimeout(() => {
        errorElement.remove();
      }, 3000);
    }
  }

  // Utility method to get product variants with color options
  getColorVariants(productId) {
    if (!window.cartItemsData) return [];

    const cartItem = window.cartItemsData.find((item) => item.product_id === productId);
    return cartItem ? cartItem.product.variants || [] : [];
  }

  // Utility method to find variant by color
  findVariantByColor(productId, colorValue, currentSize = null) {
    const variants = this.getColorVariants(productId);

    return variants.find((variant) => {
      const hasMatchingColor = variant.options.some((option) => option.toLowerCase() === colorValue.toLowerCase());

      if (!currentSize) return hasMatchingColor;

      const hasMatchingSize = variant.options.some((option) => option.toLowerCase() === currentSize.toLowerCase());

      return hasMatchingColor && hasMatchingSize;
    });
  }
}

// Initialize the color swatch functionality when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  CartDrawerColorSwatch.getInstance();
});

// Also initialize when the cart drawer is opened (for dynamic content)
document.addEventListener('cart-drawer:open', () => {
  CartDrawerColorSwatch.getInstance();
});

// Static method to get singleton instance
CartDrawerColorSwatch.getInstance = function () {
  if (!CartDrawerColorSwatch.instance) {
    new CartDrawerColorSwatch();
  }
  return CartDrawerColorSwatch.instance;
};

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (CartDrawerColorSwatch.instance) {
    CartDrawerColorSwatch.instance.removeEvents();
  }
});
