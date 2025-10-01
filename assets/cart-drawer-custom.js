/**
 * Cart Drawer Custom JavaScript functionality
 * Handles order notes, color changes, and variant switching in the cart drawer
 */

/**
 * Initialize cart drawer quantity inputs with correct values from cart items
 * This is needed because the quantity-input snippet doesn't have access to item data
 */
function initializeCartDrawerQuantities() {
  // Find all quantity input wrappers that have item data
  const wrappers = document.querySelectorAll('[data-item-key][data-item-quantity]');

  wrappers.forEach((wrapper) => {
    const itemQuantity = parseInt(wrapper.dataset.itemQuantity);
    const quantityInput = wrapper.querySelector('.quantity__input');

    if (quantityInput && itemQuantity) {
      // Set the correct quantity value
      quantityInput.value = itemQuantity;

      // Disable minus button if quantity is 1
      const minusButton = wrapper.querySelector('.quantity__button[name="minus"]');
      if (minusButton) {
        if (itemQuantity <= 1) {
          minusButton.disabled = true;
        } else {
          minusButton.disabled = false;
        }
      }
    }
  });
}

/**
 * Fallback mechanism to initialize quantities with retry logic
 * This ensures quantities are initialized even if the state detection fails
 */
function initializeCartDrawerQuantitiesWithFallback() {
  // Try to initialize immediately
  initializeCartDrawerQuantities();

  // Check if initialization was successful
  const wrappers = document.querySelectorAll('[data-item-key][data-item-quantity]');

  // Only retry if no wrappers were found
  if (wrappers.length === 0) {
    let retryCount = 0;
    const maxRetries = 5;

    function retry() {
      retryCount++;
      const delay = Math.pow(2, retryCount) * 50; // 100ms, 200ms, 400ms, 800ms, 1600ms

      setTimeout(() => {
        initializeCartDrawerQuantities();

        // Check if initialization succeeded
        const wrappers = document.querySelectorAll('[data-item-key][data-item-quantity]');

        // Only continue retrying if wrappers still not found and retries remaining
        if (wrappers.length === 0 && retryCount < maxRetries) {
          retry();
        }
      }, delay);
    }

    retry();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Order note functionality
  var orderNoteTextarea = document.getElementById('CartDrawer-Note');
  var saveNoteButton = document.getElementById('CartDrawer-SaveNote');

  // Function to update cart note
  function updateCartNote(note) {
    fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        note: note,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Cart note updated successfully');

        // Show success feedback
        if (saveNoteButton) {
          const originalText = saveNoteButton.textContent;
          saveNoteButton.textContent = 'Saved!';
          saveNoteButton.style.color = '#28a745';

          setTimeout(() => {
            saveNoteButton.textContent = originalText;
            saveNoteButton.style.color = 'var(--text)';
          }, 2000);
        }
      })
      .catch((error) => {
        console.error('Error updating cart note:', error);

        // Show error feedback
        if (saveNoteButton) {
          const originalText = saveNoteButton.textContent;
          saveNoteButton.textContent = 'Error!';
          saveNoteButton.style.color = '#dc3545';

          setTimeout(() => {
            saveNoteButton.textContent = originalText;
            saveNoteButton.style.color = 'var(--text)';
          }, 2000);
        }
      });
  }

  // Auto-save on blur
  if (orderNoteTextarea) {
    orderNoteTextarea.addEventListener('blur', function () {
      var note = this.value.trim();
      // Always update cart note (allows clearing notes)
      updateCartNote(note);
    });
  }

  // Save button click
  if (saveNoteButton) {
    saveNoteButton.addEventListener('click', function () {
      var note = orderNoteTextarea ? orderNoteTextarea.value.trim() : '';
      updateCartNote(note);
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
  if (typeof window.cartItemsData === 'undefined') {
    console.error('Cart items data not available');
    return;
  }

  // Find the cart item data
  const currentItem = window.cartItemsData.find((item) => item.key === itemKey);

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
  return product.variants.find((variant) => {
    return variant.options.every((option, index) => {
      const optionName = product.options[index].toLowerCase();

      if (optionName.includes(changingOptionType)) {
        return option.toLowerCase() === newValue.toLowerCase();
      } else {
        // For other options, keep the current value
        const currentOptionValue = currentOptions[index] ? currentOptions[index].value : null;
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
      id: currentItem.variant.id,
    }),
  })
    .then((response) => response.json())
    .then(() => {
      // Then add the new variant with the same quantity
      return fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newVariant.id,
          quantity: currentItem.quantity,
        }),
      });
    })
    .then((response) => response.json())
    .then(() => {
      // Reload the page to reflect changes
      window.location.reload();
    })
    .catch((error) => {
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
  if (typeof window.cartItemsData === 'undefined') {
    console.error('Cart items data not available');
    return;
  }

  const currentItem = window.cartItemsData.find((item) => item.key === itemKey);

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

  // Watch for cart drawer opening and initialize quantities
  const cartDrawer = document.querySelector('cart-drawer');
  if (cartDrawer) {
    // Track previous open state to avoid redundant calls
    let wasOpen = cartDrawer.classList.contains('active');

    // Initialize immediately if drawer is already open
    if (wasOpen) {
      // Use a small delay to ensure DOM elements are fully rendered
      setTimeout(() => {
        initializeCartDrawerQuantitiesWithFallback();
      }, 50);
    }

    // Watch for drawer opening using MutationObserver
    const observer = new MutationObserver((mutations) => {
      // Check current state only once per batch of mutations
      const isOpen = cartDrawer.classList.contains('active');

      // Only trigger if the state changed from closed to open
      if (isOpen && !wasOpen) {
        // Use multiple timing strategies to ensure DOM is ready
        requestAnimationFrame(() => {
          // Double RAF for better DOM synchronization
          requestAnimationFrame(() => {
            // Add a small delay as final fallback
            setTimeout(() => {
              initializeCartDrawerQuantitiesWithFallback();
            }, 10);
          });
        });
      }

      // Update tracked state
      wasOpen = isOpen;
    });

    observer.observe(cartDrawer, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Also observe cart drawer items for content changes
    const cartDrawerItems = cartDrawer.querySelector('cart-drawer-items');
    if (cartDrawerItems) {
      const itemsObserver = new MutationObserver((mutations) => {
        // Check if cart items were added or modified
        const hasRelevantChanges = mutations.some(
          (mutation) =>
            mutation.type === 'childList' ||
            (mutation.type === 'attributes' && mutation.attributeName === 'data-item-quantity')
        );

        if (hasRelevantChanges) {
          // Initialize quantities when cart content changes
          setTimeout(() => {
            initializeCartDrawerQuantities();
          }, 10);
        }
      });

      itemsObserver.observe(cartDrawerItems, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-item-quantity'],
      });

      // Store observer reference for potential cleanup
      window.cartDrawerItemsObserver = itemsObserver;
    }

    // Store observer reference for potential cleanup
    window.cartDrawerObserver = observer;
  }

  // Add event listeners for size and color changes
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('size-option')) {
      e.preventDefault();
      const itemKey = e.target.dataset.itemKey;
      const newSize = e.target.dataset.size;
      if (itemKey && newSize) {
        changeItemSize(e.target, itemKey, newSize);
      }
    }

    if (e.target.classList.contains('color-option')) {
      e.preventDefault();
      const itemKey = e.target.dataset.itemKey;
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
