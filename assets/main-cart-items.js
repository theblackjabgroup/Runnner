/**
 * Cart Items JavaScript functionality
 * Handles cart item interactions, quantity updates, color changes, and sidebar sections
 */

/**
 * Toggle sidebar sections (expand/collapse)
 * @param {HTMLElement} header - The clicked header element
 */
function toggleSection(header) {
  const section = header.parentElement;
  const isExpanded = section.classList.contains('expanded');

  // Close all sections and remove icon animation
  document.querySelectorAll('.sidebar-section').forEach((s) => {
    s.classList.remove('expanded');
    const icon = s.querySelector('.pmorph__icon');
    if (icon) icon.classList.remove('expanded');
  });

  // Open clicked section and animate icon
  if (!isExpanded) {
    section.classList.add('expanded');
    const icon = section.querySelector('.pmorph__icon');
    if (icon) icon.classList.add('expanded');
  }
}

/**
 * Close cart functionality
 */
function closeCart() {
  // Add your close cart logic here
  console.log('Close cart');
}

/**
 * Update cart item quantity
 * @param {string} itemKey - The cart item key
 * @param {number} quantity - The new quantity
 */
function updateQuantity(itemKey, quantity) {
  console.log('Updating quantity:', itemKey, quantity);

  fetch('/cart/change.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      id: itemKey,
      quantity: quantity,
    }),
  })
    .then((response) => {
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log('Cart data received:', data);
      updateCartDisplay(data);
    })
    .catch((error) => {
      console.error('Error updating cart:', error);
      // Optionally reload the page if cart update fails
      // window.location.reload();
    });
}

/**
 * Update cart display after quantity changes
 * @param {Object} cartData - The updated cart data
 */
function updateCartDisplay(cartData) {
  // Update cart item count in header
  const cartTitle = document.querySelector('.cart-title');
  if (cartTitle) {
    cartTitle.textContent = `Cart [${cartData.item_count}]`;
  }

  // Update total price
  const totalAmount = document.querySelector('.total-amount');
  if (totalAmount && cartData.total_price) {
    totalAmount.textContent = formatMoney(cartData.total_price);
  }

  // Update individual item quantities and remove items with 0 quantity
  cartData.items.forEach((item) => {
    const itemElement = document.querySelector(`[data-item-key="${item.key}"]`);
    if (itemElement) {
      const qtyInput = itemElement.closest('.cart-item').querySelector('.qty-input');
      if (qtyInput) {
        qtyInput.value = item.quantity;
      }

      // Update item total price if it exists
      const itemPrice = itemElement.closest('.cart-item').querySelector('.item-price');
      if (itemPrice) {
        itemPrice.textContent = formatMoney(item.final_line_price);
      }
    }
  });

  // Remove items that are no longer in cart
  const currentItemKeys = cartData.items.map((item) => item.key);
  document.querySelectorAll('.cart-item').forEach((cartItem) => {
    const itemKey = cartItem.querySelector('[data-item-key]').dataset.itemKey;
    if (!currentItemKeys.includes(itemKey)) {
      cartItem.remove();
    }
  });

  // Update button states
  updateButtonStates(cartData);
}

/**
 * Update button states based on cart data
 * @param {Object} cartData - The cart data
 */
function updateButtonStates(cartData) {
  cartData.items.forEach((item) => {
    const decreaseBtn = document.querySelector(`[data-item-key="${item.key}"].decrease-qty`);
    const increaseBtn = document.querySelector(`[data-item-key="${item.key}"].increase-qty`);

    if (decreaseBtn) {
      // Only disable decrease if quantity is 1 or less
      if (item.quantity <= 1) {
        decreaseBtn.disabled = true;
      } else {
        decreaseBtn.disabled = false;
      }
    }

    if (increaseBtn) {
      // Check if there's an inventory limit
      const variant = item.variant;
      if (variant && variant.inventory_management && variant.inventory_quantity) {
        if (item.quantity >= variant.inventory_quantity) {
          increaseBtn.disabled = true;
        } else {
          increaseBtn.disabled = false;
        }
      } else {
        // No inventory limit, always allow increase
        increaseBtn.disabled = false;
      }
    }
  });

  // Update checkout button
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    if (cartData.item_count === 0) {
      checkoutBtn.disabled = true;
    } else {
      checkoutBtn.disabled = false;
    }
  }
}

