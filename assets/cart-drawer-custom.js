/**
 * Cart Drawer Custom JavaScript functionality
 * Handles order notes, color changes, and variant switching in the cart drawer
 */

document.addEventListener('DOMContentLoaded', function () {
  // Order note functionality
  var orderNoteTextarea = document.getElementById('CartDrawer-Note');

  if (orderNoteTextarea) {
    orderNoteTextarea.addEventListener('blur', function () {
      var note = this.value;

      // Update cart note via AJAX
      fetch('/cart/update.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: note
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Cart note updated successfully');
      })
      .catch(error => {
        console.error('Error updating cart note:', error);
      });
    });
  }
});

/**
 * Color changing functionality for cart drawer
 * @param {HTMLElement} element - The clicked color element
 * @param {string} itemKey - The cart item key
 * @param {string} newColor - The new color value
 */
function changeItemColor(element, itemKey, newColor) {
  // Get cart items data from the global variable or fetch it
  if (typeof cartItemsData === 'undefined') {
    console.error('Cart items data not available');
    return;
  }

  // Find the cart item data
  const currentItem = cartItemsData.find(item => item.key === itemKey);

  if (!currentItem) {
    console.error('Item not found in cart');
    return;
  }

  // Find the variant that matches the new color and other current options
  const targetVariant = findVariantForOptions(currentItem.product, currentItem.options_with_values, 'color', newColor);

  if (!targetVariant) {
    console.error('No variant found for color:', newColor);
    return;
  }

  // Change the cart item to the new variant
  changeCartItemVariant(currentItem, targetVariant);
}

/**
 * Find variant that matches the specified options
 * @param {Object} product - The product object
 * @param {Array} currentOptions - Current options with values
 * @param {string} changingOptionType - The type of option being changed
 * @param {string} newValue - The new value for the option
 * @returns {Object|null} The matching variant or null
 */
function findVariantForOptions(product, currentOptions, changingOptionType, newValue) {
  return product.variants.find(variant => {
    return variant.options.every((option, index) => {
      const optionName = product.options[index].toLowerCase();

      if (optionName.includes(changingOptionType)) {
        return option.toLowerCase() === newValue.toLowerCase();
      } else {
        // For other options, keep the current value
        const currentOptionValue = Object.values(currentOptions)[index];
        return option === currentOptionValue;
      }
    });
  });
}

/**
 * Change cart item to a different variant
 * @param {Object} currentItem - The current cart item
 * @param {Object} newVariant - The new variant to switch to
 */
function changeCartItemVariant(currentItem, newVariant) {
  // First remove the current item
  fetch('/cart/change.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quantity: 0,
      id: currentItem.variant.id
    })
  })
  .then(response => response.json())
  .then(() => {
    // Then add the new variant with the same quantity
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: newVariant.id,
        quantity: currentItem.quantity
      })
    });
  })
  .then(response => response.json())
  .then(() => {
    // Reload the page to reflect changes
    window.location.reload();
  })
  .catch(error => {
    console.error('Error changing item variant:', error);
  });
}

/**
 * Size changing functionality for cart drawer
 * @param {HTMLElement} element - The clicked size element
 * @param {string} itemKey - The cart item key
 * @param {string} newSize - The new size value
 */
function changeItemSize(element, itemKey, newSize) {
  // Get cart items data
  if (typeof cartItemsData === 'undefined') {
    console.error('Cart items data not available');
    return;
  }

  const currentItem = cartItemsData.find(item => item.key === itemKey);

  if (!currentItem) {
    console.error('Item not found in cart');
    return;
  }

  // Find the variant that matches the new size and other current options
  const targetVariant = findVariantForOptions(currentItem.product, currentItem.options_with_values, 'size', newSize);

  if (!targetVariant) {
    console.error('No variant found for size:', newSize);
    return;
  }

  // Change the cart item to the new variant
  changeCartItemVariant(currentItem, targetVariant);
}

/**
 * Initialize cart drawer functionality
 */
function initializeCartDrawer() {
  // Set scroll speed CSS variable if settings are available
  if (typeof Shopify !== 'undefined' && Shopify.theme && Shopify.theme.settings) {
    const scrollSpeed = Shopify.theme.settings.scroll_speed || 10;
    document.documentElement.style.setProperty('--scroll-speed', scrollSpeed + 's');
  }

  // Add event listeners for size and color changes
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('size-option')) {
      e.preventDefault();
      const itemKey = e.target.closest('.cart-item').dataset.itemKey;
      const newSize = e.target.dataset.size;
      if (itemKey && newSize) {
        changeItemSize(e.target, itemKey, newSize);
      }
    }

    if (e.target.classList.contains('color-option')) {
      e.preventDefault();
      const itemKey = e.target.closest('.cart-item').dataset.itemKey;
      const newColor = e.target.dataset.color;
      if (itemKey && newColor) {
        changeItemColor(e.target, itemKey, newColor);
      }
    }
  });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCartDrawer);
} else {
  initializeCartDrawer();
}
