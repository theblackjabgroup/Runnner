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
