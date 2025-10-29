class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    const facetForm = this.querySelector('form');
    facetForm.addEventListener('input', this.onSubmitHandler.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    const loadingSpinners = document.querySelectorAll(
      '.facets-container .loading__spinner, facet-filters-form .loading__spinner'
    );
    loadingSpinners.forEach((spinner) => spinner.classList.remove('hidden'));
    const productGrid = document.getElementById('ProductGridContainer');
    if (productGrid) {
      const collectionElement = productGrid.querySelector('.collection') || productGrid.querySelector('.product-grid');
      if (collectionElement) {
        collectionElement.classList.add('loading');
      }
    }
    if (countContainer) {
      countContainer.classList.add('loading');
    }
    if (countContainerDesktop) {
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
        if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
    if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('ProductGridContainer').innerHTML;

    // Remove loading class from collection/product-grid element
    const productGrid = document.getElementById('ProductGridContainer');
    if (productGrid) {
      const collectionElement = productGrid.querySelector('.collection') || productGrid.querySelector('.product-grid');
      if (collectionElement) {
        collectionElement.classList.remove('loading');
      }
    }

    document
      .getElementById('ProductGridContainer')
      .querySelectorAll('.scroll-trigger')
      .forEach((element) => {
        element.classList.add('scroll-trigger--cancel');
      });

    // Re-initialize product grid animations after AJAX update
    FacetFiltersForm.initializeProductGridAnimations();
  }

  static renderProductCount(html) {
    const parsedHtml = new DOMParser().parseFromString(html, 'text/html');
    const productCountElement = parsedHtml.getElementById('ProductCount');

    if (!productCountElement) return;

    const count = productCountElement.innerHTML;
    const container = document.getElementById('ProductCount');
    const containerDesktop = document.getElementById('ProductCountDesktop');

    if (container) {
      container.innerHTML = count;
      container.classList.remove('loading');
    }

    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove('loading');
    }
    const loadingSpinners = document.querySelectorAll(
      '.facets-container .loading__spinner, facet-filters-form .loading__spinner'
    );
    loadingSpinners.forEach((spinner) => spinner.classList.add('hidden'));
  }

  static initializeProductGridAnimations() {
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

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
    const facetDetailsElementsFromFetch = parsedHTML.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );
    const facetDetailsElementsFromDom = document.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );

    // Don't remove any filters - keep them all to prevent price filter disappearing
    // This ensures filters stay visible even when server doesn't return them temporarily

    const matchesId = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.id === jsFilter.id : false;
    };

    const facetsToRender = Array.from(facetDetailsElementsFromFetch).filter((element) => !matchesId(element));
    const countsToRender = Array.from(facetDetailsElementsFromFetch).find(matchesId);

    facetsToRender.forEach((elementToRender, index) => {
      const currentElement = document.getElementById(elementToRender.id);
      // Element already rendered in the DOM so just update the innerHTML
      if (currentElement) {
        document.getElementById(elementToRender.id).innerHTML = elementToRender.innerHTML;
      } else {
        if (index > 0) {
          const { className: previousElementClassName, id: previousElementId } = facetsToRender[index - 1];
          // Same facet type (eg horizontal/vertical or drawer/mobile)
          if (elementToRender.className === previousElementClassName) {
            document.getElementById(previousElementId).after(elementToRender);
            return;
          }
        }

        if (elementToRender.parentElement) {
          document.querySelector(`#${elementToRender.parentElement.id} .js-filter`).before(elementToRender);
        }
      }
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (countsToRender) {
      const closestJSFilterID = event.target.closest('.js-filter').id;

      if (closestJSFilterID) {
        FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
        FacetFiltersForm.renderMobileCounts(countsToRender, document.getElementById(closestJSFilterID));

        const newFacetDetailsElement = document.getElementById(closestJSFilterID);
        const newElementSelector = newFacetDetailsElement.classList.contains('mobile-facets__details')
          ? `.mobile-facets__close-button`
          : `.facets__summary`;
        const newElementToActivate = newFacetDetailsElement.querySelector(newElementSelector);

        const isTextInput = event.target.getAttribute('type') === 'text';

        if (newElementToActivate && !isTextInput) newElementToActivate.focus();
      }
    }
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = [
      '.active-facets-mobile',
      '.active-facets-desktop',
      '.active-filters-tags-container',
      '.active-filters-tags-container-mobile',
    ];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      const targetElement = document.querySelector(selector);
      if (targetElement) {
        targetElement.innerHTML = activeFacetsElement.innerHTML;
      }
    });

    FacetFiltersForm.toggleActiveFacets(false);

    // Show desktop tags container if it has content
    const tagsContainer = document.querySelector('.active-filters-tags-container');
    if (tagsContainer) {
      const hasTags = tagsContainer.querySelector('.active-filter-tag');
      if (hasTags) {
        tagsContainer.style.display = 'block';
      } else {
        tagsContainer.style.display = 'none';
      }
    }

    // Show mobile tags container if it has content
    const mobileTagsContainer = document.querySelector('.active-filters-tags-container-mobile');
    if (mobileTagsContainer) {
      const hasMobileTags = mobileTagsContainer.querySelector('.active-filter-tag');
      if (hasMobileTags) {
        mobileTagsContainer.style.display = 'block';
      } else {
        mobileTagsContainer.style.display = 'none';
      }
    }

    // Re-attach event listeners for new tag removal buttons
    FacetFiltersForm.attachTagEventListeners();
    FacetFiltersForm.attachMobileTagEventListeners();
  }

  static attachTagEventListeners() {
    // Handle active filter tag removal
    document.querySelectorAll('.active-filter-tag-remove:not(.mobile-tag-remove)').forEach((button) => {
      button.addEventListener('click', function (e) {
        e.preventDefault();
        const filterParam = this.getAttribute('data-filter-param');
        const filterValue = this.getAttribute('data-filter-value');
        const isSortRemove = this.getAttribute('data-sort-remove') === 'true';

        if (isSortRemove) {
          // Remove sort by filter
          const sortInputs = document.querySelectorAll('input[name="sort_by"]');
          sortInputs.forEach((input) => {
            input.checked = false;
          });
        } else if (filterParam && filterValue) {
          // Remove specific filter value
          const filterInput = document.querySelector(`input[name="${filterParam}"][value="${filterValue}"]`);
          if (filterInput) {
            filterInput.checked = false;
          }
        } else if (filterParam) {
          // Remove price range filter
          const priceInputs = document.querySelectorAll(`input[name="${filterParam}"]`);
          priceInputs.forEach((input) => {
            input.value = '';
          });
        }

        // Apply the filter changes
        if (typeof window.applyFiltersAjax === 'function') {
          window.applyFiltersAjax();
        } else {
          // Fallback to form submission
          const form = document.querySelector('#FacetFiltersForm');
          if (form) {
            form.submit();
          }
        }
      });
    });
  }

  static attachMobileTagEventListeners() {
    // Handle mobile active filter tag removal
    document.querySelectorAll('.mobile-tag-remove').forEach((button) => {
      button.addEventListener('click', function (e) {
        e.preventDefault();
        const filterParam = this.getAttribute('data-filter-param');
        const filterValue = this.getAttribute('data-filter-value');
        const isSortRemove = this.getAttribute('data-sort-remove') === 'true';

        if (isSortRemove) {
          // Remove sort by filter
          const sortInputs = document.querySelectorAll('input[name="sort_by"]');
          sortInputs.forEach((input) => {
            input.checked = false;
          });
        } else if (filterParam && filterValue) {
          // Remove specific filter value from mobile form
          const filterInput = document.querySelector(
            `#FacetFiltersFormMobile input[name="${filterParam}"][value="${filterValue}"]`
          );
          if (filterInput) {
            filterInput.checked = false;
          }
        } else if (filterParam) {
          // Remove price range filter from mobile form
          const priceInputs = document.querySelectorAll(`#FacetFiltersFormMobile input[name="${filterParam}"]`);
          priceInputs.forEach((input) => {
            input.value = '';
          });
        }

        // Apply the filter changes
        if (typeof window.applyFiltersAjax === 'function') {
          window.applyFiltersAjax();
        } else {
          // Fallback to form submission
          const form = document.querySelector('#FacetFiltersFormMobile');
          if (form) {
            form.submit();
          }
        }
      });
    });
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    const mobileForm = document.getElementById('FacetFiltersFormMobile');
    if (mobileForm) {
      const menuDrawer = mobileForm.closest('menu-drawer');
      if (menuDrawer && typeof menuDrawer.bindEvents === 'function') {
        menuDrawer.bindEvents();
      }
    }
  }

  static renderCounts(source, target) {
    const targetSummary = target.querySelector('.facets__summary');
    const sourceSummary = source.querySelector('.facets__summary');

    if (sourceSummary && targetSummary) {
      targetSummary.outerHTML = sourceSummary.outerHTML;
    }

    const targetHeaderElement = target.querySelector('.facets__header');
    const sourceHeaderElement = source.querySelector('.facets__header');

    if (sourceHeaderElement && targetHeaderElement) {
      targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;
    }

    const targetWrapElement = target.querySelector('.facets-wrap');
    const sourceWrapElement = source.querySelector('.facets-wrap');

    if (sourceWrapElement && targetWrapElement) {
      const isShowingMore = Boolean(target.querySelector('show-more-button .label-show-more.hidden'));
      if (isShowingMore) {
        sourceWrapElement
          .querySelectorAll('.facets__item.hidden')
          .forEach((hiddenItem) => hiddenItem.classList.replace('hidden', 'show-more-item'));
      }

      targetWrapElement.outerHTML = sourceWrapElement.outerHTML;
    }
  }

  static renderMobileCounts(source, target) {
    const targetFacetsList = target.querySelector('.mobile-facets__list');
    const sourceFacetsList = source.querySelector('.mobile-facets__list');

    if (sourceFacetsList && targetFacetsList) {
      targetFacetsList.outerHTML = sourceFacetsList.outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      },
    ];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const formData = new FormData(event.target.closest('form'));
    const searchParams = new URLSearchParams(formData).toString();
    this.onSubmitForm(searchParams, event);
  }

  preserveFilterState() {
    // Store current filter values in sessionStorage to preserve them across page reloads
    const filterData = {};

    // Get all filter inputs
    const filterInputs = document.querySelectorAll('facet-filters-form input, facet-filters-form select');
    filterInputs.forEach((input) => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        if (input.checked) {
          if (!filterData[input.name]) filterData[input.name] = [];
          filterData[input.name].push(input.value);
        }
      } else if (input.type === 'text' && input.value) {
        filterData[input.name] = input.value;
      }
    });

    // Store in sessionStorage
    sessionStorage.setItem('preservedFilters', JSON.stringify(filterData));
  }

  static restoreFilterState() {
    // Restore filter state after page reload
    const preservedFilters = sessionStorage.getItem('preservedFilters');
    if (!preservedFilters) return;

    try {
      const filterData = JSON.parse(preservedFilters);

      // Apply preserved filter values
      Object.keys(filterData).forEach((name) => {
        const values = Array.isArray(filterData[name]) ? filterData[name] : [filterData[name]];
        values.forEach((value) => {
          const input = document.querySelector(`[name="${name}"][value="${value}"]`);
          if (input) {
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });

      // Clear the preserved state after restoring
      sessionStorage.removeItem('preservedFilters');
    } catch (error) {
      // Silent fail - filter state restoration is not critical
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url =
      event.currentTarget.href.indexOf('?') == -1
        ? ''
        : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

// Restore filter state on page load
document.addEventListener('DOMContentLoaded', () => {
  FacetFiltersForm.restoreFilterState();
});

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('input').forEach((element) => {
      element.addEventListener('change', this.onRangeChange.bind(this));
      element.addEventListener('keydown', this.onKeyDown.bind(this));
    });
    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  onKeyDown(event) {
    if (event.metaKey) return;

    const pattern = /[0-9]|\.|,|'| |Tab|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Delete|Escape/;
    if (!event.key.match(pattern)) event.preventDefault();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('data-max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('data-min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('data-min', 0);
    if (maxInput.value === '') minInput.setAttribute('data-max', maxInput.getAttribute('data-max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('data-min'));
    const max = Number(input.getAttribute('data-max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector('a');
    facetLink.setAttribute('role', 'button');
    facetLink.addEventListener('click', this.closeFilter.bind(this));
    facetLink.addEventListener('keyup', (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
    form.onActiveFilterClick(event);
  }
}

customElements.define('facet-remove', FacetRemove);
