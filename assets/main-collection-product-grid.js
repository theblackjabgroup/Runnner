/* Main Collection Product Grid JavaScript */

// Custom Product Grid Fade-Up Animation
document.addEventListener('DOMContentLoaded', function () {
  // Initialize animations on page load
  if (typeof FacetFiltersForm !== 'undefined' && FacetFiltersForm.initializeProductGridAnimations) {
    FacetFiltersForm.initializeProductGridAnimations();
  } else {
    // Fallback initialization if facets.js hasn't loaded yet
    initializeProductGridAnimationsFallback();
  }
});

// Fallback function for initial page load
function initializeProductGridAnimationsFallback() {
  const productGrid = document.querySelector('.product-grid');
  if (!productGrid) return;

  const productCards = productGrid.querySelectorAll('.product-card-item');

  // Set initial state for all cards
  productCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(50px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
  });

  // Create intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Trigger fade-up animation
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';

          // Stop observing this element
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1,
    }
  );

  // Observe all product cards
  productCards.forEach((card) => {
    observer.observe(card);
  });
}
