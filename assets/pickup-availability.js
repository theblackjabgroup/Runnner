if (!customElements.get('pickup-availability')) {
  customElements.define(
    'pickup-availability',
    class PickupAvailability extends HTMLElement {
      constructor() {
        super();
        this.initializePickupAvailability();
      }

      initializePickupAvailability() {
        // Set available attribute if pickup availability exists
        const preview = this.querySelector('pickup-availability-preview');
        if (preview) {
          this.setAttribute('available', '');
        }

        // Add click handlers to buttons
        const buttons = this.querySelectorAll('#ShowPickupAvailabilityDrawer');
        buttons.forEach((button) => {
          button.addEventListener('click', (evt) => {
            evt.preventDefault();
            const drawer = document.querySelector('pickup-availability-drawer');
            if (drawer) {
              drawer.show(button);
            }
          });
        });
      }

      fetchAvailability(variantId) {
        if (!variantId) return;

        // Don't fetch if this is the current variant (avoid unnecessary API calls)
        const currentVariantId = this.dataset.variantId;
        if (currentVariantId === variantId.toString()) {
          return;
        }

        const rootUrl = this.dataset.rootUrl;

        // Use Shopify's section rendering with variant ID
        // This fetches the updated pickup-availability snippet with new variant data
        const sectionUrl = `${rootUrl}variants/${variantId}/?section_id=main-product`;

        // Store the new variant ID BEFORE fetching to prevent race conditions
        const previousVariantId = this.dataset.variantId;
        this.dataset.variantId = variantId;

        fetch(sectionUrl)
          .then((response) => {
            if (!response.ok) {
              // Revert to previous variant ID on error
              this.dataset.variantId = previousVariantId;
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
          })
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            const newPickupAvailability = html.querySelector('pickup-availability');

            if (newPickupAvailability) {
              const newPreview = newPickupAvailability.querySelector('pickup-availability-preview');
              const newDrawer = newPickupAvailability.querySelector('pickup-availability-drawer');

              // Update preview if it exists
              const currentPreview = this.querySelector('pickup-availability-preview');
              if (newPreview && currentPreview) {
                currentPreview.innerHTML = newPreview.innerHTML;
                this.setAttribute('available', '');
              } else if (!newPreview && currentPreview) {
                // No availability for this variant
                currentPreview.innerHTML = '<p class="caption-large">Pickup not available for this variant.</p>';
                this.removeAttribute('available');
              }

              // Update drawer if it exists
              const currentDrawer = this.querySelector('pickup-availability-drawer');
              if (newDrawer && currentDrawer) {
                // Update store list in drawer
                const drawerContent = currentDrawer.querySelector('[data-store-availability-drawer-content]');
                const newDrawerContent = newDrawer.querySelector('[data-store-availability-drawer-content]');
                if (drawerContent && newDrawerContent) {
                  drawerContent.innerHTML = newDrawerContent.innerHTML;
                }

                // Update variant info in drawer if it exists
                const currentVariantInfo = currentDrawer.querySelector('.pickup-availability-variant');
                const newVariantInfo = newDrawer.querySelector('.pickup-availability-variant');
                if (currentVariantInfo && newVariantInfo) {
                  currentVariantInfo.innerHTML = newVariantInfo.innerHTML;
                } else if (!newVariantInfo && currentVariantInfo) {
                  // Single variant product - remove variant info
                  currentVariantInfo.remove();
                }
              }

              // Re-initialize buttons after updating content
              this.initializePickupAvailability();
            } else {
              // No pickup availability in response
              const preview = this.querySelector('pickup-availability-preview');
              if (preview) {
                preview.innerHTML = '<p class="caption-large">Pickup not available for this variant.</p>';
              }
              this.removeAttribute('available');
            }
          })
          .catch((error) => {
            console.error('Error fetching pickup availability:', error);
            // Revert variant ID on error
            this.dataset.variantId = previousVariantId;
            // Keep existing content on error - don't clear
          });
      }

      update(variant) {
        // Handle variant updates if needed
        if (variant?.available) {
          this.setAttribute('available', '');
        } else {
          this.removeAttribute('available');
        }
      }
    }
  );
}

if (!customElements.get('pickup-availability-drawer')) {
  customElements.define(
    'pickup-availability-drawer',
    class PickupAvailabilityDrawer extends HTMLElement {
      constructor() {
        super();

        this.onBodyClick = this.handleBodyClick.bind(this);

        this.querySelector('button').addEventListener('click', () => {
          this.hide();
        });

        this.addEventListener('keyup', (event) => {
          if (event.code.toUpperCase() === 'ESCAPE') this.hide();
        });
      }

      handleBodyClick(evt) {
        const target = evt.target;
        if (
          target != this &&
          !target.closest('pickup-availability-drawer') &&
          target.id != 'ShowPickupAvailabilityDrawer'
        ) {
          this.hide();
        }
      }

      hide() {
        this.removeAttribute('open');
        document.body.removeEventListener('click', this.onBodyClick);
        document.body.classList.remove('overflow-hidden');
        removeTrapFocus(this.focusElement);
      }

      show(focusElement) {
        this.focusElement = focusElement;
        this.setAttribute('open', '');
        document.body.addEventListener('click', this.onBodyClick);
        document.body.classList.add('overflow-hidden');
        trapFocus(this);
      }
    }
  );
}
