/**
 * Custom Notification System
 * Replaces browser alert(), confirm(), and prompt() with accessible, themeable notifications
 * Shopify-compliant notification utilities
 */

/**
 * Show a notification toast message
 * @param {string} message - The message to display
 * @param {string} type - Type of notification: 'info', 'success', 'warning', 'error'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
  // Define colors for different notification types
  const styles = {
    info: {
      bg: '#3b82f6', // blue
      text: '#ffffff',
      icon: 'ℹ️',
    },
    success: {
      bg: '#10b981', // green
      text: '#ffffff',
      icon: '✓',
    },
    warning: {
      bg: '#f59e0b', // amber
      text: '#ffffff',
      icon: '⚠️',
    },
    error: {
      bg: '#ef4444', // red
      text: '#ffffff',
      icon: '✕',
    },
  };

  const style = styles[type] || styles.info;

  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'custom-notification';
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'polite');

  // Apply inline styles for consistency
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: style.bg,
    color: style.text,
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    zIndex: '10000',
    opacity: '0',
    transition: 'opacity 0.3s ease-in-out',
    maxWidth: '400px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    pointerEvents: 'auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  });

  // Add icon and message
  const iconSpan = document.createElement('span');
  iconSpan.textContent = style.icon;
  iconSpan.style.fontSize = '18px';
  iconSpan.setAttribute('aria-hidden', 'true');

  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;

  notification.appendChild(iconSpan);
  notification.appendChild(messageSpan);

  // Append to body
  document.body.appendChild(notification);

  // Trigger fade-in animation
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
  });

  // Auto-remove after duration
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);

  return notification;
}

/**
 * Show a confirmation dialog
 * @param {string} message - The confirmation message
 * @param {Object} options - Configuration options
 * @param {string} options.confirmText - Text for confirm button (default: 'Confirm')
 * @param {string} options.cancelText - Text for cancel button (default: 'Cancel')
 * @param {string} options.confirmClass - CSS class for confirm button styling
 * @param {string} options.cancelClass - CSS class for cancel button styling
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
function showConfirm(message, options = {}) {
  return new Promise((resolve) => {
    const { confirmText = 'Confirm', cancelText = 'Cancel', confirmClass = '', cancelClass = '' } = options;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-confirm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'confirm-dialog-title');

    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10001',
      opacity: '0',
      transition: 'opacity 0.2s ease-in-out',
      backdropFilter: 'blur(2px)',
    });

    // Create dialog box
    const dialog = document.createElement('div');
    dialog.className = 'custom-confirm-dialog';

    Object.assign(dialog.style, {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '400px',
      width: '90%',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transform: 'scale(0.9)',
      transition: 'transform 0.2s ease-in-out',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    });

    // Create message
    const messageEl = document.createElement('p');
    messageEl.id = 'confirm-dialog-title';
    messageEl.textContent = message;
    Object.assign(messageEl.style, {
      margin: '0 0 24px 0',
      fontSize: '16px',
      lineHeight: '1.5',
      color: '#111827',
    });

    // Create button container
    const buttonContainer = document.createElement('div');
    Object.assign(buttonContainer.style, {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
    });

    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = cancelText;
    cancelButton.className = cancelClass;
    cancelButton.setAttribute('type', 'button');
    Object.assign(cancelButton.style, {
      padding: '10px 20px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      color: '#374151',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    });

    cancelButton.addEventListener('mouseenter', () => {
      cancelButton.style.backgroundColor = '#f3f4f6';
    });

    cancelButton.addEventListener('mouseleave', () => {
      cancelButton.style.backgroundColor = '#ffffff';
    });

    // Create confirm button
    const confirmButton = document.createElement('button');
    confirmButton.textContent = confirmText;
    confirmButton.className = confirmClass;
    confirmButton.setAttribute('type', 'button');
    Object.assign(confirmButton.style, {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: '#ef4444',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    });

    confirmButton.addEventListener('mouseenter', () => {
      confirmButton.style.backgroundColor = '#dc2626';
    });

    confirmButton.addEventListener('mouseleave', () => {
      confirmButton.style.backgroundColor = '#ef4444';
    });

    // Close function
    const closeDialog = (confirmed) => {
      overlay.style.opacity = '0';
      dialog.style.transform = 'scale(0.9)';

      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        resolve(confirmed);
      }, 200);
    };

    // Event listeners
    cancelButton.addEventListener('click', () => closeDialog(false));
    confirmButton.addEventListener('click', () => closeDialog(true));

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDialog(false);
      }
    });

    // Close on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDialog(false);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // Assemble dialog
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Trigger animations
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      dialog.style.transform = 'scale(1)';
    });

    // Focus the confirm button for accessibility
    setTimeout(() => confirmButton.focus(), 100);
  });
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.showNotification = showNotification;
  window.showConfirm = showConfirm;
}
