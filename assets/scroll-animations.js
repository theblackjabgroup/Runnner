/**
 * ===================================================================
 * SCROLL-TRIGGERED FADE-IN ANIMATIONS
 * Centralized JavaScript for various fade-in animation types on scroll
 * ===================================================================
 */

class ScrollAnimations {
  constructor(options = {}) {
    this.options = {
      // Default settings
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1,
      animateClass: 'animate',
      triggerClass: 'scroll-fade-trigger',
      slideTriggerClass: 'scroll-slide-trigger',
      containerClass: 'scroll-fade-stagger',
      debugMode: false,
      disableOnMobile: false,
      respectReducedMotion: true,
      ...options,
    };

    this.observer = null;
    this.animatedElements = new Set();
    this.isInitialized = false;

    this.init();
  }

  /**
   * Initialize the scroll animations
   */
  init() {
    if (this.isInitialized) return;

    // Check for reduced motion preference
    if (this.options.respectReducedMotion && this.prefersReducedMotion()) {
      this.disableAnimations();
      return;
    }

    // Check if we should disable on mobile
    if (this.options.disableOnMobile && this.isMobile()) {
      this.disableAnimations();
      return;
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupObserver());
    } else {
      this.setupObserver();
    }

    this.isInitialized = true;
  }

  /**
   * Setup the Intersection Observer
   */
  setupObserver() {
    if (!window.IntersectionObserver) {
      // Fallback for browsers without IntersectionObserver support
      this.fallbackAnimation();
      return;
    }

    this.observer = new IntersectionObserver((entries) => this.handleIntersection(entries), {
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold,
    });

    this.observeElements();
    this.markAsLoaded();
  }

  /**
   * Handle intersection observer entries
   */
  handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.animateElement(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }

  /**
   * Find and observe all animation trigger elements
   */
  observeElements() {
    // Observe fade trigger elements
    const fadeElements = document.querySelectorAll(`.${this.options.triggerClass}`);
    // Observe slide trigger elements
    const slideElements = document.querySelectorAll(`.${this.options.slideTriggerClass}`);

    const allElements = [...fadeElements, ...slideElements];

    allElements.forEach((element, index) => {
      // Add debug info if enabled
      if (this.options.debugMode) {
        element.dataset.animationIndex = index;
      }

      this.observer.observe(element);
    });

    // Handle stagger containers
    this.setupStaggerContainers();
  }

  /**
   * Setup stagger animations for containers
   */
  setupStaggerContainers() {
    const staggerContainers = document.querySelectorAll(`.${this.options.containerClass}`);

    staggerContainers.forEach((container) => {
      const fadeChildren = container.querySelectorAll(`.${this.options.triggerClass}`);
      const slideChildren = container.querySelectorAll(`.${this.options.slideTriggerClass}`);
      const allChildren = [...fadeChildren, ...slideChildren];

      allChildren.forEach((child, index) => {
        // Calculate stagger delay based on position
        const delay = index * 0.1; // 100ms between each item
        child.style.transitionDelay = `${delay}s`;
      });
    });
  }

  /**
   * Animate a single element
   */
  animateElement(element) {
    if (this.animatedElements.has(element)) return;

    // Add the animate class
    element.classList.add(this.options.animateClass);
    this.animatedElements.add(element);

    // Dispatch custom event
    element.dispatchEvent(
      new CustomEvent('scrollAnimationStart', {
        detail: { element },
      })
    );

    // Clean up after animation completes
    const duration = this.getAnimationDuration(element);
    setTimeout(() => {
      element.dispatchEvent(
        new CustomEvent('scrollAnimationComplete', {
          detail: { element },
        })
      );
    }, duration);
  }

  /**
   * Get animation duration from CSS custom property or computed style
   */
  getAnimationDuration(element) {
    const computed = window.getComputedStyle(element);
    const duration = computed.getPropertyValue('--scroll-animation-duration') || computed.transitionDuration || '0.8s';

    return parseFloat(duration) * 1000; // Convert to milliseconds
  }

  /**
   * Animate all elements at once (fallback)
   */
  fallbackAnimation() {
    const elements = document.querySelectorAll(`.${this.options.triggerClass}`);
    elements.forEach((element) => {
      element.classList.add(this.options.animateClass);
    });
  }

  /**
   * Disable animations by showing all elements
   */
  disableAnimations() {
    const fadeElements = document.querySelectorAll(`.${this.options.triggerClass}`);
    const slideElements = document.querySelectorAll(`.${this.options.slideTriggerClass}`);
    const allElements = [...fadeElements, ...slideElements];

    allElements.forEach((element) => {
      element.style.opacity = '1';
      element.style.transform = 'none';
      element.style.transition = 'none';
    });
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if device is mobile
   */
  isMobile() {
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  /**
   * Mark document as animations loaded
   */
  markAsLoaded() {
    document.documentElement.classList.add('scroll-animations-loaded');
    document.documentElement.classList.remove('scroll-animations-loading');
  }

  /**
   * Refresh animations (useful for dynamic content)
   */
  refresh() {
    if (!this.observer) return;

    // Unobserve all current elements
    const fadeElements = document.querySelectorAll(`.${this.options.triggerClass}`);
    const slideElements = document.querySelectorAll(`.${this.options.slideTriggerClass}`);
    const allElements = [...fadeElements, ...slideElements];

    allElements.forEach((element) => {
      this.observer.unobserve(element);
    });

    // Re-observe all elements
    this.observeElements();
  }

  /**
   * Destroy the animation system
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.animatedElements.clear();
    this.isInitialized = false;
  }

  /**
   * Enable debug mode
   */
  enableDebug() {
    this.options.debugMode = true;
    document.documentElement.classList.add('scroll-animations-debug');
  }

  /**
   * Disable debug mode
   */
  disableDebug() {
    this.options.debugMode = false;
    document.documentElement.classList.remove('scroll-animations-debug');
  }
}

/**
 * ===================================================================
 * PRODUCT GRID ANIMATIONS
 * Specialized animations for product grids
 * ===================================================================
 */

class ProductGridAnimations extends ScrollAnimations {
  constructor(options = {}) {
    const defaultOptions = {
      triggerClass: 'scroll-fade-trigger',
      containerClass: 'product-grid-animated',
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1,
      ...options,
    };

    super(defaultOptions);
  }

  /**
   * Setup product grid specific animations
   */
  setupStaggerContainers() {
    const productGrids = document.querySelectorAll('.product-grid');

    productGrids.forEach((grid) => {
      const products = grid.querySelectorAll('.product-card-item');

      products.forEach((product, index) => {
        // Calculate stagger delay based on index
        const baseDelay = 0.1; // 100ms between each card
        const delay = index * baseDelay;

        // Apply the delay directly to the element's transition-delay
        product.style.transitionDelay = `${delay}s`;

        // Ensure the product has proper initial state
        product.style.opacity = '0';
        product.style.transform = 'translateY(50px)';
        product.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      });
    });

    // Call parent method for other containers
    super.setupStaggerContainers();
  }

  /**
   * Animate element with fade-up effect
   */
  animateElement(element) {
    if (this.animatedElements.has(element)) return;

    // Force the fade-up animation
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';

    this.animatedElements.add(element);

    // Dispatch custom event
    element.dispatchEvent(
      new CustomEvent('scrollAnimationStart', {
        detail: { element },
      })
    );
  }
}

/**
 * ===================================================================
 * UTILITY FUNCTIONS
 * ===================================================================
 */

/**
 * Throttle function for performance
 */
function throttle(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Initialize animations when DOM is ready
 */
function initScrollAnimations() {
  // Initialize general scroll animations
  window.scrollAnimations = new ScrollAnimations({
    debugMode: window.location.search.includes('debug=animations'),
  });

  // Initialize product grid animations
  window.productGridAnimations = new ProductGridAnimations();

  // Handle window resize for responsive stagger recalculation
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.productGridAnimations) {
        window.productGridAnimations.refresh();
      }
    }, 250);
  });

  // Add refresh functionality for AJAX content
  if (window.Shopify && window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', () => {
      setTimeout(() => {
        window.scrollAnimations.refresh();
        window.productGridAnimations.refresh();
      }, 100);
    });
  }

  // Handle infinite scroll or dynamic content loading
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        const hasProductCards = Array.from(mutation.addedNodes).some(
          (node) =>
            node.nodeType === 1 &&
            (node.classList?.contains('product-card-item') || node.querySelector?.('.product-card-item'))
        );

        if (hasProductCards && window.productGridAnimations) {
          setTimeout(() => {
            window.productGridAnimations.refresh();
          }, 100);
        }
      }
    });
  });

  // Observe product grid containers for dynamic content
  const productGrids = document.querySelectorAll('.product-grid');
  productGrids.forEach((grid) => {
    observer.observe(grid, { childList: true, subtree: true });
  });
}