/**
 * Format money value
 * @param {number} cents - Price in cents
 * @returns {string} Formatted money string
 */
function formatMoney(cents) {
  // Simple money formatting - adjust based on your currency settings
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars}`;
}

/**
 * Change item color
 * @param {HTMLElement} colorPicker - The clicked color picker element
 */
function changeItemColor(colorPicker) {
  const itemKey = colorPicker.dataset.itemKey;
  const newColor = colorPicker.dataset.color;
  const currentSize = colorPicker.dataset.currentSize;
  const newVariantId = colorPicker.dataset.variantId;

  console.log('Changing color:', { itemKey, newColor, currentSize, newVariantId });

  // First, find the correct variant for the new color and current size
  findVariantForOptions(itemKey, newColor, currentSize)
    .then((targetVariantId) => {
      if (targetVariantId) {
        // Remove current item and add new variant
        return changeCartItemVariant(itemKey, targetVariantId);
      } else {
        throw new Error('Variant not found for selected color and size combination');
      }
    })
    .then(() => {
      // Reload the page to refresh the cart display
      window.location.reload();
    })
    .catch((error) => {
      console.error('Error changing item color:', error);
      alert('Unable to change color. Please try again.');
    });
}

/**
 * Find variant for specific options
 * @param {string} itemKey - The item key
 * @param {string} newColor - The new color
 * @param {string} currentSize - The current size
 * @returns {Promise<string>} Promise resolving to variant ID
 */
function findVariantForOptions(itemKey, newColor, currentSize) {
  return new Promise((resolve, reject) => {
    // Get the product handle from the current item
    const cartItem = document.querySelector(`[data-item-key="${itemKey}"]`).closest('.cart-item');
    const itemTitle = cartItem.querySelector('.item-title-cart-page').textContent;

    // We need to fetch product data to find the correct variant
    // For now, we'll use the variant ID from the color picker
    const colorPicker = cartItem.querySelector(`[data-color="${newColor}"]`);
    if (colorPicker && colorPicker.dataset.variantId) {
      resolve(colorPicker.dataset.variantId);
    } else {
      reject('Variant not found');
    }
  });
}

/**
 * Change cart item variant
 * @param {string} itemKey - The current item key
 * @param {string} newVariantId - The new variant ID
 * @returns {Promise} Promise for the cart update
 */
function changeCartItemVariant(itemKey, newVariantId) {
  // Get current quantity
  const qtyInput = document.querySelector(`[data-item-key="${itemKey}"]`);
  const currentQty = parseInt(qtyInput.value);

  // Remove the current item and add the new variant
  return fetch('/cart/change.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      id: itemKey,
      quantity: 0,
    }),
  })
    .then((response) => response.json())
    .then(() => {
      // Add the new variant
      return fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: newVariantId,
          quantity: currentQty,
        }),
      });
    })
    .then((response) => response.json());
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
  // Quantity controls event listeners
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('decrease-qty')) {
      e.preventDefault();
      const itemKey = e.target.dataset.itemKey;
      const input = document.querySelector(`input[data-item-key="${itemKey}"]`);
      const currentQty = parseInt(input.value);
      if (currentQty > 1) {
        updateQuantity(itemKey, currentQty - 1);
      }
    }

    if (e.target.classList.contains('increase-qty')) {
      e.preventDefault();
      const itemKey = e.target.dataset.itemKey;
      const input = document.querySelector(`input[data-item-key="${itemKey}"]`);
      const currentQty = parseInt(input.value);
      console.log('Increasing quantity from', currentQty, 'to', currentQty + 1);
      updateQuantity(itemKey, currentQty + 1);
    }

    if (e.target.classList.contains('remove-btn')) {
      e.preventDefault();
      const itemKey = e.target.dataset.itemKey;
      updateQuantity(itemKey, 0);
    }
  });

  // Form submissions
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    console.log('Form submitted:', e.target);
    // Add your form handling logic here
  });
});
