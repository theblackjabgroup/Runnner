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
    // Initialize product current index for each product
    const productImages = container.querySelectorAll('.product-image');
    productImages.forEach((img) => {
      const productId = img.getAttribute('data-product-id');
      if (productId && !productCurrentIndex[productId]) {
        productCurrentIndex[productId] = 0;
      }
    });

    // Image hover functionality - improved to work with navigation arrows
    const imageContainers = container.querySelectorAll('.product-image-wrapper'); // Updated selector
    imageContainers.forEach((wrapper) => {
      const images = Array.from(wrapper.querySelectorAll('.product-image'));
      const productId = images[0]?.getAttribute('data-product-id');

      if (!productId || images.length <= 1) return;

      // Track if mouse is over the container
      let isHovering = false;

      wrapper.addEventListener('mouseenter', (e) => {
        // if (e.target.closest('.add-to-cart-btn, .notify-me-btn')) // Prevent hover effect on buttons
        isHovering = true;
        if (images.length >= 2 && productCurrentIndex[productId] === 0) {
          updateProductImage(productId, 1, images);
        }
      });

      wrapper.addEventListener('mouseleave', () => {
        if (isHovering && productCurrentIndex[productId] === 1) {
          updateProductImage(productId, 0, images);
        }
        isHovering = false;
      });

      // Helper function to update product image
      function updateProductImage(productId, newIndex, imageElements) {
        // Save the new index
        productCurrentIndex[productId] = newIndex;

        // Update the display
        imageElements.forEach((img, i) => {
          if (i === newIndex) {
            img.classList.remove('hidden');
            img.classList.add('active');
          } else {
            img.classList.add('hidden');
            img.classList.remove('active');
          }
        });
      }
    });

    // Image navigation arrows - improved implementation
    const prevButtons = container.querySelectorAll('.image-nav-prev');
    const nextButtons = container.querySelectorAll('.image-nav-next');

    function navigateImage(productId, direction, event) {
      // Stop event propagation to prevent conflicts with other handlers
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      const imageContainer = container.querySelector(
        `.product-images-container:has(.product-image[data-product-id="${productId}"])`
      );
      if (!imageContainer) return;

      const images = Array.from(imageContainer.querySelectorAll(`.product-image[data-product-id="${productId}"]`));
      if (images.length <= 1) return;

      // Calculate new index
      const currentIndex = productCurrentIndex[productId] || 0;
      const newIndex =
        direction === 'next' ? (currentIndex + 1) % images.length : (currentIndex - 1 + images.length) % images.length;

      // Update display
      images.forEach((img, i) => {
        if (i === newIndex) {
          img.classList.remove('hidden');
          img.classList.add('active');
        } else {
          img.classList.add('hidden');
          img.classList.remove('active');
        }
      });

      // Update stored index
      productCurrentIndex[productId] = newIndex;
    }

    prevButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const productId = button.getAttribute('data-product-id');
        navigateImage(productId, 'prev', e);
      });
    });

    nextButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const productId = button.getAttribute('data-product-id');
        navigateImage(productId, 'next', e);
      });
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

  collectionButtons.forEach((button) => {
    // Handle click
    button.addEventListener('click', () => {
      const collectionId = button.getAttribute('data-collection');

      collectionButtons.forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
        // Remove invert from all arrows
        const img = btn.querySelector('.collection-arrow-img');
        if (img) img.style.filter = '';
      });
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');

      // Invert arrow color for the active button
      const activeImg = button.querySelector('.collection-arrow-img');
      if (activeImg) {
        // Use setTimeout to ensure the class is applied before the filter
        setTimeout(() => {
          activeImg.style.filter = 'invert(1)';
        }, 0);
      }

      collectionContainers.forEach((container) => {
        if (container.getAttribute('data-collection-id') === collectionId) {
          container.classList.remove('hidden');
          // Initialize functionality for newly shown collection
          initializeCollection(container);
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

  // Set initial invert for the first active button
  const firstActiveBtn = document.querySelector('.collection-btn.active');
  if (firstActiveBtn) {
    const img = firstActiveBtn.querySelector('.collection-arrow-img');
    if (img) img.style.filter = 'invert(1)';
  }

  // Update cart count on page load to ensure synchronization
  updateCartCount();

  // Initialize functionality for initially visible collection
  const initialContainer = document.querySelector('.collection-products-container:not(.hidden)');
  if (initialContainer) {
    initializeCollection(initialContainer);
  }

  // Letter-by-letter heading animation for featured collection
  (function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const heading = document.querySelector('.featured-collection-main-heading.letter-animation');
    if (!heading) return;

    function animateHeading() {
      const text = heading.textContent.trim();
      heading.textContent = '';
      heading.classList.add('letter-animation-container');
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
