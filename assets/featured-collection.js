document.addEventListener('DOMContentLoaded', function () {
  // Collection switching functionality
  const collectionButtons = document.querySelectorAll('.collection-btn');
  const collectionContainers = document.querySelectorAll('.collection-products-container');

  // Initialize slider functionality for collection containers
  function initializeCollectionSlider(container) {
    // Check if already initialized to prevent duplicates
    if (container.hasAttribute('data-slider-initialized')) {
      return;
    }
    container.setAttribute('data-slider-initialized', 'true');

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
  }

  // Initialize all collections on page load
  collectionContainers.forEach((container) => {
    initializeCollectionSlider(container);
  });

  // Collection switching functionality
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
        }
      });

      // Switch collection containers - show the one matching the collection ID
      collectionContainers.forEach((container) => {
        if (container.getAttribute('data-collection-id') === collectionId) {
          container.classList.remove('hidden');
          container.setAttribute('aria-hidden', 'false');
          // Initialize slider for newly shown container
          initializeCollectionSlider(container);
        } else {
          container.classList.add('hidden');
          container.setAttribute('aria-hidden', 'true');
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

  // Waitlist Modal Functions (if they exist on the page)
  const waitlistModal = document.getElementById('waitlist-modal-overlay');
  const closeModalBtn = document.getElementById('close-waitlist-modal');
  const waitlistEmail = document.getElementById('waitlist-email');
  const getNotifiedBtn = document.getElementById('get-notified-btn');

  if (closeModalBtn && waitlistModal) {
    closeModalBtn.addEventListener('click', () => {
      waitlistModal.classList.add('hidden');
      setTimeout(() => {
        waitlistModal.style.display = 'none';
      }, 300);
    });
  }

  if (waitlistModal) {
    waitlistModal.addEventListener('click', (e) => {
      if (e.target === waitlistModal && closeModalBtn) {
        closeModalBtn.click();
      }
    });
  }

  if (getNotifiedBtn && waitlistEmail) {
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
          if (closeModalBtn) {
            closeModalBtn.click();
            setTimeout(() => {
              getNotifiedBtn.textContent = 'GET NOTIFIED';
              getNotifiedBtn.disabled = false;
            }, 300);
          }
        }, 1500);
      }, 1000);
    });
  }

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
