// Product Card JavaScript Functionality
// This file handles all the interactive functionality for the new product card snippet

class ProductCard {
  constructor(cardElement) {
    this.card = cardElement;
    this.productId = cardElement.getAttribute('data-product-id');
    this.currentImageIndex = 0;
    this.init();
  }

  init() {
    this.initImageSwapping();
    this.initImageNavigation();
    this.initHoverEffects();
    this.initCartFunctionality();
    this.initSizeButtons();
  }

  initImageSwapping() {
    const wrapper = this.card.querySelector('.new-product-image-wrapper');
    const images = Array.from(this.card.querySelectorAll('.new-product-image'));

    if (!wrapper || images.length <= 1) return;

    // Initialize first image as active
    images[0].classList.add('active');

    const swapImage = (targetIndex) => {
      if (this.currentImageIndex === targetIndex) return;

      images[this.currentImageIndex].classList.remove('active');
      images[targetIndex].classList.add('active');
      this.currentImageIndex = targetIndex;
    };

    // Hover to swap between first and second image
    wrapper.addEventListener('mouseenter', () => swapImage(1));
    wrapper.addEventListener('mouseleave', () => swapImage(0));
  }

  initImageNavigation() {
    const wrapper = this.card.querySelector('.new-product-image-wrapper');
    const images = Array.from(this.card.querySelectorAll('.new-product-image'));
    const prevButton = this.card.querySelector('.new-image-nav-prev');
    const nextButton = this.card.querySelector('.new-image-nav-next');

    if (!wrapper || images.length <= 1 || !prevButton || !nextButton) return;

    prevButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentIndex = images.findIndex((img) => img.classList.contains('active'));
      const prevIndex = (currentIndex - 1 + images.length) % images.length;

      images[currentIndex].classList.remove('active');
      images[prevIndex].classList.add('active');
      this.currentImageIndex = prevIndex;
    });

    nextButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentIndex = images.findIndex((img) => img.classList.contains('active'));
      const nextIndex = (currentIndex + 1) % images.length;

      images[currentIndex].classList.remove('active');
      images[nextIndex].classList.add('active');
      this.currentImageIndex = nextIndex;
    });
  }

  initHoverEffects() {
    const imageWrapper = this.card.querySelector('.new-product-image-wrapper');
    const cartContainer = this.card.querySelector('.new-product-cart-container');
    const sizeContainer = this.card.querySelector('.new-size-variants-container');
    const addToCartBtn = this.card.querySelector('.new-add-to-cart-btn');
    const sizeButtons = this.card.querySelectorAll('.new-size-option-btn');

    if (!imageWrapper || !cartContainer) return;

    // Stage 1: Image hover shows add to cart button
    imageWrapper.addEventListener('mouseenter', () => {
      cartContainer.classList.add('show-button');
    });

    imageWrapper.addEventListener('mouseleave', () => {
      cartContainer.classList.remove('show-button');
      if (sizeContainer) {
        sizeContainer.classList.remove('active');
        sizeButtons.forEach((btn) => {
          btn.classList.remove('size-animate');
        });
      }
    });

    // Stage 2: Add to cart button hover shows size options (if product has variants)
    if (addToCartBtn && sizeContainer && addToCartBtn.dataset.hasVariants === 'true') {
      // Ensure size buttons start hidden
      sizeButtons.forEach((btn) => {
        btn.classList.remove('size-animate');
      });

      addToCartBtn.addEventListener('mouseenter', () => {
        sizeContainer.classList.add('active');
        sizeButtons.forEach((btn, index) => {
          setTimeout(() => {
            btn.classList.add('size-animate');
          }, index * 50);
        });
      });

      addToCartBtn.addEventListener('mouseleave', (e) => {
        if (!e.relatedTarget || !sizeContainer.contains(e.relatedTarget)) {
          sizeContainer.classList.remove('active');
          sizeButtons.forEach((btn) => {
            btn.classList.remove('size-animate');
          });
        }
      });

      // Keep size container active when hovering over it
      sizeContainer.addEventListener('mouseenter', () => {
        sizeContainer.classList.add('active');
      });

      sizeContainer.addEventListener('mouseleave', (e) => {
        if (!e.relatedTarget || !addToCartBtn.contains(e.relatedTarget)) {
          sizeContainer.classList.remove('active');
          sizeButtons.forEach((btn) => {
            btn.classList.remove('size-animate');
          });
        }
      });
    }

    // Touch handler for mobile devices - DISABLED to allow scrolling
    // Since hover effects are disabled on mobile via CSS, we don't need this touch handler
    // Removing this allows natural scrolling behavior on mobile devices

    // Original code disabled:
    // imageWrapper.addEventListener(
    //   'touchstart',
    //   (e) => {
    //     e.preventDefault();  // This was blocking scrolling!
    //     ...
    //   },
    //   { passive: false }
    // );
  }

  initCartFunctionality() {
    // Direct add to cart buttons (non-variant products)
    const addToCartButtons = this.card.querySelectorAll('.new-add-to-cart-btn[data-has-variants="false"]');
    addToCartButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const variantId = button.getAttribute('data-variant-id');
        if (variantId) {
          this.addToCart(variantId, 1);
        }
      });
    });

    // Notify me buttons - disabled popup functionality
    const notifyButtons = this.card.querySelectorAll('.new-notify-me-btn');
    notifyButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Popup disabled - no action taken
      });
    });
  }

  initSizeButtons() {
    const sizeButtons = this.card.querySelectorAll('.new-size-option-btn');
    sizeButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (button.hasAttribute('data-waitlist')) {
          // Popup disabled for waitlist - no action taken
        } else {
          const variantId = button.getAttribute('data-variant-id');
          if (variantId) {
            this.addToCart(variantId, 1);
          }
        }
      });
    });
  }

  addToCart(variantId, quantity) {
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

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return { success: true };
        }

        return response.json();
      })
      .then((data) => {
        this.showNotification('Added to cart successfully!', 'success');
        this.updateCartCount();
        this.refreshCartDrawer()
          .then(() => {
            this.openCartDrawer();
          })
          .catch((error) => {
            this.updateCartCount();
            this.openCartDrawer();
          });
      })
      .catch((error) => {
        if (error.message.includes('Unexpected') || error.message.includes('JSON')) {
          setTimeout(() => this.updateCartCount(), 500);
          this.showNotification('Item may have been added - please check cart', 'warning');
          return;
        }

        setTimeout(() => this.updateCartCount(), 1000);
        this.showNotification('Error adding to cart', 'error');
      });
  }

  refreshCartDrawer() {
    return fetch(`${window.location.pathname}?section_id=cart-drawer`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');

        const cartDrawerElement = document.querySelector('cart-drawer');
        const newCartDrawerContent = html.querySelector('cart-drawer');

        if (cartDrawerElement && newCartDrawerContent) {
          const isActive = cartDrawerElement.classList.contains('active');
          const isAnimating = cartDrawerElement.classList.contains('animate');

          cartDrawerElement.innerHTML = newCartDrawerContent.innerHTML;

          if (isActive) cartDrawerElement.classList.add('active');
          if (isAnimating) cartDrawerElement.classList.add('animate');

          if (!newCartDrawerContent.classList.contains('is-empty')) {
            cartDrawerElement.classList.remove('is-empty');
          }
        }

        const cartIconBubble = document.querySelector('#cart-icon-bubble');
        const newCartIconBubble = html.querySelector('#cart-icon-bubble');

        if (cartIconBubble && newCartIconBubble) {
          cartIconBubble.innerHTML = newCartIconBubble.innerHTML;
        }

        this.updateCartCount();
      })
      .catch((error) => {
        return this.updateCartCount();
      });
  }

  openCartDrawer() {
    const cartIcon = document.querySelector('#cart-icon-bubble');
    if (cartIcon) {
      cartIcon.click();
      return;
    }

    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer && typeof cartDrawer.open === 'function') {
      cartDrawer.open();
    } else if (cartDrawer) {
      cartDrawer.classList.add('animate', 'active');
      document.body.classList.add('overflow-hidden');
    } else {
      window.location.href = '/cart';
    }
  }

  updateCartCount() {
    fetch(window.routes?.cart_url || '/cart.js')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((cart) => {
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

        cartCountSelectors.forEach((selector) => {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach((el) => {
              el.textContent = cart.item_count;
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
      .catch((error) => {});
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-red-500';

    notification.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg z-50 opacity-0 transition-opacity duration-300`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => (notification.style.opacity = '1'), 10);
    setTimeout(
      () => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      },
      type === 'warning' ? 3000 : 2000
    );
  }
}

// Initialize product cards
function initializeProductCards() {
  const productCards = document.querySelectorAll('.new-product-card:not([data-card-initialized])');

  productCards.forEach((card) => {
    card.setAttribute('data-card-initialized', 'true');
    new ProductCard(card);
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProductCards);
} else {
  initializeProductCards();
}

// Re-initialize when new cards are added dynamically
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // Element node
        if (node.classList && node.classList.contains('new-product-card')) {
          if (!node.hasAttribute('data-card-initialized')) {
            node.setAttribute('data-card-initialized', 'true');
            new ProductCard(node);
          }
        } else {
          // Check for nested product cards
          const nestedCards =
            node.querySelectorAll && node.querySelectorAll('.new-product-card:not([data-card-initialized])');
          if (nestedCards) {
            nestedCards.forEach((card) => {
              card.setAttribute('data-card-initialized', 'true');
              new ProductCard(card);
            });
          }
        }
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Export for manual initialization if needed
window.ProductCard = ProductCard;
window.initializeProductCards = initializeProductCards;
