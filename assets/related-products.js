/**
 * Product Recommendations Component
 * Handles lazy loading of product recommendations using Shopify's Recommendations API
 * with Intersection Observer for performance optimization
 */

if (typeof window.ProductRecommendations === 'undefined') {
  class ProductRecommendations extends HTMLElement {
    constructor() {
      super();
      this.observer = null;
    }

    connectedCallback() {
      this.initIntersectionObserver();
    }

    disconnectedCallback() {
      // Cleanup observer when element is removed
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }

    initIntersectionObserver() {
      const handleIntersection = (entries, observer) => {
        if (!entries[0].isIntersecting) return;

        // Stop observing once we've started loading
        observer.unobserve(this);

        this.fetchRecommendations();
      };

      this.observer = new IntersectionObserver(handleIntersection.bind(this), { rootMargin: '0px 0px 200px 0px' });

      this.observer.observe(this);
    }

    fetchRecommendations() {
      const url = this.dataset.url;
      const productId = this.dataset.productId;

      if (!url || !productId) {
        console.error('Product recommendations: Missing required data attributes');
        return;
      }

      // Debug logging (can be removed in production)
      if (window.Shopify && window.Shopify.designMode) {
        console.log('Fetching recommendations for product:', productId);
        console.log('API URL:', url);
      }

      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then((text) => {
          this.handleResponse(text);
        })
        .catch((error) => {
          console.error('Error loading product recommendations:', error);
          this.handleError(error);
        });
    }

    handleResponse(text) {
      const html = document.createElement('div');
      html.innerHTML = text;
      const recommendations = html.querySelector('product-recommendations');

      if (recommendations && recommendations.innerHTML.trim().length) {
        this.innerHTML = recommendations.innerHTML;

        // Announce to screen readers
        this.announceToScreenReader();

        // Re-initialize scroll animations after content loads
        if (typeof initScrollAnimations === 'function') {
          initScrollAnimations();
        }

        // Re-initialize featured collection carousel if exists
        if (typeof window.FeaturedCollection !== 'undefined') {
          const slider = this.querySelector('.product-slider');
          if (slider) {
            // Initialize carousel functionality
            const event = new CustomEvent('related-products:loaded');
            this.dispatchEvent(event);
          }
        }
      } else {
        // No recommendations found
        this.handleEmpty();
      }
    }

    handleError(error) {
      // Optionally show error state or just fail silently
      if (window.Shopify && window.Shopify.designMode) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'related-products-error';
        errorMessage.textContent = 'Unable to load recommendations';
        errorMessage.style.padding = '20px';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.color = 'var(--text)';
        this.innerHTML = '';
        this.appendChild(errorMessage);
      }
    }

    handleEmpty() {
      // Hide section or show alternative content
      this.style.display = 'none';
    }

    announceToScreenReader() {
      const liveRegion = this.querySelector('[role="status"]');
      if (liveRegion) {
        const productCount = this.querySelectorAll('.related-products-item').length;
        if (productCount > 0) {
          liveRegion.textContent = `${productCount} related product${productCount !== 1 ? 's' : ''} loaded`;

          // Clear message after announcement
          setTimeout(() => {
            liveRegion.textContent = '';
          }, 1000);
        }
      }
    }
  }

  // Register custom element
  customElements.define('product-recommendations', ProductRecommendations);
  window.ProductRecommendations = ProductRecommendations;
}
