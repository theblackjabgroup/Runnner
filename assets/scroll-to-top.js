/**
 * Floating Scroll to Top Button Functionality
 *
 * Handles the behavior of the floating scroll-to-top button:
 * - Shows/hides based on scroll position
 * - Hides when footer is in view to avoid overlap
 * - Smooth scrolls to top when clicked
 * - Accessibility features (keyboard support, focus management)
 */

document.addEventListener('DOMContentLoaded', function () {
  const scrollToTopButton = document.getElementById('floating-scroll-to-top');

  if (!scrollToTopButton) return;

  const showAfter = parseInt(scrollToTopButton.getAttribute('data-show-after')) || 300;
  let isVisible = false;

  // Find the footer element
  const footer =
    document.querySelector('.bb-footer-container') ||
    document.querySelector('footer') ||
    document.querySelector('[role="contentinfo"]');

  /**
   * Check if footer is in viewport
   */
  function isFooterInView() {
    if (!footer) return false;

    const footerRect = footer.getBoundingClientRect();
    const buttonRect = scrollToTopButton.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    // Check if footer is overlapping with button or footer is in view
    return footerRect.top <= windowHeight - buttonRect.height - 20; // 20px buffer
  }

  /**
   * Show or hide button based on scroll position and footer visibility
   */
  function toggleButtonVisibility() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const shouldHide = isFooterInView();

    if (scrollTop > showAfter && !shouldHide && !isVisible) {
      scrollToTopButton.classList.add('visible');
      isVisible = true;
    } else if ((scrollTop <= showAfter || shouldHide) && isVisible) {
      scrollToTopButton.classList.remove('visible');
      isVisible = false;
    }
  }

  /**
   * Smooth scroll to top and manage focus for accessibility
   */
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Accessibility: Move focus to main content after scroll
    setTimeout(function () {
      const mainContent =
        document.querySelector('main') || document.querySelector('#MainContent') || document.querySelector('body');
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
        // Remove tabindex after focus to avoid affecting tab order
        setTimeout(function () {
          mainContent.removeAttribute('tabindex');
        }, 100);
      }
    }, 500);
  }

  // Event listeners
  scrollToTopButton.addEventListener('click', scrollToTop);

  // Keyboard support (Enter and Space)
  scrollToTopButton.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  });

  // Throttled scroll event for better performance
  let scrollTimeout;
  window.addEventListener(
    'scroll',
    function () {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(toggleButtonVisibility, 10);
    },
    { passive: true }
  );

  // Initial check on page load
  toggleButtonVisibility();
});
