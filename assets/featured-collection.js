document.addEventListener('DOMContentLoaded', function () {
  let productCurrentIndex = {};

  // Add to cart functionality
  function addToCart(variantId, quantity) {
    console.log('Adding to cart:', variantId, quantity); // Debug log

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
        console.log('Response status:', response.status); // Debug log
        console.log('Response headers:', response.headers); // Debug log

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Response is not JSON, treating as success');
          // If it's not JSON but status is OK, treat as success
          return { success: true };
        }

        return response.json();
      })
      .then((data) => {
        console.log('Cart add success:', data); // Debug log

        // Show success notification
        const notification = document.createElement('div');
        notification.className =
          'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg z-50 opacity-0 transition-opacity duration-300';
        notification.textContent = 'Added to cart successfully!';
        document.body.appendChild(notification);

        setTimeout(() => (notification.style.opacity = '1'), 10);
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, 2000);

        // Update cart count immediately
        updateCartCount();

        // Immediately refresh cart drawer and open it
        refreshCartDrawer()
          .then(() => {
            openCartDrawer();
          })
          .catch((error) => {
            console.error('Cart drawer refresh failed:', error);
            // Fallback: just update count and open
            updateCartCount();
            openCartDrawer();
          });
      })
      .catch((error) => {
        console.error('Error adding to cart:', error);
        console.log('Error type:', error.name, 'Error message:', error.message);

        // Check if the error is likely a parsing issue rather than an actual cart error
        if (error.message.includes('Unexpected') || error.message.includes('JSON')) {
          console.log('Likely JSON parsing error, but cart add may have succeeded');

          // Still try to update cart count as the add might have worked
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

        // Still try to update cart count even if there was an error
        // because the item might have been added successfully
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
      });
  }

  // Function to refresh cart drawer content
  function refreshCartDrawer() {
    return fetch(`${window.location.pathname}?section_id=cart-drawer`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((responseText) => {
        console.log('Cart drawer refreshed');

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
      })
      .catch((error) => {
        console.error('Error refreshing cart drawer:', error);
        return updateCartCount();
      });
  }

  // Function to re-initialize cart drawer event listeners after content refresh
  function initializeCartDrawerEventListeners() {
    console.log('Re-initializing cart drawer event listeners');

    // Re-initialize subscription form functionality
    const subscribeRadio = document.getElementById('subscribe-radio');
    const regularRadio = document.querySelector('input[name="pricing"][value="regular"]');
    const subscribeForm = document.getElementById('subscribe-form');
    const subscribeBtn = document.getElementById('subscribe-btn');
    const subscribeEmail = document.getElementById('subscribe-email');

    function toggleSubscribeForm() {
      if (subscribeRadio && subscribeRadio.checked) {
        if (subscribeForm) subscribeForm.style.display = 'block';
      } else {
        if (subscribeForm) subscribeForm.style.display = 'none';
      }
    }

    if (subscribeRadio && subscribeForm) {
      subscribeRadio.addEventListener('change', toggleSubscribeForm);
      if (regularRadio) {
        regularRadio.addEventListener('change', toggleSubscribeForm);
      }
      // Set initial state
      toggleSubscribeForm();
    }

    if (subscribeBtn && subscribeEmail) {
      subscribeBtn.addEventListener('click', function () {
        const email = subscribeEmail.value.trim();
        if (!email) {
          alert('Please enter a valid email address.');
          return;
        }
        // Ajax POST to Shopify newsletter endpoint
        fetch('/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'form_type=newsletter&contact[email]=' + encodeURIComponent(email) + '&utf8=✓',
        })
          .then(function (response) {
            if (response.ok) {
              alert('Thank you for subscribing!');
              subscribeEmail.value = '';
            } else {
              alert('There was a problem subscribing. Please try again.');
            }
          })
          .catch(function () {
            alert('There was a problem subscribing. Please try again.');
          });
      });
    }

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

  // Helper function for quantity change handling
  function handleQuantityChange(event) {
    const cartItems = event.target.closest('cart-items') || event.target.closest('cart-drawer-items');
    if (cartItems && cartItems.validateQuantity) {
      cartItems.validateQuantity(event);
    }
  }

  // Function to open cart drawer
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

  // Function to update cart count in all possible locations
  function updateCartCount() {
    fetch(window.routes?.cart_url || '/cart.js')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((cart) => {
        console.log('Cart updated:', cart); // Debug log

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

              // Handle potential span inside cart bubble
              if (el.querySelector('span')) {
                el.querySelector('span').textContent = cart.item_count;
              }
            });
          }
        });

        // If there's a cart icon with count displayed as attribute
        const cartIcons = document.querySelectorAll('.cart-icon, [data-cart-icon]');
        cartIcons.forEach((icon) => {
          if (icon) {
            icon.setAttribute('data-count', cart.item_count);
          }
        });

        // Dispatch a custom event that theme might be listening for
        document.dispatchEvent(
          new CustomEvent('cart:updated', {
            detail: { cart: cart },
          })
        );
      })
      .catch((error) => {
        console.error('Error updating cart count:', error);
      });
  }

  function initializeCollection(container) {
    // Check if already initialized to prevent duplicates
    if (container.hasAttribute('data-initialized')) {
      return;
    }
    container.setAttribute('data-initialized', 'true');

    // Initialize product current index for each product
    const productImages = container.querySelectorAll('.product-image');
    productImages.forEach((img) => {
      const productId = img.getAttribute('data-product-id');
      if (productId && !productCurrentIndex[productId]) {
        productCurrentIndex[productId] = 0;
      }
    });

    const imageContainers = container.querySelectorAll('.featured-collection-product-image-wrapper');

    imageContainers.forEach((wrapper) => {
      const images = Array.from(wrapper.querySelectorAll('.product-image'));
      const productId = images[0]?.getAttribute('data-product-id');
      if (!productId || images.length <= 1) return;

      // Initialize index and show first image
      if (typeof productCurrentIndex[productId] === 'undefined') {
        productCurrentIndex[productId] = 0;
        images[0].classList.add('active');
      }

      // Remove existing event listeners to prevent duplicates
      wrapper.removeEventListener('mouseenter', wrapper._mouseEnterHandler);
      wrapper.removeEventListener('mouseleave', wrapper._mouseLeaveHandler);

      // Create new handlers and store references
      wrapper._mouseEnterHandler = () => swapImage(1);
      wrapper._mouseLeaveHandler = () => swapImage(0);

      wrapper.addEventListener('mouseenter', wrapper._mouseEnterHandler);
      wrapper.addEventListener('mouseleave', wrapper._mouseLeaveHandler);

      function swapImage(targetIndex) {
        const currentIndex = productCurrentIndex[productId];
        if (currentIndex === targetIndex) return;

        // Crossfade: remove active from current and add to target simultaneously
        images[currentIndex].classList.remove('active');
        images[targetIndex].classList.add('active');
        productCurrentIndex[productId] = targetIndex;
      }
    });

    // Image navigation arrows - remove existing listeners first
    const prevButtons = container.querySelectorAll('.image-nav-prev');
    const nextButtons = container.querySelectorAll('.image-nav-next');

    // Clean up existing listeners
    prevButtons.forEach((button) => {
      if (button._clickHandler) {
        button.removeEventListener('click', button._clickHandler);
      }
      // Remove hover handlers if present
      if (button._mouseenterHandler) {
        button.removeEventListener('mouseenter', button._mouseenterHandler);
      }
      if (button._mouseleaveHandler) {
        button.removeEventListener('mouseleave', button._mouseleaveHandler);
      }
    });
    nextButtons.forEach((button) => {
      if (button._clickHandler) {
        button.removeEventListener('click', button._clickHandler);
      }
      if (button._mouseenterHandler) {
        button.removeEventListener('mouseenter', button._mouseenterHandler);
      }
      if (button._mouseleaveHandler) {
        button.removeEventListener('mouseleave', button._mouseleaveHandler);
      }
    });

    prevButtons.forEach((button) => {
      button._clickHandler = (e) => {
        e.preventDefault();
        const productId = button.getAttribute('data-product-id');
        const wrapper = button.closest('.featured-collection-product-image-wrapper');
        const images = Array.from(wrapper.querySelectorAll('.product-image'));
        if (images.length <= 1) return;
        let currentIndex = images.findIndex((img) => img.classList.contains('active'));
        let prevIndex = (currentIndex - 1 + images.length) % images.length;
        images[currentIndex].classList.remove('active');
        images[prevIndex].classList.add('active');
        productCurrentIndex[productId] = prevIndex;
      };
      button.addEventListener('click', button._clickHandler);
    });

    nextButtons.forEach((button) => {
      button._clickHandler = (e) => {
        e.preventDefault();
        const productId = button.getAttribute('data-product-id');
        const wrapper = button.closest('.featured-collection-product-image-wrapper');
        const images = Array.from(wrapper.querySelectorAll('.product-image'));
        if (images.length <= 1) return;
        let currentIndex = images.findIndex((img) => img.classList.contains('active'));
        let nextIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.remove('active');
        images[nextIndex].classList.add('active');
        productCurrentIndex[productId] = nextIndex;
      };
      button.addEventListener('click', button._clickHandler);
    });

    // Slider drag functionality
    const slider = container.querySelector('.featured-collection-product-slider');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
      if (e.target.closest('.image-nav-arrow') || e.target.closest('.size-option-btn')) return;
      isDown = true;
      slider.classList.add('featured-collection-cursor-grabbing');
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
      isDown = false;
      slider.classList.remove('featured-collection-cursor-grabbing');
    });

    slider.addEventListener('mouseup', () => {
      isDown = false;
      slider.classList.remove('featured-collection-cursor-grabbing');
    });

    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      slider.scrollLeft = scrollLeft - walk;
    });

    // Initialize variant hover functionality
    const productCards = container.querySelectorAll('.featured-collection-product-card');
    productCards.forEach((card) => {
      const imageWrapper = card.querySelector('.featured-collection-product-image-wrapper');
      const cartContainer = card.querySelector('.product-cart-container');
      const sizeContainer = card.querySelector('.size-variants-container');
      const addToCartBtn = card.querySelector('.add-to-cart-btn');
      const sizeButtons = card.querySelectorAll('.size-option-btn');

      if (imageWrapper && cartContainer) {
        // Remove any existing event listeners
        imageWrapper.removeEventListener('mouseenter', imageWrapper._mouseEnterHandler);
        imageWrapper.removeEventListener('mouseleave', imageWrapper._mouseLeaveHandler);
        imageWrapper.removeEventListener('touchstart', imageWrapper._touchStartHandler);
        cartContainer.removeEventListener('mouseenter', cartContainer._mouseEnterHandler);
        cartContainer.removeEventListener('mouseleave', cartContainer._mouseLeaveHandler);
        cartContainer.removeEventListener('touchstart', cartContainer._touchStartHandler);

        // Stage 1: Image hover shows add to cart button
        imageWrapper._mouseEnterHandler = () => {
          // Just show the add to cart button, not the sizes yet
          cartContainer.classList.add('show-button');
        };

        imageWrapper._mouseLeaveHandler = () => {
          // Hide everything when leaving the image
          cartContainer.classList.remove('show-button');
          if (sizeContainer) {
            sizeContainer.classList.remove('active');
            sizeButtons.forEach((btn) => {
              btn.classList.remove('size-animate');
            });
          }
        };

        // Stage 2: Add to cart button hover shows size options (if product has variants)
        if (addToCartBtn && sizeContainer && addToCartBtn.dataset.hasVariants === 'true') {
          // Ensure size buttons start hidden
          sizeButtons.forEach((btn) => {
            btn.classList.remove('size-animate');
            btn.style.opacity = '0';
            btn.style.visibility = 'hidden';
            btn.style.transform = 'translateY(10px)';
          });

          addToCartBtn._mouseEnterHandler = (e) => {
            e.stopPropagation();
            sizeContainer.classList.add('active');

            // Animate size buttons with staggered delay (slower)
            sizeButtons.forEach((btn, index) => {
              btn.style.setProperty('--animation-order', index);
              setTimeout(() => {
                btn.classList.add('size-animate');
              }, index * 100); // 100ms delay between each button
            });
          };

          addToCartBtn._mouseLeaveHandler = (e) => {
            e.stopPropagation();
            // Check if we're moving to the size container
            const relatedTarget = e.relatedTarget;
            if (!sizeContainer.contains(relatedTarget)) {
              sizeContainer.classList.remove('active');
              sizeButtons.forEach((btn) => {
                btn.classList.remove('size-animate');
                btn.style.opacity = '0';
                btn.style.visibility = 'hidden';
                btn.style.transform = 'translateY(10px)';
              });
            }
          };

          // Keep size container active when hovering over it
          sizeContainer._mouseEnterHandler = () => {
            sizeContainer.classList.add('active');
          };

          sizeContainer._mouseLeaveHandler = (e) => {
            const relatedTarget = e.relatedTarget;
            if (!addToCartBtn.contains(relatedTarget) && !sizeContainer.contains(relatedTarget)) {
              sizeContainer.classList.remove('active');
              sizeButtons.forEach((btn) => {
                btn.classList.remove('size-animate');
                btn.style.opacity = '0';
                btn.style.visibility = 'hidden';
                btn.style.transform = 'translateY(10px)';
              });
            }
          };
          addToCartBtn.addEventListener('mouseenter', addToCartBtn._mouseEnterHandler);
          addToCartBtn.addEventListener('mouseleave', addToCartBtn._mouseLeaveHandler);
          sizeContainer.addEventListener('mouseenter', sizeContainer._mouseEnterHandler);
          sizeContainer.addEventListener('mouseleave', sizeContainer._mouseLeaveHandler);
        }

        // Touch handler for mobile devices
        imageWrapper._touchStartHandler = (e) => {
          e.preventDefault();
          if (cartContainer.classList.contains('show-button')) {
            imageWrapper._mouseLeaveHandler();
          } else {
            imageWrapper._mouseEnterHandler();
          }
        };

        imageWrapper.addEventListener('mouseenter', imageWrapper._mouseEnterHandler);
        imageWrapper.addEventListener('mouseleave', imageWrapper._mouseLeaveHandler);

        // Add touch support for mobile
        imageWrapper.addEventListener('touchstart', imageWrapper._touchStartHandler, { passive: false });
      }
    }); // Initialize size buttons and waitlist functionality
    const sizeButtons = container.querySelectorAll('.size-option-btn');
    sizeButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (button.hasAttribute('data-waitlist')) {
          openWaitlistModal(button.getAttribute('data-product-title'), button.getAttribute('data-variant-size'));
        } else {
          const variantId = button.getAttribute('data-variant-id');
          if (variantId) {
            addToCart(variantId, 1);
          }
        }
      });
    });

    // Direct add to cart buttons (non-size variant products)
    const addToCartButtons = container.querySelectorAll('.add-to-cart-btn[data-has-variants="false"]');
    addToCartButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const variantId = button.getAttribute('data-variant-id');
        if (variantId) {
          addToCart(variantId, 1);
        }
      });
    });

    // Initialize notify me buttons
    const notifyButtons = container.querySelectorAll('.notify-me-btn');
    notifyButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openWaitlistModal(button.getAttribute('data-product-title'), null);
      });
    });
  }

  // Waitlist Modal Functions
  const waitlistModal = document.getElementById('waitlist-modal-overlay');
  const closeModalBtn = document.getElementById('close-waitlist-modal');
  const waitlistEmail = document.getElementById('waitlist-email');
  const getNotifiedBtn = document.getElementById('get-notified-btn');

  function openWaitlistModal(productTitle, variantSize) {
    const titleElement = document.getElementById('waitlist-product-title');
    const variantElement = document.getElementById('waitlist-product-variant');

    if (titleElement) titleElement.textContent = productTitle || 'Product';

    if (variantElement) {
      if (variantSize) {
        variantElement.textContent = `Size: ${variantSize}`;
        variantElement.style.display = 'block';
      } else {
        variantElement.style.display = 'none';
      }
    }

    waitlistModal.classList.remove('hidden');
    waitlistModal.style.display = 'flex';

    // Reset form
    if (waitlistEmail) waitlistEmail.value = '';
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      waitlistModal.classList.add('hidden');
      setTimeout(() => {
        waitlistModal.style.display = 'none';
      }, 300);
    });
  }

  if (waitlistModal) {
    waitlistModal.addEventListener('click', (e) => {
      if (e.target === waitlistModal) {
        closeModalBtn.click();
      }
    });
  }

  if (getNotifiedBtn) {
    getNotifiedBtn.addEventListener('click', () => {
      const email = waitlistEmail.value.trim();
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        waitlistEmail.style.borderColor = 'red';
        return;
      }

      // Reset validation
      waitlistEmail.style.borderColor = '';
      getNotifiedBtn.textContent = 'Submitting...';
      getNotifiedBtn.disabled = true;

      // Here you would typically make an API call to your waitlist service
      setTimeout(() => {
        getNotifiedBtn.textContent = 'Thank you!';
        setTimeout(() => {
          closeModalBtn.click();
          setTimeout(() => {
            getNotifiedBtn.textContent = 'GET NOTIFIED';
            getNotifiedBtn.disabled = false;
          }, 300);
        }, 1500);
      }, 1000);
    });
  }

  // Collection switching functionality
  const collectionButtons = document.querySelectorAll('.collection-btn');
  const collectionContainers = document.querySelectorAll('.collection-products-container');

  // Initialize all collections once on page load
  collectionContainers.forEach((container) => {
    initializeCollection(container);
  });

  collectionButtons.forEach((button) => {
    // Handle click
    button.addEventListener('click', () => {
      const collectionId = button.getAttribute('data-collection');

      // Reset all buttons
      collectionButtons.forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
        const img = btn.querySelector('.collection-arrow-img');
        if (img) img.style.filter = '';
      });

      // Activate all buttons that point to the same collection
      collectionButtons.forEach((btn) => {
        if (btn.getAttribute('data-collection') === collectionId) {
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          const activeImg = btn.querySelector('.collection-arrow-img');
          if (activeImg) {
            setTimeout(() => {
              activeImg.style.filter = 'invert(1)';
            }, 0);
          }
        }
      });

      // Switch collection containers - show the one matching the collection ID
      collectionContainers.forEach((container) => {
        if (container.getAttribute('data-collection-id') === collectionId) {
          container.classList.remove('hidden');
        } else {
          container.classList.add('hidden');
        }
      });
    });

    // Handle hover
    button.addEventListener('mouseenter', () => {
      const img = button.querySelector('.collection-arrow-img');
      if (img) img.style.filter = 'invert(1)';
    });
    button.addEventListener('mouseleave', () => {
      // Only remove invert if not active
      if (!button.classList.contains('active')) {
        const img = button.querySelector('.collection-arrow-img');
        if (img) img.style.filter = '';
      }
    });
  });

  // Set initial invert for all active buttons (those pointing to first collection)
  const firstButton = collectionButtons[0];
  if (firstButton) {
    const firstCollection = firstButton.getAttribute('data-collection');
    collectionButtons.forEach((btn) => {
      if (btn.getAttribute('data-collection') === firstCollection) {
        btn.classList.add('active');
        const img = btn.querySelector('.collection-arrow-img');
        if (img) img.style.filter = 'invert(1)';
      }
    });
  }

  // Update cart count on page load to ensure synchronization
  updateCartCount();
  // Remove the selective initialization since we now initialize all collections
  // const initialContainer = document.querySelector('.collection-products-container:not(.hidden)');
  // if (initialContainer) {
  //   initializeCollection(initialContainer);
  // }

  // Letter-by-letter heading animation for featured collection
  (function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const heading = document.querySelector('.featured-collection-main-heading.fc-letter-animation');
    if (!heading) return; // Exit if animation class is not present (toggle is off)

    function animateHeading() {
      const text = heading.textContent.trim();
      heading.textContent = '';
      heading.classList.add('fc-letter-animation-container');
      heading.setAttribute('aria-label', text);

      // Animate from left to right (starting from first letter)
      for (let i = 0; i < text.length; i++) {
        const letterSpan = document.createElement('span');
        letterSpan.classList.add('animated-letter');
        letterSpan.textContent = text[i] === ' ' ? '\u00A0' : text[i];
        letterSpan.setAttribute('aria-hidden', 'true');
        // Delay so that leftmost letter appears first
        letterSpan.style.animation = `letterAppear 1s forwards`;
        letterSpan.style.animationDelay = `${i * 0.07}s`;
        heading.appendChild(letterSpan);
      }
    }

    if (prefersReducedMotion) {
      heading.style.opacity = '1';
    } else {
      // Animate when heading enters viewport
      const observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateHeading();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(heading);
    }
  })();
});
