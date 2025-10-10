/**
 * Main Product Page JavaScript
 * Handles product variant selection, gallery, cart functionality, and UI interactions
 */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Shopify data from Liquid template
  const shopCurrency = window.SHOP_CURRENCY || 'USD';
  const moneyFormat = window.MONEY_FORMAT || '{{amount}}';
  const productOptions = window.PRODUCT_OPTIONS || [];
  const productVariants = window.PRODUCT_VARIANTS || [];
  const cartType = window.CART_TYPE || 'page';

  // Money formatting functions
  function formatMoney(cents) {
    if (cents === null || cents === undefined || isNaN(cents)) return '';

    try {
      const amount = (cents / 100).toFixed(2);
      const amountNoDecimals = Math.floor(cents / 100);

      if (!moneyFormat || typeof moneyFormat !== 'string') {
        throw new Error('Invalid money format');
      }

      let formatted = moneyFormat
        .replace(/\{\{\s*amount\s*\}\}/g, amount)
        .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, amountNoDecimals)
        .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, amount.replace('.', ','))
        .replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/g, amountNoDecimals.toString())
        .replace(/\{\{\s*amount_with_space_separator\s*\}\}/g, amount.replace(/\B(?=(\d{3})+(?!\d))/g, ' '))
        .replace(
          /\{\{\s*amount_no_decimals_with_space_separator\s*\}\}/g,
          amountNoDecimals.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        );

      return formatted;
    } catch (error) {
      return formatMoneyFallback(cents);
    }
  }

  function formatMoneyFallback(cents, currencyCode = shopCurrency) {
    if (cents === null || cents === undefined || isNaN(cents)) return '';

    const amount = cents / 100;

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode || 'USD',
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return `$${amount.toFixed(2)}`;
    }
  }

  // Product option indices
  const colorIndex = productOptions.findIndex((opt) => opt.toLowerCase() === 'color' || opt.toLowerCase() === 'colour');
  const sizeIndex = productOptions.findIndex((opt) => opt.toLowerCase() === 'size');

  const denominationIndex = productOptions.findIndex(
    (opt) =>
      opt.toLowerCase().includes('denomination') ||
      opt.toLowerCase().includes('value') ||
      opt.toLowerCase().includes('amount') ||
      opt.toLowerCase().includes('price')
  );

  let mainOptionIndex = -1;
  if (denominationIndex >= 0) {
    mainOptionIndex = denominationIndex;
  } else if (sizeIndex >= 0) {
    mainOptionIndex = sizeIndex;
  } else {
    mainOptionIndex = productOptions.findIndex((opt, index) => index !== colorIndex);
  }

  // State management - Initialize with first available variant or first variant
  let selectedColor = null;
  let selectedSize = null;
  let selectedMainOption = null;

  const firstVariant = productVariants.find((v) => v.available) || productVariants[0];
  if (firstVariant) {
    if (colorIndex >= 0) {
      selectedColor = firstVariant[`option${colorIndex + 1}`];
    }
    if (sizeIndex >= 0) {
      selectedSize = firstVariant[`option${sizeIndex + 1}`];
    }
    if (mainOptionIndex >= 0) {
      selectedMainOption = firstVariant[`option${mainOptionIndex + 1}`];
    }
  }

  // Helper functions
  function lockBodyScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }

  function unlockBodyScroll() {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }

  function findMatchingVariant(color = selectedColor, size = selectedSize, mainOption = selectedMainOption) {
    const variant = productVariants.find((variant) => {
      const colorMatch = colorIndex >= 0 ? variant[`option${colorIndex + 1}`] === color : true;
      const sizeMatch = sizeIndex >= 0 ? variant[`option${sizeIndex + 1}`] === size : true;
      const mainOptionMatch = mainOptionIndex >= 0 ? variant[`option${mainOptionIndex + 1}`] === mainOption : true;

      return colorMatch && sizeMatch && mainOptionMatch;
    });

    return variant;
  }

  // URL Management Functions
  function updateURLWithVariant(variant) {
    if (!variant || !variant.id) return;

    const url = new URL(window.location);
    url.searchParams.set('variant', variant.id);

    // Update the URL without reloading the page
    window.history.replaceState({ variantId: variant.id }, '', url);

    // Update canonical URL if it exists
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.href = url.href;
    }

    // Dispatch custom event for analytics or other tracking
    window.dispatchEvent(
      new CustomEvent('variant:changed', {
        detail: { variant: variant, url: url.href },
      })
    );
  }

  function initializeVariantFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const variantId = urlParams.get('variant');

    if (variantId) {
      // Find the variant by ID
      const variant = productVariants.find((v) => v.id.toString() === variantId);

      if (variant && variant.available) {
        // Update selected options based on the variant
        if (colorIndex >= 0) {
          selectedColor = variant[`option${colorIndex + 1}`];
        }
        if (sizeIndex >= 0) {
          selectedSize = variant[`option${sizeIndex + 1}`];
        }
        if (mainOptionIndex >= 0) {
          selectedMainOption = variant[`option${mainOptionIndex + 1}`];
        }

        // Update UI to reflect the selected variant
        updateUIForVariant(variant);

        return true;
      }
    }
    return false;
  }

  function updateUIForVariant(variant) {
    // Update color swatches
    if (colorIndex >= 0 && selectedColor) {
      const colorSwatch = document.querySelector(`[data-option-value="${selectedColor}"]`);
      if (colorSwatch) {
        // Remove active styling from all swatches
        document.querySelectorAll('.color-swatch').forEach((swatch) => {
          swatch.classList.remove('ring-1', 'ring-offset-1', 'ring-black');
        });

        // Add active styling to selected swatch
        colorSwatch.classList.add('ring-1', 'ring-offset-2', 'ring-black');

        // Update color display
        document.querySelectorAll('[data-active-color]').forEach((display) => {
          display.textContent = selectedColor;
        });
      }
    }

    // Update size/option buttons
    if (selectedMainOption) {
      const sizeButton = document.querySelector(`[data-value="${selectedMainOption}"]`);
      if (sizeButton && !sizeButton.disabled) {
        // Remove active styling from all size buttons
        document.querySelectorAll('.size-btn').forEach((btn) => {
          btn.classList.remove('active', 'bg-black', 'text-white');
        });

        // Add active styling to selected button
        sizeButton.classList.add('active', 'bg-black', 'text-white');
      }
    }

    // Update price and availability
    updatePriceDisplay(variant, false);
    updatePriceDisplay(variant, true);
    updateAddToCartButton(variant, false);
    updateAddToCartButton(variant, true);
  }

  function handlePopState(event) {
    if (event.state && event.state.variantId) {
      const variant = productVariants.find((v) => v.id.toString() === event.state.variantId);
      if (variant) {
        // Update selected options
        if (colorIndex >= 0) {
          selectedColor = variant[`option${colorIndex + 1}`];
        }
        if (sizeIndex >= 0) {
          selectedSize = variant[`option${sizeIndex + 1}`];
        }
        if (mainOptionIndex >= 0) {
          selectedMainOption = variant[`option${mainOptionIndex + 1}`];
        }

        // Update UI
        updateUIForVariant(variant);
        updateSizeAvailability();
      }
    }
  }

  // Cart functionality
  function refreshCartDrawer() {
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
          }
        }

        // Also update cart icon bubble
        const cartIconBubble = document.querySelector('#cart-icon-bubble');
        const newCartIconBubble = html.querySelector('#cart-icon-bubble');

        if (cartIconBubble && newCartIconBubble) {
          cartIconBubble.innerHTML = newCartIconBubble.innerHTML;
        }

        // Update cart count
        updateCartCount();

        // Re-initialize cart drawer event listeners
        initializeCartDrawerEventListeners();
      })
      .catch((error) => {
        return updateCartCount();
      });
  }

  function initializeCartDrawerEventListeners() {
    // Re-initialize overlay click handler
    const overlay = document.querySelector('#CartDrawer-Overlay');
    if (overlay) {
      overlay.addEventListener('click', function () {
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer && typeof cartDrawer.close === 'function') {
          cartDrawer.close();
        }
      });
    }

    // Re-initialize close button handlers
    const closeButtons = document.querySelectorAll('.drawer__close, .drawer__close2');
    closeButtons.forEach((button) => {
      button.addEventListener('click', function () {
        const cartDrawer = this.closest('cart-drawer');
        if (cartDrawer && typeof cartDrawer.close === 'function') {
          cartDrawer.close();
        }
      });
    });

    // Re-initialize quantity input handlers if they exist
    const quantityInputs = document.querySelectorAll('.cart-quantity input[type="number"]');
    quantityInputs.forEach((input) => {
      // Remove any existing listeners first
      input.removeEventListener('change', handleQuantityChange);
      input.addEventListener('change', handleQuantityChange);
    });

    // Re-initialize remove buttons
    const removeButtons = document.querySelectorAll('cart-remove-button button');
    removeButtons.forEach((button) => {
      if (!button.hasAttribute('data-listener-added')) {
        button.setAttribute('data-listener-added', 'true');
        button.addEventListener('click', function (e) {
          e.preventDefault();
          const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
          if (cartItems && cartItems.updateQuantity) {
            const index = this.closest('cart-remove-button').dataset.index;
            cartItems.updateQuantity(index, 0, e);
          }
        });
      }
    });
  }

  function handleQuantityChange(event) {
    const cartItems = event.target.closest('cart-items') || event.target.closest('cart-drawer-items');
    if (cartItems && cartItems.validateQuantity) {
      cartItems.validateQuantity(event);
    }
  }

  function openCartDrawer() {
    // Try to click cart icon to open drawer
    const cartIcon = document.querySelector('#cart-icon-bubble');
    if (cartIcon) {
      cartIcon.click();
      return;
    }

    // Fallback: try to open cart drawer directly
    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer && typeof cartDrawer.open === 'function') {
      cartDrawer.open();
    } else if (cartDrawer) {
      // Manually add active class
      cartDrawer.classList.add('animate', 'active');
      document.body.classList.add('overflow-hidden');
    } else {
      // Final fallback: redirect to cart page
      window.location.href = '/cart';
    }
  }

  function updateCartCount() {
    fetch(window.routes?.cart_url || '/cart.js')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((cart) => {
        // Target all possible cart count elements using various common selectors
        const cartCountSelectors = [
          '.cart-count',
          '[data-cart-count]',
          '.cart-count-bubble',
          '#cart-icon-bubble .visually-hidden',
          '.cart-item-count',
          '.js-cart-count',
          '.site-header__cart-count',
          '.cart-count-number',
          '[data-header-cart-count]',
        ];

        // Query all possible cart count elements
        cartCountSelectors.forEach((selector) => {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach((el) => {
              el.textContent = cart.item_count;
              el.classList.remove('hidden');

              if (el.querySelector('span')) {
                el.querySelector('span').textContent = cart.item_count;
              }
            });
          }
        });

        const cartIcons = document.querySelectorAll('.cart-icon, [data-cart-icon]');
        cartIcons.forEach((icon) => {
          if (icon) {
            icon.setAttribute('data-count', cart.item_count);
          }
        });

        document.dispatchEvent(
          new CustomEvent('cart:updated', {
            detail: { cart: cart },
          })
        );
      })
      .catch((error) => {
        // Silent fail for cart count updates
      });
  }

  function addToCart(variantId, quantity) {
    if (!variantId) {
      alert('Please select a valid product variant');
      return;
    }

    // Show loading state
    const buttonContainers = document.querySelectorAll('#add-to-cart-btn, .mobile-add-to-cart-btn');
    const originalTexts = [];

    buttonContainers.forEach((container, index) => {
      const btn = container.querySelector('button');
      if (!btn || btn.disabled) return;

      btn.disabled = true;
      const textEl = btn.querySelector('.tertiary-slide-button-text');
      if (textEl) {
        originalTexts[index] = textEl.innerHTML;
        const arrowHTML = textEl.querySelector('.tertiary-slide-button-arrow')?.outerHTML || '';
        textEl.innerHTML = 'ADDING...' + arrowHTML;
      }
    });

    const formData = {
      items: [
        {
          id: variantId,
          quantity: quantity,
        },
      ],
    };

    fetch(window.routes?.cart_add_url || '/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return { success: true };
        }

        return response.json();
      })
      .then((data) => {
        // Update cart count immediately
        updateCartCount();

        refreshCartDrawer()
          .then(() => {
            openCartDrawer();
          })
          .catch((error) => {
            updateCartCount();
            openCartDrawer();
          });
      })
      .catch((error) => {
        if (error.message.includes('Unexpected') || error.message.includes('JSON')) {
          setTimeout(() => {
            updateCartCount();
          }, 500);

          // Show a more appropriate message
          const notification = document.createElement('div');
          notification.className =
            'fixed bottom-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg z-50 opacity-0 transition-opacity duration-300';
          notification.textContent = 'Item may have been added - please check cart';
          document.body.appendChild(notification);

          setTimeout(() => (notification.style.opacity = '1'), 10);
          setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
          }, 3000);

          return;
        }

        setTimeout(() => {
          updateCartCount();
        }, 1000);

        // Show error notification
        const notification = document.createElement('div');
        notification.className =
          'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg z-50 opacity-0 transition-opacity duration-300';
        notification.textContent = 'Error adding to cart';
        document.body.appendChild(notification);

        setTimeout(() => (notification.style.opacity = '1'), 10);
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, 2000);
      })
      .finally(() => {
        // Restore button states after delay
        setTimeout(() => {
          buttonContainers.forEach((container, index) => {
            if (originalTexts[index]) {
              const btn = container.querySelector('button');
              if (btn) {
                btn.disabled = false;
                const textEl = btn.querySelector('.tertiary-slide-button-text');
                if (textEl && originalTexts[index]) {
                  textEl.innerHTML = originalTexts[index];
                }
              }
            }
          });
        }, 1500);
      });
  }

  function updatePriceDisplay(variant, isMobile = false) {
    const priceContainer = document.querySelector(isMobile ? '.mobile-main-product-price' : '.main-product-price');
    const savingsInfoEl = document.querySelector(isMobile ? '.mobile-savings-info' : '#savings-info');

    if (!variant || !priceContainer) {
      return;
    }

    // Find all price elements and update them
    const allPriceElements = priceContainer.querySelectorAll('.price-item');
    allPriceElements.forEach((el) => {
      if (el.classList.contains('price-item--sale') || el.classList.contains('price-item--regular')) {
        el.textContent = formatMoney(variant.price);
      }
    });

    // Handle compare at price and update price container classes
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      // Add sale class to show sale price section
      priceContainer.classList.add('price--on-sale');

      // Update compare at price in the sale section
      const saleComparePriceEl = priceContainer.querySelector('.price__sale .price-item--regular');
      if (saleComparePriceEl) {
        saleComparePriceEl.textContent = formatMoney(variant.compare_at_price);
      }

      if (savingsInfoEl) {
        const savings = variant.compare_at_price - variant.price;
        const percentage = Math.round((savings / variant.compare_at_price) * 100);
        savingsInfoEl.innerHTML = `Save ${formatMoney(savings)} (${percentage}% off)`;
        savingsInfoEl.classList.remove('hidden');
      }
    } else {
      // Remove sale class to show regular price section
      priceContainer.classList.remove('price--on-sale');

      if (savingsInfoEl) {
        savingsInfoEl.classList.add('hidden');
      }
    }
  }

  function updateAddToCartButton(variant, isMobile = false) {
    const buttonContainer = document.querySelector(isMobile ? '.mobile-add-to-cart-btn' : '#add-to-cart-btn');
    const button = buttonContainer ? buttonContainer.querySelector('button') : null;
    const variantIdInput = document.querySelector(isMobile ? '.mobile-variant-id' : '#variant-id');
    const btnText = button ? button.querySelector('.tertiary-slide-button-text') : null;
    const btnTextHover = button ? button.querySelector('.tertiary-slide-button-text-hover') : null;

    if (!button || !variantIdInput) return;

    // Store the arrow HTML before updating text
    const arrowHTML = btnText ? btnText.querySelector('.tertiary-slide-button-arrow')?.outerHTML || '' : '';
    const arrowHoverHTML = btnTextHover
      ? btnTextHover.querySelector('.tertiary-slide-button-arrow')?.outerHTML || ''
      : '';

    if (!variant || !variant.available) {
      button.disabled = true;
      if (btnText) {
        btnText.innerHTML = (variant ? 'SOLD OUT' : 'UNAVAILABLE') + arrowHTML;
      }
      if (btnTextHover) {
        btnTextHover.innerHTML = (variant ? 'SOLD OUT' : 'UNAVAILABLE') + arrowHoverHTML;
      }
      // Apply sold-out styling using CSS custom properties
      button.style.backgroundColor = 'var(--color-gray-400, #9ca3af)';
      button.style.color = 'var(--color-gray-600, #4b5563)';
      button.style.borderColor = 'var(--color-gray-400, #9ca3af)';
      button.style.cursor = 'not-allowed';
    } else {
      button.disabled = false;
      if (btnText) {
        btnText.innerHTML = 'ADD TO CART' + arrowHTML;
      }
      if (btnTextHover) {
        btnTextHover.innerHTML = 'ADD TO CART' + arrowHoverHTML;
      }
      // Reset to default secondary button styling
      button.style.backgroundColor = '';
      button.style.color = '';
      button.style.borderColor = '';
      button.style.cursor = 'pointer';
      variantIdInput.value = variant.id;
    }
  }

  function updateSizeAvailability() {
    const sizeBtns = document.querySelectorAll('.size-btn');

    sizeBtns.forEach((btn) => {
      const optionValue = btn.getAttribute('data-value');

      let variant;
      if (mainOptionIndex === sizeIndex) {
        variant = findMatchingVariant(selectedColor, optionValue, optionValue);
      } else {
        variant = findMatchingVariant(selectedColor, selectedSize, optionValue);
      }

      // Remove existing unavailable styling and slash
      const existingSlash = btn.querySelector('.slash-unavailable');
      if (existingSlash) existingSlash.remove();

      if (!variant || !variant.available) {
        btn.classList.add('cursor-not-allowed', 'unavailable-size');
        btn.classList.remove('bg-black', 'text-white');
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');

        const slash = document.createElement('span');
        slash.className = 'slash-unavailable';
        btn.appendChild(slash);
      } else {
        btn.classList.remove('cursor-not-allowed', 'unavailable-size');
        btn.disabled = false;
        btn.removeAttribute('aria-disabled');
      }
    });
  }

  function updateVariant() {
    const variant = findMatchingVariant();

    // Update desktop
    updatePriceDisplay(variant, false);
    updateAddToCartButton(variant, false);

    // Update mobile
    updatePriceDisplay(variant, true);
    updateAddToCartButton(variant, true);

    updateSizeAvailability();

    // Update URL with new variant
    if (variant && variant.available) {
      updateURLWithVariant(variant);
    }
  }

  // Event listeners setup
  function setupEventListeners() {
    // Desktop Add to Cart Button Handler
    const desktopAddToCartContainer = document.getElementById('add-to-cart-btn');
    if (desktopAddToCartContainer) {
      const desktopAddToCartBtn = desktopAddToCartContainer.querySelector('button');
      if (desktopAddToCartBtn) {
        desktopAddToCartBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();

          if (this.disabled) return false;

          const variantId = document.getElementById('variant-id')?.value;
          // Find the quantity input that's not inside the mobile section
          const quantityInput = document.querySelector('.desktop-quantity-input');
          const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

          // Update the hidden quantity input in the form
          const hiddenQuantityInput = document.querySelector('#add-to-cart-form input[name="quantity"]');
          if (hiddenQuantityInput) {
            hiddenQuantityInput.value = quantity;
          }

          addToCart(variantId, quantity);
          return false;
        });
      }
    }

    // Mobile Add to Cart Button Handler
    const mobileAddToCartContainer = document.querySelector('.mobile-add-to-cart-btn');
    if (mobileAddToCartContainer) {
      const mobileAddToCartBtn = mobileAddToCartContainer.querySelector('button');
      if (mobileAddToCartBtn) {
        mobileAddToCartBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();

          if (this.disabled) return false;

          const variantId = document.querySelector('.mobile-variant-id')?.value;
          // Find the quantity input that's inside the mobile section
          const quantityInput = document.querySelector('.mobile-quantity-input');
          const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

          // Update the hidden quantity input in the mobile form
          const hiddenQuantityInput = document.querySelector('.mobile-add-to-cart-form input[name="quantity"]');
          if (hiddenQuantityInput) {
            hiddenQuantityInput.value = quantity;
          }

          addToCart(variantId, quantity);
          return false;
        });
      }
    }

    // Mobile sizing items functionality
    const mobileSizingBtns = document.querySelectorAll('.sizing-item-btn-mobile');

    mobileSizingBtns.forEach((btn) => {
      const drawerId = btn.getAttribute('data-mobile-drawer-id');
      const drawer = document.getElementById(drawerId);
      const backdrop = document.getElementById(drawerId.replace('mobile-sizing-drawer-', 'mobile-sizing-backdrop-'));

      if (drawer && backdrop) {
        btn.addEventListener('click', () => {
          drawer.classList.remove('hidden');
          backdrop.classList.remove('hidden');
          setTimeout(() => {
            drawer.classList.add('open');
          }, 20);
          lockBodyScroll();
        });
      }
    });

    // Close buttons for mobile sizing drawers
    const mobileCloseBtns = document.querySelectorAll('.close-mobile-sizing-drawer');

    mobileCloseBtns.forEach((closeBtn) => {
      const drawerId = closeBtn.getAttribute('data-mobile-drawer-id');
      const drawer = document.getElementById(drawerId);
      const backdrop = document.getElementById(drawerId.replace('mobile-sizing-drawer-', 'mobile-sizing-backdrop-'));

      if (drawer && backdrop) {
        const closeMobileDrawer = () => {
          drawer.classList.remove('open');
          backdrop.classList.add('hidden');
          unlockBodyScroll();
          setTimeout(() => {
            drawer.classList.add('hidden');
          }, 300);
        };

        closeBtn.addEventListener('click', closeMobileDrawer);
        backdrop.addEventListener('click', closeMobileDrawer);

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && !drawer.classList.contains('hidden')) {
            closeMobileDrawer();
          }
        });
      }
    });

    // Desktop sizing items functionality
    const sizingBtns = document.querySelectorAll('.sizing-item-btn');

    sizingBtns.forEach((btn) => {
      const drawerId = btn.getAttribute('data-drawer-id');
      const drawer = document.getElementById(drawerId);
      const backdrop = document.getElementById(drawerId.replace('sizing-drawer-', 'sizing-backdrop-'));

      if (drawer && backdrop) {
        btn.addEventListener('click', () => {
          drawer.classList.remove('hidden');
          backdrop.classList.remove('hidden');
          setTimeout(() => {
            drawer.classList.add('open');
          }, 20);
          lockBodyScroll();
        });
      }
    });

    // Close buttons for desktop sizing drawers
    const closeBtns = document.querySelectorAll('.close-sizing-drawer');

    closeBtns.forEach((closeBtn) => {
      const drawerId = closeBtn.getAttribute('data-drawer-id');
      const drawer = document.getElementById(drawerId);
      const backdrop = document.getElementById(drawerId.replace('sizing-drawer-', 'sizing-backdrop-'));

      if (drawer && backdrop) {
        const closeDrawer = () => {
          drawer.classList.remove('open');
          backdrop.classList.add('hidden');
          unlockBodyScroll();
          setTimeout(() => {
            drawer.classList.add('hidden');
          }, 300);
        };

        closeBtn.addEventListener('click', closeDrawer);
        backdrop.addEventListener('click', closeDrawer);

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && !drawer.classList.contains('hidden')) {
            closeDrawer();
          }
        });
      }
    });

    // Gallery functionality
    setupGallery();

    // Tab functionality
    setupTabs();

    // Color swatches
    setupColorSwatches();

    // Size buttons
    setupSizeButtons();

    // Mobile gallery
    setupMobileGallery();
  }

  function setupGallery() {
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    const stripImages = Array.from(document.querySelectorAll('.strip-image-wrapper'));
    let lastScrollActiveIdx = 0;
    let variantGalleryLock = false;

    // Fast scroll logic for desktop gallery
    function updateActiveImageOnScroll() {
      if (window.innerWidth < 1024) return;
      if (variantGalleryLock) return;

      const galleryWrapper = document.querySelector('.gallery-wrapper');
      if (!galleryWrapper) return;

      // Calculate which image should be active based on scroll position
      const scrollTop = galleryWrapper.scrollTop;
      const wrapperHeight = galleryWrapper.clientHeight;
      const scrollHeight = galleryWrapper.scrollHeight;
      const itemHeight = wrapperHeight; // Each image takes full height

      // Calculate active index based on scroll position
      let activeIdx;
      if (scrollTop >= scrollHeight - wrapperHeight - 1) {
        // If we're at or near the bottom, show the last image
        activeIdx = galleryItems.length - 1;
      } else {
        // Normal calculation for other positions
        activeIdx = Math.round(scrollTop / itemHeight);
      }

      const clampedIdx = Math.max(0, Math.min(activeIdx, galleryItems.length - 1));

      if (clampedIdx !== lastScrollActiveIdx) {
        galleryItems.forEach((item, idx) => {
          item.classList.toggle('is-active', idx === clampedIdx);
          if (idx === clampedIdx) {
            item.setAttribute('aria-current', 'true');
          } else {
            item.removeAttribute('aria-current');
          }
        });
        stripImages.forEach((btn, idx) => {
          btn.classList.toggle('active', idx === clampedIdx);
          btn.setAttribute('aria-selected', idx === clampedIdx ? 'true' : 'false');
          btn.setAttribute('tabindex', idx === clampedIdx ? '0' : '-1');
        });
        lastScrollActiveIdx = clampedIdx;
      }
    }

    const galleryWrapper = document.querySelector('.gallery-wrapper');
    if (galleryWrapper && window.innerWidth >= 1024) {
      galleryItems.forEach((item) => {
        item.style.position = 'static';
        item.style.width = '100%';
        item.style.height = '100%';
      });
      galleryWrapper.addEventListener('scroll', updateActiveImageOnScroll, { passive: true });
      galleryWrapper.addEventListener(
        'wheel',
        function (e) {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            // Increase scroll sensitivity for faster scrolling
            const scrollAmount = e.deltaY * 2;
            galleryWrapper.scrollTop += scrollAmount;
            updateActiveImageOnScroll();
            e.preventDefault();
          }
        },
        { passive: false }
      );
      setTimeout(updateActiveImageOnScroll, 100);
    }

    // Thumbnail click: show corresponding image (desktop)
    stripImages.forEach((strip, idx) => {
      strip.addEventListener('click', function () {
        variantGalleryLock = true;
        galleryItems.forEach((item, i) => {
          item.classList.toggle('is-active', i === idx);
          if (i === idx) {
            item.setAttribute('aria-current', 'true');
          } else {
            item.removeAttribute('aria-current');
          }
        });
        stripImages.forEach((btn, i) => {
          btn.classList.toggle('active', i === idx);
          btn.setAttribute('aria-selected', i === idx ? 'true' : 'false');
          btn.setAttribute('tabindex', i === idx ? '0' : '-1');
        });
        lastScrollActiveIdx = idx;
        if (galleryWrapper) {
          // Direct scroll to the target image position
          let targetScrollTop;
          if (idx === galleryItems.length - 1) {
            // For the last image, scroll to the bottom
            targetScrollTop = galleryWrapper.scrollHeight - galleryWrapper.clientHeight;
          } else {
            // For other images, use normal calculation
            targetScrollTop = idx * galleryWrapper.clientHeight;
          }
          galleryWrapper.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
        }
        setTimeout(() => {
          variantGalleryLock = false;
        }, 400);
      });
    });
  }

  function showVariantGalleryImage(variant) {
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    const stripImages = Array.from(document.querySelectorAll('.strip-image-wrapper'));
    const mobileGalleryItems = Array.from(document.querySelectorAll('.mobile-gallery-item'));
    const mobileThumbnails = Array.from(document.querySelectorAll('.thumbnail-item'));
    let variantGalleryLock = false;

    variantGalleryLock = true;
    let found = false;
    galleryItems.forEach((item, idx) => {
      item.style.display = '';
      if (
        variant &&
        variant.featured_media &&
        item.getAttribute('data-media-id') === variant.featured_media.id.toString()
      ) {
        item.classList.add('is-active');
        item.setAttribute('aria-current', 'true');
        stripImages[idx].classList.add('active');
        stripImages[idx].setAttribute('aria-selected', 'true');
        stripImages[idx].setAttribute('tabindex', '0');
        found = true;

        const galleryWrapper = document.querySelector('.gallery-wrapper');
        if (galleryWrapper) {
          const itemRect = item.getBoundingClientRect();
          const wrapperRect = galleryWrapper.getBoundingClientRect();
          const scrollTop =
            galleryWrapper.scrollTop +
            (itemRect.top + itemRect.height / 2) -
            (wrapperRect.top + wrapperRect.height / 2);
          galleryWrapper.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
      } else {
        item.classList.remove('is-active');
        item.removeAttribute('aria-current');
        stripImages[idx].classList.remove('active');
        stripImages[idx].setAttribute('aria-selected', 'false');
        stripImages[idx].setAttribute('tabindex', '-1');
      }
    });

    if (typeof mobileGalleryItems !== 'undefined' && typeof mobileThumbnails !== 'undefined') {
      mobileGalleryItems.forEach((img, idx) => {
        img.style.display = '';
        if (
          variant &&
          variant.featured_media &&
          img.getAttribute('data-media-id') === variant.featured_media.id.toString()
        ) {
          img.classList.add('active');
          img.classList.add('relative');
          img.classList.remove('absolute', 'top-0', 'left-0');
          img.style.opacity = '1';
          img.style.zIndex = '2';
          img.style.pointerEvents = 'auto';
          mobileThumbnails[idx].classList.add('active');
          mobileThumbnails[idx].setAttribute('aria-selected', 'true');
          mobileThumbnails[idx].setAttribute('tabindex', '0');
          mobileThumbnails[idx].style.opacity = '1';

          const mainImages = document.querySelector('.main-images');
          if (mainImages) {
            const imgRect = img.getBoundingClientRect();
            const mainRect = mainImages.getBoundingClientRect();
            mainImages.scrollTop += imgRect.top + imgRect.height / 2 - (mainRect.top + mainRect.height / 2);
          }
        } else {
          img.classList.remove('active');
          img.classList.remove('relative');
          img.classList.add('absolute', 'top-0', 'left-0');
          img.style.opacity = '0';
          img.style.zIndex = '1';
          img.style.pointerEvents = 'none';
          mobileThumbnails[idx].classList.remove('active');
          mobileThumbnails[idx].setAttribute('aria-selected', 'false');
          mobileThumbnails[idx].setAttribute('tabindex', '-1');
          mobileThumbnails[idx].style.opacity = '0.6';
        }
      });
    }

    setTimeout(() => {
      variantGalleryLock = false;
    }, 300);
  }

  function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn, .mobile-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane, .mobile-tab-pane');

    tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        const borderDiv = button.querySelector('.tab-top-bar');

        tabButtons.forEach((btn) => {
          const btnBorderDiv = btn.querySelector('.tab-top-bar');

          btn.classList.remove('active-tab');
          btn.style.color = 'var(--secondary_text)';

          if (btnBorderDiv) {
            btnBorderDiv.style.backgroundColor = 'var(--secondary_text)';
          }
        });

        button.classList.add('active-tab');
        button.style.color = 'var(--text)';

        if (borderDiv) {
          borderDiv.style.backgroundColor = 'var(--text)';
        }
        tabPanes.forEach((pane) => {
          if (pane.getAttribute('data-content') === targetTab) {
            pane.classList.remove('hidden');
            pane.classList.add('block');
          } else {
            pane.classList.add('hidden');
            pane.classList.remove('block');
          }
        });
      });

      const borderDiv = button.querySelector('.tab-top-bar');

      button.addEventListener('mouseenter', () => {
        if (!button.classList.contains('active-tab')) {
          button.style.color = 'var(--text)';
          if (borderDiv) {
            borderDiv.style.backgroundColor = 'var(--text)';
          }
        }
      });

      button.addEventListener('mouseleave', () => {
        if (!button.classList.contains('active-tab')) {
          button.style.color = 'var(--secondary_text)';
          if (borderDiv) {
            borderDiv.style.backgroundColor = 'var(--secondary_text)';
          }
        }
      });
    });
  }

  function setupColorSwatches() {
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const activeColorDisplays = document.querySelectorAll('[data-active-color]');
    let lastSelectedColor = selectedColor || '';

    function updateColorDisplays(color) {
      activeColorDisplays.forEach((display) => {
        display.textContent = color;
      });
    }

    function setActiveSwatch(swatch) {
      const newSelectedColor = swatch.getAttribute('data-option-value');
      colorSwatches.forEach((el) => {
        el.classList.remove('ring-1', 'ring-offset-1', 'ring-black');
        el.setAttribute('aria-checked', 'false');
        el.setAttribute('tabindex', '-1');
      });
      swatch.classList.add('ring-1', 'ring-offset-2', 'ring-black');
      swatch.setAttribute('aria-checked', 'true');
      swatch.setAttribute('tabindex', '0');
      updateColorDisplays(newSelectedColor);
      selectedColor = newSelectedColor;
      lastSelectedColor = newSelectedColor;
      swatch.blur();
      updateVariant();
      const variant = findMatchingVariant();
      showVariantGalleryImage(variant);
    }

    if (colorSwatches.length > 0) {
      colorSwatches.forEach((swatch) => {
        const swatchColor = swatch.getAttribute('data-option-value');

        if (selectedColor && swatchColor === selectedColor) {
          swatch.classList.add('ring-1', 'ring-offset-2', 'ring-black');
          swatch.setAttribute('aria-checked', 'true');
          swatch.setAttribute('tabindex', '0');
          updateColorDisplays(selectedColor);
          lastSelectedColor = selectedColor;
        } else {
          swatch.classList.remove('ring-1', 'ring-offset-2', 'ring-black');
          swatch.setAttribute('aria-checked', 'false');
          swatch.setAttribute('tabindex', '-1');
        }

        swatch.addEventListener('click', () => setActiveSwatch(swatch));
        swatch.addEventListener('mouseenter', () => {
          if (swatchColor) updateColorDisplays(swatchColor);
        });
        swatch.addEventListener('mouseleave', () => {
          if (lastSelectedColor) updateColorDisplays(lastSelectedColor);
        });
      });

      if (!selectedColor) {
        updateColorDisplays('');
      }
    }
  }

  function setupSizeButtons() {
    const sizeButtons = document.querySelectorAll('.size-btn');
    if (sizeButtons.length > 0) {
      sizeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const newSelectedValue = btn.getAttribute('data-value');
          sizeButtons.forEach((b) => {
            b.classList.remove('active', 'bg-black', 'text-white');
          });
          btn.classList.add('active', 'bg-black', 'text-white');
          if (mainOptionIndex === sizeIndex) {
            selectedSize = newSelectedValue;
            selectedMainOption = newSelectedValue;
          } else {
            selectedMainOption = newSelectedValue;
          }
          updateVariant();
        });
      });
      if (selectedMainOption) {
        const selectedBtn = Array.from(sizeButtons).find(
          (btn) => btn.getAttribute('data-value') === selectedMainOption && !btn.disabled
        );
        if (selectedBtn) {
          selectedBtn.classList.add('active', 'bg-black', 'text-white');
        }
      }
    }
  }

  function setupMobileGallery() {
    const mobileGalleryItems = Array.from(document.querySelectorAll('.mobile-gallery-item'));
    const mobileThumbnails = Array.from(document.querySelectorAll('.thumbnail-item'));

    mobileThumbnails.forEach((thumb, idx) => {
      thumb.addEventListener('click', function () {
        mobileThumbnails.forEach((t, i) => {
          t.classList.toggle('active', i === idx);
          t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
          t.setAttribute('tabindex', i === idx ? '0' : '-1');
        });
        mobileGalleryItems.forEach((img, i) => {
          if (i === idx) {
            img.classList.add('active');
            img.classList.add('relative');
            img.classList.remove('absolute', 'top-0', 'left-0');
            img.style.opacity = '1';
            img.style.zIndex = '2';
            img.style.pointerEvents = 'auto';
          } else {
            img.classList.remove('active');
            img.classList.remove('relative');
            img.classList.add('absolute', 'top-0', 'left-0');
            img.style.opacity = '0';
            img.style.zIndex = '1';
            img.style.pointerEvents = 'none';
          }
        });
      });
    });

    function initializeMobileGallery() {
      // Ensure first image is active
      if (mobileGalleryItems.length > 0) {
        mobileGalleryItems.forEach((img, idx) => {
          if (idx === 0) {
            img.classList.add('active');
            img.classList.add('relative');
            img.classList.remove('absolute', 'top-0', 'left-0');
            img.style.opacity = '1';
            img.style.zIndex = '2';
            img.style.pointerEvents = 'auto';
          } else {
            img.classList.remove('active');
            img.classList.remove('relative');
            img.classList.add('absolute', 'top-0', 'left-0');
            img.style.opacity = '0';
            img.style.zIndex = '1';
            img.style.pointerEvents = 'none';
          }
        });
      }

      // Ensure first thumbnail is active
      if (mobileThumbnails.length > 0) {
        mobileThumbnails.forEach((thumb, idx) => {
          if (idx === 0) {
            thumb.classList.add('active');
            thumb.setAttribute('aria-selected', 'true');
            thumb.setAttribute('tabindex', '0');
          } else {
            thumb.classList.remove('active');
            thumb.setAttribute('aria-selected', 'false');
            thumb.setAttribute('tabindex', '-1');
          }
        });
      }
    }

    initializeMobileGallery();
  }

  // Pickup availability fallback
  function initializePickupAvailability() {
    // Find all pickup availability buttons
    const pickupButtons = document.querySelectorAll('#ShowPickupAvailabilityDrawer');
    const pickupDrawer = document.querySelector('pickup-availability-drawer');

    if (pickupButtons.length > 0 && pickupDrawer) {
      pickupButtons.forEach(function (button, index) {
        // Remove any existing listeners to avoid duplicates
        button.removeEventListener('click', handlePickupButtonClick);
        // Add click handler
        button.addEventListener('click', handlePickupButtonClick);

        // Make sure button is visible and clickable
        button.style.pointerEvents = 'auto';
        button.style.cursor = 'pointer';
      });
    } else {
      // Retry after a short delay
      setTimeout(initializePickupAvailability, 200);
    }
  }

  function handlePickupButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const pickupDrawer = document.querySelector('pickup-availability-drawer');
    if (pickupDrawer) {
      pickupDrawer.show(event.target);
    }
  }

  function initializePage() {
    const urlInitialized = initializeVariantFromURL();

    if (!urlInitialized) {
      updateUIForVariant(findMatchingVariant());
    }

    updateVariant();

    const currentVariant = findMatchingVariant();
    if (currentVariant) {
      showVariantGalleryImage(currentVariant);
    }

    // Ensure first size is selected if no size is currently selected
    setTimeout(() => {
      // Check both desktop and mobile size buttons
      const desktopSizeButtons = document.querySelectorAll('.size-btn[data-desktop]');
      const mobileSizeButtons = document.querySelectorAll('.size-btn[data-mobile]');

      // Process desktop buttons
      if (desktopSizeButtons.length > 0) {
        const hasSelectedDesktopSize = Array.from(desktopSizeButtons).some(
          (btn) => btn.classList.contains('active') || btn.classList.contains('bg-black')
        );

        if (!hasSelectedDesktopSize) {
          let firstAvailableBtn = Array.from(desktopSizeButtons).find(
            (btn) => btn.getAttribute('data-default-selected') === 'true' && !btn.disabled
          );

          if (!firstAvailableBtn) {
            firstAvailableBtn = Array.from(desktopSizeButtons).find((btn) => !btn.disabled);
          }

          if (firstAvailableBtn) {
            const initialValue = firstAvailableBtn.getAttribute('data-value');
            if (mainOptionIndex === sizeIndex) {
              selectedSize = initialValue;
              selectedMainOption = initialValue;
            } else {
              selectedMainOption = initialValue;
            }
            firstAvailableBtn.classList.add('active', 'bg-black', 'text-white');
            updateVariant();
          }
        }
      }

      // Process mobile buttons
      if (mobileSizeButtons.length > 0) {
        const hasSelectedMobileSize = Array.from(mobileSizeButtons).some(
          (btn) => btn.classList.contains('active') || btn.classList.contains('bg-black')
        );

        if (!hasSelectedMobileSize) {
          let firstAvailableBtn = Array.from(mobileSizeButtons).find(
            (btn) => btn.getAttribute('data-default-selected') === 'true' && !btn.disabled
          );

          if (!firstAvailableBtn) {
            firstAvailableBtn = Array.from(mobileSizeButtons).find((btn) => !btn.disabled);
          }

          if (firstAvailableBtn) {
            const initialValue = firstAvailableBtn.getAttribute('data-value');
            if (mainOptionIndex === sizeIndex) {
              selectedSize = initialValue;
              selectedMainOption = initialValue;
            } else {
              selectedMainOption = initialValue;
            }
            firstAvailableBtn.classList.add('active', 'bg-black', 'text-white');
            updateVariant();
          }
        }
      }
    }, 100);

    window.addEventListener('popstate', handlePopState);
  }

  // Initialize everything
  setupEventListeners();

  // Initialize pickup availability
  initializePickupAvailability();
  setTimeout(initializePickupAvailability, 100);
  setTimeout(initializePickupAvailability, 500);

  initializePage();
});

// Export functions for global access if needed
window.MainProductJS = {
  formatMoney: function (cents) {
    return formatMoney(cents);
  },
  updateCartCount: function () {
    return updateCartCount();
  },
};
