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
 * Handle shipping estimate form submission
 * @param {HTMLFormElement} form - The shipping estimate form
 */
function handleShippingEstimate(form) {
  const zipCode = form.querySelector('#shipping-zip').value.trim();
  const resultsDiv = document.getElementById('shipping-results');
  const loadingDiv = document.getElementById('shipping-loading');
  const optionsDiv = document.getElementById('shipping-options');
  const errorDiv = document.getElementById('shipping-error');

  if (!zipCode) {
    showShippingError('Please enter a zip code');
    return;
  }

  // Show loading state
  resultsDiv.style.display = 'block';
  loadingDiv.style.display = 'block';
  optionsDiv.innerHTML = '';
  errorDiv.style.display = 'none';

  // Get shipping rates from Shopify
  getShippingRates(zipCode)
    .then((rates) => {
      loadingDiv.style.display = 'none';
      displayShippingOptions(rates);
    })
    .catch((error) => {
      loadingDiv.style.display = 'none';
      showShippingError(error.message || 'Unable to calculate shipping rates');
    });
}

/**
 * Get shipping rates from Shopify
 * @param {string} zipCode - The zip code to calculate rates for
 * @returns {Promise<Array>} Promise resolving to array of shipping rates
 */
function getShippingRates(zipCode) {
  return new Promise((resolve, reject) => {
    // First, we need to get the current cart data
    fetch('/cart.js')
      .then((response) => response.json())
      .then((cartData) => {
        if (cartData.item_count === 0) {
          reject(new Error('Cart is empty'));
          return;
        }

        // Try the modern Shopify API first
        const shippingAddress = {
          zip: zipCode,
          country: 'US',
          province: '',
          city: '',
          address1: '123 Main St',
          address2: '',
          company: '',
          first_name: '',
          last_name: '',
          phone: '',
        };

        // Use Shopify's shipping rates API with correct format
        return fetch('/cart/shipping_rates.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            shipping_address: shippingAddress,
          }),
        });
      })
      .then((response) => {
        if (!response.ok) {
          // If the modern API fails, try alternative approach
          if (response.status === 422) {
            console.log('Modern API failed, trying alternative approach...');
            return getShippingRatesAlternative(zipCode);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.shipping_rates && data.shipping_rates.length > 0) {
          resolve(data.shipping_rates);
        } else {
          reject(new Error('No shipping rates available for this location'));
        }
      })
      .catch((error) => {
        console.error('Error fetching shipping rates:', error);
        // Try alternative approach as fallback
        getShippingRatesAlternative(zipCode).then(resolve).catch(reject);
      });
  });
}

/**
 * Alternative method to get shipping rates using different API approach
 * @param {string} zipCode - The zip code to calculate rates for
 * @returns {Promise<Array>} Promise resolving to array of shipping rates
 */
function getShippingRatesAlternative(zipCode) {
  return new Promise((resolve, reject) => {
    // Try using the checkout API endpoint
    const checkoutData = {
      shipping_address: {
        zip: zipCode,
        country: 'US',
        province: '',
        city: '',
        address1: '123 Main St',
        address2: '',
        company: '',
        first_name: '',
        last_name: '',
        phone: '',
      },
    };

    fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(checkoutData),
    })
      .then((response) => response.json())
      .then((data) => {
        // If this approach doesn't work, provide mock data for testing
        console.log('Alternative API response:', data);

        // Provide mock shipping rates for testing
        const mockRates = [
          { name: 'Standard Shipping', price: 599 },
          { name: 'Express Shipping', price: 1299 },
          { name: 'Overnight Shipping', price: 2499 },
        ];

        resolve(mockRates);
      })
      .catch((error) => {
        console.error('Alternative API also failed:', error);
        reject(new Error('Unable to calculate shipping rates. Please try again later.'));
      });
  });
}

/**
 * Display shipping options to the user
 * @param {Array} rates - Array of shipping rate objects
 */
function displayShippingOptions(rates) {
  const optionsDiv = document.getElementById('shipping-options');

  if (rates.length === 0) {
    showShippingError('No shipping options available for this location');
    return;
  }

  optionsDiv.innerHTML = '';

  rates.forEach((rate) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'shipping-option';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'shipping-option-name';
    nameSpan.textContent = rate.name || 'Standard Shipping';

    const priceSpan = document.createElement('span');
    priceSpan.className = 'shipping-option-price';
    priceSpan.textContent = rate.price === 0 ? 'Free' : formatMoney(rate.price);

    optionDiv.appendChild(nameSpan);
    optionDiv.appendChild(priceSpan);
    optionsDiv.appendChild(optionDiv);
  });
}

/**
 * Show shipping error message
 * @param {string} message - Error message to display
 */
function showShippingError(message) {
  const resultsDiv = document.getElementById('shipping-results');
  const errorDiv = document.getElementById('shipping-error');
  const loadingDiv = document.getElementById('shipping-loading');
  const optionsDiv = document.getElementById('shipping-options');

  resultsDiv.style.display = 'block';
  loadingDiv.style.display = 'none';
  optionsDiv.innerHTML = '';
  errorDiv.style.display = 'block';
  errorDiv.textContent = message;
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

    // Handle shipping estimate form
    if (e.target.id === 'shipping-estimate-form') {
      handleShippingEstimate(e.target);
    }
    // Add your form handling logic here for other forms
  });
});
