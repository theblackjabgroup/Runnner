document.addEventListener('DOMContentLoaded', function() {
  const slider = document.getElementById('related-product-slider');
  const scrollbarThumb = document.getElementById('custom-scrollbar-thumb');
  const scrollbarTrack = document.querySelector('.custom-scrollbar-track');
  
  if (!slider || !scrollbarThumb || !scrollbarTrack) {
    console.log('Scrollbar elements not found');
    return;
  }

  // Existing scrollbar functionality
  function updateScrollbar() {
    if (slider.scrollWidth <= slider.clientWidth) {
      scrollbarThumb.style.display = 'none';
      return;
    }
    
    scrollbarThumb.style.display = 'block';
    
    const scrollPercent = slider.scrollLeft / (slider.scrollWidth - slider.clientWidth);
    const trackWidth = scrollbarTrack.clientWidth;
    const thumbWidth = Math.max(20, (slider.clientWidth / slider.scrollWidth) * trackWidth);
    const thumbLeft = scrollPercent * (trackWidth - thumbWidth);
    
    scrollbarThumb.style.width = thumbWidth + 'px';
    scrollbarThumb.style.left = thumbLeft + 'px';
  }

  slider.addEventListener('scroll', updateScrollbar);

  scrollbarTrack.addEventListener('click', function(e) {
    const trackRect = scrollbarTrack.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const clickPercent = clickX / trackRect.width;
    const scrollTo = clickPercent * (slider.scrollWidth - slider.clientWidth);
    
    slider.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    });
  });

  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;

  scrollbarThumb.addEventListener('mousedown', function(e) {
    isDragging = true;
    startX = e.clientX;
    startScrollLeft = slider.scrollLeft;
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const trackWidth = scrollbarTrack.clientWidth;
    const thumbWidth = scrollbarThumb.clientWidth;
    const maxThumbLeft = trackWidth - thumbWidth;
    const scrollRatio = (slider.scrollWidth - slider.clientWidth) / maxThumbLeft;
    const newScrollLeft = startScrollLeft + (deltaX * scrollRatio);
    
    slider.scrollLeft = Math.max(0, Math.min(newScrollLeft, slider.scrollWidth - slider.clientWidth));
  });

  document.addEventListener('mouseup', function() {
    isDragging = false;
  });

  setTimeout(updateScrollbar, 100);
  
  window.addEventListener('resize', function() {
    setTimeout(updateScrollbar, 100);
  });
  
  const images = slider.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('load', updateScrollbar);
  });

  // Enhanced Add to Cart functionality with proper cart drawer refresh
  function handleAddToCart(button) {
    const productId = button.dataset.productId;
    const variantId = button.dataset.variantId;
    
    if (!variantId) {
      console.error('No variant ID found');
      return;
    }

    // Disable button and show loading state
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'ADDING...';

    // Prepare cart add data
    const formData = {
      'items': [{
        'id': variantId,
        'quantity': 1
      }]
    };

    // Add to cart via Shopify Cart API
    fetch(window.Shopify?.routes?.root ? window.Shopify.routes.root + 'cart/add.js' : '/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(formData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }
      return response.json();
    })
    .then(data => {
      console.log('Product added to cart:', data);
      
      // Update cart count first
      updateCartCount();
      
      // Refresh cart drawer content, then open it
      refreshCartDrawerContent().then(() => {
        // Small delay to ensure content is refreshed
        setTimeout(() => {
          handleCartBehavior();
        }, 300);
      });
      
      // Show success feedback
      showAddToCartSuccess(button, originalText);
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
      
      // Show error feedback
      button.textContent = 'ERROR - TRY AGAIN';
      button.style.backgroundColor = '#dc2626';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.disabled = false;
      }, 2000);
    });
  }

  // Function to refresh cart drawer content
  function refreshCartDrawerContent() {
    return new Promise((resolve) => {
      // Method 1: Dawn theme cart drawer refresh
      const dawnCartDrawer = document.querySelector('cart-drawer');
      if (dawnCartDrawer) {
        // Force refresh of cart drawer
        if (dawnCartDrawer.renderContents) {
          dawnCartDrawer.renderContents();
        }
        
        // Get cart data and update drawer
        fetch('/cart.js')
          .then(response => response.json())
          .then(cart => {
            // Dispatch cart updated event for Dawn theme
            document.dispatchEvent(new CustomEvent('cart:updated', {
              detail: { cart: cart }
            }));
            
            setTimeout(resolve, 400);
          })
          .catch(() => {
            setTimeout(resolve, 400);
          });
        return;
      }

      // Method 2: Try to refresh cart sections using Shopify's section rendering
      const sectionsToUpdate = [
        'cart-drawer',
        'cart-drawer-items', 
        'cart-items',
        'mini-cart',
        'cart-notification',
        'cart-icon-bubble'
      ];

      Promise.all(
        sectionsToUpdate.map(sectionId => 
          fetch(`/?section_id=${sectionId}`)
            .then(response => response.text())
            .then(responseText => {
              const html = new DOMParser().parseFromString(responseText, 'text/html');
              const sectionElement = document.getElementById(sectionId) || 
                                   document.querySelector(`[data-section-id="${sectionId}"]`) ||
                                   document.querySelector(`.${sectionId}`);
              const newContent = html.getElementById(sectionId) || 
                               html.querySelector(`[data-section-id="${sectionId}"]`) ||
                               html.querySelector(`.${sectionId}`);
              
              if (sectionElement && newContent) {
                sectionElement.innerHTML = newContent.innerHTML;
              }
            })
            .catch(error => {
              console.log(`Could not update section ${sectionId}:`, error);
            })
        )
      ).then(() => {
        setTimeout(resolve, 300);
      });

      // Method 3: Fallback - trigger theme refresh events and manual cart fetch
      fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
          // Dispatch multiple events for different theme compatibility
          const events = [
            'cart:updated',
            'cart:refresh', 
            'drawer:refresh',
            'cart:change',
            'ajaxCart:updated'
          ];
          
          events.forEach(eventName => {
            document.dispatchEvent(new CustomEvent(eventName, {
              detail: { cart: cart },
              bubbles: true
            }));
          });
          
          // Try to call theme-specific refresh functions
          if (window.theme?.cartDrawer?.refresh) {
            window.theme.cartDrawer.refresh();
          }
          if (window.CartDrawer?.refresh) {
            window.CartDrawer.refresh();
          }
          if (window.Shopify?.theme?.cartDrawer?.refresh) {
            window.Shopify.theme.cartDrawer.refresh();
          }
          
          setTimeout(resolve, 300);
        })
        .catch(() => {
          setTimeout(resolve, 300);
        });
    });
  }

  // Function to handle cart behavior based on theme settings
  function handleCartBehavior() {
    // Multiple approaches to open cart drawer based on different theme implementations
    
    // Method 1: Dawn theme and similar modern themes
    const dawnCartDrawer = document.querySelector('cart-drawer');
    if (dawnCartDrawer && typeof dawnCartDrawer.open === 'function') {
      dawnCartDrawer.open();
      return;
    }

    // Method 2: Check for cart drawer toggle buttons
    const cartDrawerToggle = document.querySelector(
      '[data-cart-drawer-toggle], .cart-drawer-toggle, .js-cart-drawer-toggle, [data-cart-toggle], .cart-toggle'
    );
    if (cartDrawerToggle) {
      cartDrawerToggle.click();
      return;
    }

    // Method 3: Look for generic cart drawer elements
    const genericCartDrawer = document.querySelector(
      '.cart-drawer, #CartDrawer, [data-cart-drawer], #cart-drawer, .js-cart-drawer'
    );
    if (genericCartDrawer) {
      // Try different methods to show the drawer
      genericCartDrawer.classList.add('is-open', 'active', 'open');
      genericCartDrawer.style.transform = 'translateX(0)';
      genericCartDrawer.style.right = '0';
      genericCartDrawer.style.display = 'block';
      
      // Remove hidden classes
      genericCartDrawer.classList.remove('hidden', 'closed');
      return;
    }

    // Method 4: Check for theme-specific cart drawer functions
    if (window.theme?.cartDrawer?.open) {
      window.theme.cartDrawer.open();
      return;
    }

    if (window.CartDrawer?.open) {
      window.CartDrawer.open();
      return;
    }

    // Method 5: Check for Shopify theme-specific functions
    if (window.Shopify?.theme?.cartDrawer?.open) {
      window.Shopify.theme.cartDrawer.open();
      return;
    }

    // Method 6: Trigger custom events that themes might listen to
    const cartOpenEvents = ['cart:open', 'drawer:open', 'cart:show', 'cart-drawer:open'];
    cartOpenEvents.forEach(eventName => {
      document.dispatchEvent(new CustomEvent(eventName, {
        bubbles: true,
        detail: { source: 'related-products' }
      }));
    });

    // Method 7: Try to find and trigger cart icon clicks
    const cartIcon = document.querySelector(
      '.cart-icon, [data-cart-icon], .header__cart, .cart-link, [href="/cart"], [href*="cart"]'
    );
    if (cartIcon && !cartIcon.href?.includes('/cart')) {
      cartIcon.click();
      return;
    }

    // Method 8: Check for mini cart or cart popup
    const miniCart = document.querySelector('.mini-cart, #mini-cart, [data-mini-cart]');
    if (miniCart) {
      miniCart.classList.add('is-open', 'active');
      miniCart.style.display = 'block';
      return;
    }

    // Method 9: Last resort - check theme settings and redirect if cart type is 'page'
    const themeSettings = window.theme_settings || window.settings;
    if (themeSettings?.cart_type === 'page') {
      window.location.href = window.Shopify?.routes?.root ? window.Shopify.routes.root + 'cart' : '/cart';
      return;
    }

    // Method 10: Final fallback - try a generic approach
    setTimeout(() => {
      const allPossibleDrawers = document.querySelectorAll(
        '[class*="cart"], [id*="cart"], [data*="cart"]'
      );
      
      allPossibleDrawers.forEach(drawer => {
        if (drawer.style.display === 'none' || drawer.classList.contains('hidden')) {
          drawer.style.display = 'block';
          drawer.classList.remove('hidden');
          drawer.classList.add('active', 'open');
        }
      });
    }, 100);
  }

  // Function to update cart count
  function updateCartCount() {
    fetch(window.Shopify?.routes?.root ? window.Shopify.routes.root + 'cart.js' : '/cart.js')
      .then(response => response.json())
      .then(cart => {
        // Update cart count in various possible locations
        const cartCountElements = document.querySelectorAll(
          '.cart-count, [data-cart-count], .cart-item-count, #cart-count, .header__cart-count, .cart-count-bubble, [data-cart-count-bubble]'
        );
        
        cartCountElements.forEach(element => {
          element.textContent = cart.item_count;
          if (cart.item_count > 0) {
            element.style.display = 'block';
            element.classList.remove('hidden');
          } else {
            element.style.display = 'none';
            element.classList.add('hidden');
          }
        });

        // Dispatch custom event for theme to handle
        document.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { cart: cart }
        }));

        // Also trigger cart:change event for compatibility
        document.dispatchEvent(new CustomEvent('cart:change', {
          detail: { cart: cart }
        }));
      })
      .catch(error => {
        console.error('Error updating cart count:', error);
      });
  }

  // Function to show success feedback
  function showAddToCartSuccess(button, originalText) {
    button.textContent = 'ADDED!';
    button.style.backgroundColor = '#10b981';
    button.style.color = 'white';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
      button.style.color = '';
      button.disabled = false;
    }, 2000);
  }

  // Attach event listeners to add to cart buttons
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-to-cart-btn')) {
      e.preventDefault();
      handleAddToCart(e.target);
    }
  });

  // Size variant selection functionality
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('size-option-btn') && !e.target.dataset.waitlist) {
      const productId = e.target.dataset.productId;
      const variantId = e.target.dataset.variantId;
      const productCard = e.target.closest('.product-card');
      const addToCartBtn = productCard.querySelector('.add-to-cart-btn');
      
      // Update add to cart button with selected variant
      if (addToCartBtn) {
        addToCartBtn.dataset.variantId = variantId;
        addToCartBtn.dataset.hasVariants = 'true';
      }
      
      // Update visual selection
      const sizeButtons = productCard.querySelectorAll('.size-option-btn');
      sizeButtons.forEach(btn => btn.classList.remove('selected'));
      e.target.classList.add('selected');
    }
  });

  // Image navigation functionality
  document.addEventListener('click', function(e) {
    if (e.target.closest('.image-nav-arrow')) {
      const arrow = e.target.closest('.image-nav-arrow');
      const productId = arrow.dataset.productId;
      const productCard = arrow.closest('.product-card');
      const images = productCard.querySelectorAll('.product-image');
      
      if (images.length <= 1) return;
      
      const currentActive = productCard.querySelector('.product-image.active');
      const currentIndex = parseInt(currentActive.dataset.index);
      let newIndex;
      
      if (arrow.classList.contains('image-nav-prev')) {
        newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
      } else {
        newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
      }
      
      // Update active image
      images.forEach(img => img.classList.remove('active'));
      images[newIndex].classList.add('active');
    }
  });

  // Waitlist modal functionality
  const waitlistModal = document.getElementById('rp-waitlist-modal-overlay');
  const closeWaitlistModal = document.getElementById('close-rp-waitlist-modal');
  const getNotifiedBtn = document.getElementById('rp-get-notified-btn');
  const waitlistEmail = document.getElementById('rp-waitlist-email');

  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('notify-me-btn') || e.target.dataset.waitlist) {
      const productTitle = e.target.dataset.productTitle;
      const variantSize = e.target.dataset.variantSize || '';
      
      document.getElementById('rp-waitlist-product-title').textContent = productTitle;
      document.getElementById('rp-waitlist-product-variant').textContent = variantSize;
      
      waitlistModal.classList.remove('hidden');
      waitlistModal.style.display = 'flex';
    }
  });

  if (closeWaitlistModal) {
    closeWaitlistModal.addEventListener('click', function() {
      waitlistModal.classList.add('hidden');
      setTimeout(() => {
        waitlistModal.style.display = 'none';
      }, 300);
    });
  }

  if (getNotifiedBtn && waitlistEmail) {
    getNotifiedBtn.addEventListener('click', function() {
      const email = waitlistEmail.value;
      if (email && email.includes('@')) {
        // Here you would integrate with your waitlist service
        alert('Thank you! We\'ll notify you when this item is back in stock.');
        waitlistModal.classList.add('hidden');
        setTimeout(() => {
          waitlistModal.style.display = 'none';
        }, 300);
        waitlistEmail.value = '';
      } else {
        alert('Please enter a valid email address.');
      }
    });
  }
});