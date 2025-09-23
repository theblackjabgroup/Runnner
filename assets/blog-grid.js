document.addEventListener('DOMContentLoaded', function () {
    const loadMoreBtn = document.getElementById('load-more-btn-fb');

    function updateLastVisibleMargin() {
      // Remove margin override from all articles
      document.querySelectorAll('.blog-article').forEach(article => {
        article.classList.remove('last-visible-article');
      });

      // Add class to the last visible article
      const visibleArticles = document.querySelectorAll('.blog-article.show-articles, .blog-article:not(.hidden-articles)');
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
          hiddenArticles[i].classList.remove('hidden-articles');
          hiddenArticles[i].classList.add('show-articles');
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
  });
