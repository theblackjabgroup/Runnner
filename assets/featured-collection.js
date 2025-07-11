document.addEventListener('DOMContentLoaded', function () {
  let productCurrentIndex = {};

  // Add to cart functionality
  function addToCart(variantId, quantity) {
    const formData = {
      items: [
        {
          id: variantId,
          quantity: quantity,
        },
      ],
    };

    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        // Show success notification
        const notification = document.createElement('div');
        notification.className =
          'fixed bottom-4 right-4 bg-black text-white px-6 py-3 rounded-lg z-50 opacity-0 transition-opacity duration-300';
        notification.textContent = 'Added to cart';
        document.body.appendChild(notification);

        setTimeout(() => (notification.style.opacity = '1'), 10);
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, 2000);

        // Update cart count immediately
        updateCartCount();

        // Open cart drawer if it exists
        const cartDrawerTrigger =
          document.querySelector('[data-cart-drawer-trigger]') ||
          document.querySelector('.cart-drawer-trigger') ||
          document.querySelector('#cart-icon-bubble');
        if (cartDrawerTrigger) {
          cartDrawerTrigger.click();
        }
      })
      .catch((error) => {
        console.error('Error:', error);
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

  // Function to update cart count in all possible locations
  function updateCartCount() {
    fetch('/cart.js')
      .then((res) => res.json())
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

    const imageContainers = container.querySelectorAll('.product-image-wrapper');

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
        const wrapper = button.closest('.product-image-wrapper');
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
        const wrapper = button.closest('.product-image-wrapper');
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
    const slider = container.querySelector('.product-slider');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
      if (e.target.closest('.image-nav-arrow') || e.target.closest('.size-option-btn')) return;
      isDown = true;
      slider.classList.add('cursor-grabbing');
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
      isDown = false;
      slider.classList.remove('cursor-grabbing');
    });

    slider.addEventListener('mouseup', () => {
      isDown = false;
      slider.classList.remove('cursor-grabbing');
    });

    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      slider.scrollLeft = scrollLeft - walk;
    });

    // Initialize variant hover functionality
    const productCards = container.querySelectorAll('.product-card');
    productCards.forEach((card) => {
      const cartContainer = card.querySelector('.product-cart-container');
      const sizeContainer = card.querySelector('.size-variants-container');

      if (cartContainer && sizeContainer) {
        cartContainer.addEventListener('mouseenter', () => {
          sizeContainer.style.opacity = '1';
          sizeContainer.style.visibility = 'visible';
        });

        cartContainer.addEventListener('mouseleave', () => {
          sizeContainer.style.opacity = '0';
          sizeContainer.style.visibility = 'hidden';
        });
      }
    });

    // Initialize size buttons and waitlist functionality
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