/**
 * ===================================================================
 * SHOPIFY INTEGRATION
 * ===================================================================
 */

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
  initScrollAnimations();
}

// Handle Shopify theme editor
if (window.Shopify && window.Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => {
    setTimeout(() => {
      if (window.scrollAnimations) window.scrollAnimations.refresh();
      if (window.productGridAnimations) window.productGridAnimations.refresh();
    }, 100);
  });

  document.addEventListener('shopify:section:reorder', () => {
    setTimeout(() => {
      if (window.scrollAnimations) window.scrollAnimations.refresh();
      if (window.productGridAnimations) window.productGridAnimations.refresh();
    }, 100);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    // Clean up any animations in the unloaded section
    const section = event.target;
    const animatedElements = section.querySelectorAll(
      '.scroll-fade-trigger, .scroll-slide-trigger, .product-card-item'
    );
    animatedElements.forEach((element) => {
      if (window.scrollAnimations && window.scrollAnimations.observer) {
        window.scrollAnimations.observer.unobserve(element);
      }
      if (window.productGridAnimations && window.productGridAnimations.observer) {
        window.productGridAnimations.observer.unobserve(element);
      }
    });
  });
}

/**
 * ===================================================================
 * GLOBAL API
 * ===================================================================
 */

// Expose utilities globally
window.ScrollAnimationUtils = {
  throttle,
  initScrollAnimations,
  ScrollAnimations,
  ProductGridAnimations,
};
