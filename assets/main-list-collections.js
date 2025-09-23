/* Main List Collections JavaScript */

document.addEventListener('DOMContentLoaded', function () {
  // Intersection Observer for lazy loading
  const observerOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
  };

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const loader = img.parentElement.querySelector('.lazy-loader');

        // Load image
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }
        if (img.dataset.sizes) {
          img.sizes = img.dataset.sizes;
        }

        img.onload = () => {
          img.classList.add('loaded');
          if (loader) loader.classList.add('hidden');
        };

        observer.unobserve(img);
      }
    });
  }, observerOptions);

  const iframeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const iframe = entry.target;
        const loader = iframe.parentElement.querySelector('.lazy-loader');

        if (iframe.dataset.src) {
          iframe.src = iframe.dataset.src;
          iframe.onload = () => {
            iframe.classList.add('loaded');
            if (loader) loader.classList.add('hidden');
          };
        }

        observer.unobserve(iframe);
      }
    });
  }, observerOptions);

  // Observe all lazy images and iframes
  document.querySelectorAll('.lazy-image').forEach((img) => {
    imageObserver.observe(img);
  });

  document.querySelectorAll('.lazy-iframe').forEach((iframe) => {
    iframeObserver.observe(iframe);
  });
});

// Custom Collection Grid Fade-Up Animation
document.addEventListener('DOMContentLoaded', function() {
  const collectionGrid = document.querySelector('.collection-list');
  if (!collectionGrid) return;

  const collectionCards = collectionGrid.querySelectorAll('.collection-card-item');

  // Set initial state for all cards
  collectionCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(50px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
  });

  // Create intersection observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Trigger fade-up animation
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';

        // Stop observing this element
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  });

  // Observe all collection cards
  collectionCards.forEach(card => {
    observer.observe(card);
  });
});
