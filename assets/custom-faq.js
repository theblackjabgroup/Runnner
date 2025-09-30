document.addEventListener('DOMContentLoaded', () => {
  const urlPattern = /(https?:\/\/[^\s<]+(?:\.[a-z]{2,})(?:\/[^\s<]*)?)/gi;
  const styleClass = 'font-medium underline break-all';

  const convertLinks = (text) => {
    return text.replace(urlPattern, (match) => {
      return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="${styleClass}">${match}</a>`;
    });
  };

  const wrappers = document.querySelectorAll('.faq-item');

  wrappers.forEach((item, index) => {
    const wrapper = item.querySelector('.faq-toggle');
    if (!wrapper) return;

    const container = wrapper.querySelector('div');
    const svg = container.querySelector('svg');
    const button = item.querySelector('.faq-row');

    if (!container || !svg || !button) return;

    // Icon setup
    svg.classList.remove('arrow-svg1');
    svg.classList.add('plus-minus-icon');

    // Get answer text
    let fullAnswerText = container.getAttribute('data-full-answer') || '';

    if (!fullAnswerText) {
      const currentText = container.textContent.replace(/^\s*\S+\s*/, '').trim();
      fullAnswerText = currentText.replace(/…$/, '');
      if (currentText.includes('…') || currentText.includes('...')) {
        console.warn(
          `FAQ item ${index}: Full answer text not available. Please add data-full-answer attribute to the container div.`
        );
        fullAnswerText = currentText;
      }
    }

    const fullHTML = convertLinks(fullAnswerText);

    // Function to truncate text to fit within one line
    const truncateToSingleLine = (text, container) => {
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'nowrap';
      tempSpan.style.fontSize = getComputedStyle(container).fontSize;
      tempSpan.style.fontFamily = getComputedStyle(container).fontFamily;
      tempSpan.style.fontWeight = getComputedStyle(container).fontWeight;
      tempSpan.style.lineHeight = getComputedStyle(container).lineHeight;
      tempSpan.style.letterSpacing = getComputedStyle(container).letterSpacing;
      tempSpan.textContent = text;

      document.body.appendChild(tempSpan);
      const containerWidth = container.offsetWidth - 40; // Account for icon and padding
      const textWidth = tempSpan.offsetWidth;
      document.body.removeChild(tempSpan);

      if (textWidth <= containerWidth) {
        return text;
      }

      // Split text into words
      const words = text.split(' ');
      let truncatedText = '';

      // Add words one by one until we run out of space
      for (let i = 0; i < words.length; i++) {
        const testText = truncatedText + (truncatedText ? ' ' : '') + words[i] + '...';

        tempSpan.textContent = testText;
        document.body.appendChild(tempSpan);
        const testWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);

        if (testWidth > containerWidth) {
          // If adding this word exceeds width, stop
          break;
        }

        truncatedText += (truncatedText ? ' ' : '') + words[i];
      }

      return truncatedText ? truncatedText + '...' : '...';
    };

    const shortHTML = convertLinks(truncateToSingleLine(fullAnswerText, container));

    container.dataset.fullHTML = fullHTML;
    container.dataset.shortHTML = shortHTML;
    container.dataset.expanded = 'false';

    // Remove old siblings & add preview span
    while (svg.nextSibling) {
      svg.parentNode.removeChild(svg.nextSibling);
    }

    const previewSpan = document.createElement('span');
    previewSpan.className = 'preview-text';
    previewSpan.innerHTML = shortHTML;
    svg.insertAdjacentElement('afterend', previewSpan);

    // Start collapsed
    container.style.overflow = 'hidden';
    container.style.maxHeight = '50px';
    container.style.transition = 'max-height 0.7s ease';

    // Replace button with fresh copy
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', (e) => {
      e.preventDefault();

      const currentItem = newButton.closest('.faq-item');
      const currentContainer = currentItem.querySelector('.faq-toggle div');
      const currentPreviewSpan = currentContainer.querySelector('.preview-text');

      const isExpanded = currentContainer.dataset.expanded === 'true';
      const newState = !isExpanded;

      // Collapse all other items
      wrappers.forEach((otherItem) => {
        if (otherItem !== currentItem) {
          const otherContainer = otherItem.querySelector('.faq-toggle div');
          const otherPreviewSpan = otherContainer.querySelector('.preview-text');
          if (otherContainer.dataset.expanded === 'true') {
            otherItem.classList.remove('expanded');
            otherContainer.dataset.expanded = 'false';
            otherContainer.style.maxHeight = '50px';
            otherPreviewSpan.innerHTML = otherContainer.dataset.shortHTML;
          }
        }
      });

      // Toggle current
      currentContainer.dataset.expanded = newState.toString();
      newButton.setAttribute('aria-expanded', newState.toString());

      if (newState) {
        // Open instantly with smooth slide
        currentItem.classList.add('expanded');
        currentPreviewSpan.innerHTML = currentContainer.dataset.fullHTML;
        currentContainer.style.maxHeight = currentContainer.scrollHeight + 'px';
      } else {
        // Collapse
        currentItem.classList.remove('expanded');
        currentContainer.style.maxHeight = '50px';
        setTimeout(() => {
          currentPreviewSpan.innerHTML = currentContainer.dataset.shortHTML;
        }, 300);
      }
    });

    newButton.setAttribute('aria-expanded', 'false');
  });

  // Handle window resize to recalculate truncation
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      wrappers.forEach((item) => {
        const container = item.querySelector('.faq-toggle div');
        if (!container) return;
        const previewSpan = container.querySelector('.preview-text');

        if (!previewSpan) return;

        if (container && previewSpan && container.dataset.expanded !== 'true') {
          const fullAnswerText = container.getAttribute('data-full-answer') || '';
          if (fullAnswerText) {
            const truncateToSingleLine = (text, container) => {
              const tempSpan = document.createElement('span');
              tempSpan.style.visibility = 'hidden';
              tempSpan.style.position = 'absolute';
              tempSpan.style.whiteSpace = 'nowrap';
              tempSpan.style.fontSize = getComputedStyle(container).fontSize;
              tempSpan.style.fontFamily = getComputedStyle(container).fontFamily;
              tempSpan.style.fontWeight = getComputedStyle(container).fontWeight;
              tempSpan.style.lineHeight = getComputedStyle(container).lineHeight;
              tempSpan.style.letterSpacing = getComputedStyle(container).letterSpacing;
              tempSpan.textContent = text;

              document.body.appendChild(tempSpan);
              const containerWidth = container.offsetWidth - 40;
              const textWidth = tempSpan.offsetWidth;
              document.body.removeChild(tempSpan);

              if (textWidth <= containerWidth) {
                return text;
              }

              // Split text into words
              const words = text.split(' ');
              let truncatedText = '';

              // Add words one by one until we run out of space
              for (let i = 0; i < words.length; i++) {
                const testText = truncatedText + (truncatedText ? ' ' : '') + words[i] + '...';

                tempSpan.textContent = testText;
                document.body.appendChild(tempSpan);
                const testWidth = tempSpan.offsetWidth;
                document.body.removeChild(tempSpan);

                if (testWidth > containerWidth) {
                  // If adding this word exceeds width, stop
                  break;
                }

                truncatedText += (truncatedText ? ' ' : '') + words[i];
              }

              return truncatedText ? truncatedText + '...' : '...';
            };

            const shortHTML = convertLinks(truncateToSingleLine(fullAnswerText, container));
            container.dataset.shortHTML = shortHTML;
            previewSpan.innerHTML = shortHTML;
          }
        }
      });
    }, 250); // Debounce resize events
  });
});
