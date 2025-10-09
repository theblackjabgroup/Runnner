document.addEventListener('DOMContentLoaded', function () {
  const loadMoreBtn = document.getElementById('load-more-btn-fb');

  function updateLastVisibleMargin() {
    // Remove margin override from all articles
    document.querySelectorAll('.blog-article').forEach((article) => {
      article.classList.remove('last-visible-article');
    });

    // Add class to the last visible article
    const visibleArticles = document.querySelectorAll(
      '.blog-article.show-articles, .blog-article:not(.hidden-articles)'
    );
    if (visibleArticles.length > 0) {
      visibleArticles[visibleArticles.length - 1].classList.add('last-visible-article');
    }
  }

  updateLastVisibleMargin(); // Call on initial load

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('mouseenter', function () {
      loadMoreBtn.classList.remove('animate');
      void loadMoreBtn.offsetWidth; // Trigger reflow
      loadMoreBtn.classList.add('animate');
    });

    loadMoreBtn.addEventListener('animationend', function (e) {
      if (e.target.classList.contains('load-more-text-hover')) {
        loadMoreBtn.classList.remove('animate');
      }
    });

    loadMoreBtn.addEventListener('click', function () {
      const hiddenArticles = document.querySelectorAll('.blog-article.hidden-articles');
      const articlesPerLoad = parseInt(loadMoreBtn.getAttribute('data-articles-per-load')) || 3;

      for (let i = 0; i < Math.min(articlesPerLoad, hiddenArticles.length); i++) {
        const article = hiddenArticles[i];
        article.classList.remove('hidden-articles');
        article.classList.add('show-articles');

        // Add fade-up animation for newly shown articles
        article.style.opacity = '0';
        article.style.transform = 'translateY(50px)';
        article.style.transition = `opacity 0.8s ease ${i * 0.1}s, transform 0.8s ease ${i * 0.1}s`;

        // Trigger animation after a short delay
        setTimeout(() => {
          article.style.opacity = '1';
          article.style.transform = 'translateY(0)';
        }, 50);
      }

      const remainingHidden = document.querySelectorAll('.blog-article.hidden-articles');
      if (remainingHidden.length === 0) {
        loadMoreBtn.style.display = 'none';
      }

      const remaining = remainingHidden.length;
      loadMoreBtn.setAttribute('data-remaining', remaining);

      updateLastVisibleMargin(); // Update the last visible article
    });
  }

  // Blog Grid Fade-Up Animation
  const blogCards = document.querySelectorAll('.blog-article-card');

  // Set initial state for all cards
  blogCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(50px)';
    card.style.transition = `opacity 0.8s ease ${index * 0.1}s, transform 0.8s ease ${index * 0.1}s`;
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

  // Observe all blog cards
  blogCards.forEach((card) => {
    observer.observe(card);
  });
});
