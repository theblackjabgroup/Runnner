// Recently Viewed Products JavaScript
// Tracks and displays recently viewed products using localStorage

(function () {
  'use strict';

  const STORAGE_KEY = 'shopify_recently_viewed';

  // Get settings from data attributes
  const sectionElement = document.querySelector('[data-section-type="recently-viewed"]');
  if (!sectionElement) {
    return;
  }

  const MAX_PRODUCTS = parseInt(sectionElement.getAttribute('data-max-products')) || 10;
  const sectionId = sectionElement.getAttribute('data-section-id');
  const enableAnimations = sectionElement.getAttribute('data-enable-animations') === 'true';

  // Get meta safely
  function getMetaSafe(name) {
    var meta = document.querySelector('meta[name="' + name + '"]');
    return meta ? meta.getAttribute('content') : null;
  }

  const currentProductId = getMetaSafe('product-id');

  // Storage abstraction - handles localStorage, sessionStorage, or in-memory fallback
  var memoryStorage = {};
  const storage = {
    getItem: function (key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        try {
          return sessionStorage.getItem(key);
        } catch (e2) {
          return memoryStorage[key] || null;
        }
      }
    },
    setItem: function (key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        try {
          sessionStorage.setItem(key, value);
          return true;
        } catch (e2) {
          memoryStorage[key] = value;
          return true;
        }
      }
    },
  };

  // Track product if on product page
  var trackProductRetries = 0;
  var maxRetries = 10;
  var currentlyTracking = false;
  var isRendering = false;

  function trackProduct() {
    // Prevent duplicate tracking calls
    if (currentlyTracking) return;
    currentlyTracking = true;
    // Check multiple ways to detect product page
    var bodyClasses = document.body.className;
    var isProductPage =
      bodyClasses.indexOf('template-product') !== -1 ||
      bodyClasses.indexOf('product-template') !== -1 ||
      window.location.pathname.indexOf('/products/') !== -1;

    if (!isProductPage) {
      currentlyTracking = false;
      return;
    }

    // Wait for product section to be fully loaded
    var productSection = document.querySelector('.product-section, .mobile-product-section');
    if (!productSection) {
      if (trackProductRetries < maxRetries) {
        trackProductRetries++;
        currentlyTracking = false;
        setTimeout(trackProduct, 200);
        return;
      } else {
        currentlyTracking = false;
        return;
      }
    }

    var productId = getMetaSafe('product-id');
    var productHandle = getMetaSafe('product-handle');

    if (!productId || !productHandle) {
      currentlyTracking = false;
      return;
    }

    // Get product data from the page - try multiple selectors
    var titleElement =
      document.querySelector('.product__title') ||
      document.querySelector('[itemprop="name"]') ||
      document.querySelector('.product-single__title') ||
      document.querySelector('h1') ||
      document.querySelector('.product-title') ||
      document.querySelector('[class*="product"][class*="title"]');

    var productTitle = titleElement ? titleElement.textContent.trim() : '';

    var productUrl = window.location.pathname;

    // Try multiple selectors for product image - target main product gallery specifically
    var imageElement = null;

    // Helper function to check if an element is a video preview/thumbnail
    function isVideoPreview(element) {
      if (!element) return false;

      // Check if parent is a video element or gallery item with video
      var parent = element.parentElement;
      for (var k = 0; k < 4; k++) {
        if (parent) {
          var tagName = parent.tagName ? parent.tagName.toLowerCase() : '';
          var className = parent.className || '';

          // Check for video tags or video-related classes
          if (
            tagName === 'video' ||
            className.indexOf('video') !== -1 ||
            className.indexOf('model-viewer') !== -1 ||
            className.indexOf('3d') !== -1
          ) {
            return true;
          }

          // Check if this is a gallery-item and contains a video tag
          if (className.indexOf('gallery-item') !== -1 || className.indexOf('mobile-gallery-item') !== -1) {
            // Check if this gallery item has a video child
            if (parent.querySelector && (parent.querySelector('video') || parent.querySelector('model-viewer'))) {
              return true;
            }
          }

          parent = parent.parentElement;
        }
      }

      // Check the image src or alt for video indicators
      if (element.src && element.src.indexOf('_preview') !== -1) {
        return true;
      }

      if (element.alt) {
        var altLower = element.alt.toLowerCase();
        if (altLower.indexOf('video') !== -1 || altLower.indexOf('preview') !== -1) {
          return true;
        }
      }

      return false;
    }

    // First, try to get ALL gallery images (not just the active one if it's a video)
    var galleryImages = document.querySelectorAll(
      '.product-section .gallery-item img, .mobile-product-section .mobile-gallery-item img'
    );

    if (galleryImages.length > 0) {
      // Find the first non-video image
      for (var i = 0; i < galleryImages.length; i++) {
        var img = galleryImages[i];

        // Skip if not loaded
        if (!img.src || img.naturalWidth === 0 || img.naturalHeight === 0) {
          continue;
        }

        // Skip if it's a video preview
        if (isVideoPreview(img)) {
          continue;
        }

        // Check parent classes to ensure it's not from other sections
        var parentClasses = '';
        var parent = img.parentElement;
        for (var j = 0; j < 5; j++) {
          if (parent) {
            parentClasses += ' ' + (parent.className || '');
            parent = parent.parentElement;
          }
        }

        // Skip if in wrong section
        if (
          parentClasses.indexOf('related-products') !== -1 ||
          parentClasses.indexOf('recently-viewed') !== -1 ||
          parentClasses.indexOf('recommendations') !== -1 ||
          parentClasses.indexOf('image-strip') !== -1 ||
          parentClasses.indexOf('strip-image') !== -1 ||
          parentClasses.indexOf('outfit') !== -1 ||
          parentClasses.indexOf('product-showcase') !== -1
        ) {
          continue;
        }

        // Found a valid image!
        imageElement = img;
        break;
      }
    }

    // Fallback to original selectors if gallery approach didn't work
    if (!imageElement) {
      var selectors = [
        '.product-section img[loading="eager"]',
        'section[role="main"] img[loading="eager"]',
        '.product__media img',
        '.product-single__photo img',
        'img[itemprop="image"]',
      ];

      for (var i = 0; i < selectors.length; i++) {
        var possibleImage = document.querySelector(selectors[i]);
        if (possibleImage && possibleImage.src) {
          // Check if loaded
          if (possibleImage.naturalWidth === 0 || possibleImage.naturalHeight === 0) {
            continue;
          }

          // Skip videos
          if (isVideoPreview(possibleImage)) {
            continue;
          }

          // Verify parent classes
          var parentClasses = '';
          var parent = possibleImage.parentElement;
          for (var j = 0; j < 5; j++) {
            if (parent) {
              parentClasses += ' ' + (parent.className || '');
              parent = parent.parentElement;
            }
          }

          if (
            parentClasses.indexOf('related-products') === -1 &&
            parentClasses.indexOf('recently-viewed') === -1 &&
            parentClasses.indexOf('image-strip') === -1
          ) {
            imageElement = possibleImage;
            break;
          }
        }
      }
    }

    // Get the image src and ensure it's unique
    var productImage = '';
    if (imageElement) {
      // Try data-src first (lazy loaded images), then src
      productImage =
        imageElement.getAttribute('data-src') || imageElement.getAttribute('data-image') || imageElement.src || '';

      // If we have srcset, use the first image from it
      if (!productImage || productImage.indexOf('data:image') === 0) {
        var srcset = imageElement.getAttribute('srcset') || imageElement.getAttribute('data-srcset');
        if (srcset) {
          var firstSrc = srcset.split(',')[0].trim().split(' ')[0];
          if (firstSrc) productImage = firstSrc;
        }
      }

      // Ensure we're not capturing placeholder or default images
      if (
        productImage &&
        (productImage.indexOf('placeholder') !== -1 ||
          productImage.indexOf('default') !== -1 ||
          productImage.indexOf('logo') !== -1 ||
          productImage.indexOf('data:image') === 0)
      ) {
        productImage = '';
      }
    }

    // Get price - try multiple selectors
    var productPrice = '';
    var priceElement =
      document.querySelector('.price__regular .price-item--regular') ||
      document.querySelector('.product__price') ||
      document.querySelector('[itemprop="price"]') ||
      document.querySelector('.price') ||
      document.querySelector('[class*="price"]');

    if (priceElement) {
      productPrice = priceElement.textContent
        ? priceElement.textContent.trim()
        : priceElement.getAttribute('content') || '';
    }

    var product = {
      id: productId,
      handle: productHandle,
      title: productTitle || 'Product',
      url: productUrl,
      image: productImage || '',
      price: productPrice,
      timestamp: Date.now(),
    };

    saveProduct(product);
    currentlyTracking = false;
  }

  // Save product to storage
  function saveProduct(product) {
    try {
      // Validate product has required data
      if (!product.id || !product.handle || !product.title || !product.image) {
        return;
      }

      var products = getRecentlyViewed();

      // Remove if already exists
      products = products.filter(function (p) {
        return p.id !== product.id;
      });

      // Add to beginning
      products.unshift(product);

      // Limit to max products
      products = products.slice(0, MAX_PRODUCTS);

      storage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      // Silent fail
    }
  }

  // Get recently viewed products from storage
  function getRecentlyViewed() {
    try {
      const data = storage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  // Render products
  function renderProducts() {
    // Prevent duplicate render calls
    if (isRendering) return;
    isRendering = true;

    var wrapper = document.querySelector('[data-section-id="' + sectionId + '"] .recently-viewed-wrapper');
    var grid = document.getElementById('recently-viewed-grid-' + sectionId);

    if (!wrapper || !grid) {
      isRendering = false;
      return;
    }

    var products = getRecentlyViewed();

    // Exclude current product
    if (currentProductId) {
      products = products.filter(function (p) {
        return p.id !== currentProductId;
      });
    }

    // Hide section if no products
    if (products.length === 0) {
      wrapper.style.display = 'none';
      isRendering = false;
      return;
    }

    // Clear grid
    grid.innerHTML = '';

    // Filter out products with missing data
    products = products.filter(function (p) {
      return p.title && p.image && p.url;
    });

    // Re-check if we have products after filtering
    if (products.length === 0) {
      wrapper.style.display = 'none';
      isRendering = false;
      return;
    }

    var productsProcessed = 0;
    var productsSuccessful = 0;
    var totalProducts = products.length;

    products.forEach(function (product, index) {
      fetchRenderedProductCard(product.handle, function (err, cardHTML) {
        productsProcessed++;

        if (err) {
          // Check if all products have been processed
          if (productsProcessed === totalProducts) {
            // If no products were successfully added, hide the section
            if (productsSuccessful === 0) {
              wrapper.style.display = 'none';
            }
            isRendering = false;
          }
          return;
        }

        // Create wrapper and insert rendered HTML
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML.trim();
        var cardElement = tempDiv.firstElementChild;

        if (cardElement) {
          // Add animation attributes if enabled
          if (enableAnimations) {
            if (!cardElement.classList.contains('scroll-fade-trigger')) {
              cardElement.classList.add('scroll-fade-trigger', 'scroll-fade-up');
            }
            cardElement.setAttribute('data-animation-index', index);
          }

          grid.appendChild(cardElement);
          productsSuccessful++;
        }

        // Once all products are processed
        if (productsProcessed === totalProducts) {
          // Only show wrapper if at least one product was successfully rendered
          if (productsSuccessful > 0) {
            wrapper.style.display = 'block';

            // Initialize product card functionality
            setTimeout(function () {
              if (typeof window.ProductCard === 'function') {
                var cards = grid.querySelectorAll('.new-product-card:not([data-card-initialized])');

                cards.forEach(function (card) {
                  card.setAttribute('data-card-initialized', 'true');
                  new window.ProductCard(card);
                });
              } else if (typeof window.initializeProductCards === 'function') {
                window.initializeProductCards();
              }
            }, 100);
          } else {
            // All fetches failed, hide the section
            wrapper.style.display = 'none';
          }

          isRendering = false;
        }
      });
    });
  }

  // Fetch rendered product card from helper section
  function fetchRenderedProductCard(handle, callback) {
    var url = '/products/' + handle + '?section_id=recently-viewed-card-renderer';

    fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        return response.text();
      })
      .then(function (html) {
        // Parse and extract the rendered card
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        // Find the product card container
        var cardContainer = doc.querySelector('.related-products-item');

        if (cardContainer) {
          callback(null, cardContainer.outerHTML);
        } else {
          callback(new Error('Card not found in response'), null);
        }
      })
      .catch(function (error) {
        callback(error, null);
      });
  }

  // Initialize
  function init() {
    try {
      // Track current product
      trackProduct();

      // Render recently viewed products
      renderProducts();
    } catch (error) {
      // Silent fail
    }
  }

  // Run on page load
  setTimeout(function () {
    init();
  }, 100);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }

  // Handle Shopify section editor events
  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    document.addEventListener('shopify:section:load', function (event) {
      if (event.detail.sectionId === sectionId) {
        init();
      }
    });
  }

  // Clear storage helper
  window.clearRecentlyViewed = function () {
    storage.setItem(STORAGE_KEY, '[]');
  };

  // Debug helper - expose to global
  window.debugRecentlyViewed = function () {
    var data = storage.getItem(STORAGE_KEY);
    if (data) {
      var products = JSON.parse(data);
      return {
        products: products,
        totalProducts: products.length,
        images: products.map(function (p) {
          return p.image;
        }),
        uniqueImages: products
          .map(function (p) {
            return p.image;
          })
          .filter(function (value, index, self) {
            return self.indexOf(value) === index;
          }).length,
      };
    }
    return { products: [], totalProducts: 0 };
  };
})();
