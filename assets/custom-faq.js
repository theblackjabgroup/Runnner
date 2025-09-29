document.addEventListener('DOMContentLoaded', () => {
  const urlPattern = /(https?:\/\/[^\s<]+(?:\.[a-z]{2,})(?:\/[^\s<]*)?)/gi;
  const styleClass = 'font-medium underline break-all';

  const convertLinks = (text) => {
    return text.replace(urlPattern, (match) => {
      return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="${styleClass}">${match}</a>`;
    });
  };

  const wrappers = document.querySelectorAll('.faq-item');

  wrappers.forEach((item) => {
    const button = item.querySelector('.faq-row');
    const ansText = item.querySelector('.ans-text');
    const container = item.querySelector('.ans');
    const svg = container.querySelector('svg');

    // Prepare full & short answer
    let fullAnswer = container.dataset.fullAnswer || ansText.textContent;
    const shortAnswer = fullAnswer.split(' ').slice(0, 6).join(' ') + '...';
    container.dataset.fullHTML = convertLinks(fullAnswer);
    container.dataset.shortHTML = convertLinks(shortAnswer);
    ansText.innerHTML = container.dataset.shortHTML;

    // Icon setup
    if (svg) {
      svg.classList.remove('arrow-svg1');
      svg.classList.add('plus-minus-icon');
    }

    button.addEventListener('click', (e) => {
      e.preventDefault();

      const isExpanded = item.classList.contains('expanded');

      // Collapse all other items
      wrappers.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove('expanded');
          const otherAns = otherItem.querySelector('.ans-text');
          const otherContainer = otherItem.querySelector('.ans');
          otherContainer.dataset.expanded = 'false';
          otherAns.innerHTML = otherContainer.dataset.shortHTML;
          otherItem.querySelector('.faq-row').setAttribute('aria-expanded', 'false');
        }
      });

      if (isExpanded) {
        // Collapse
        item.classList.remove('expanded');
        ansText.innerHTML = container.dataset.shortHTML;
        button.setAttribute('aria-expanded', 'false');
      } else {
        // Expand
        item.classList.add('expanded');
        ansText.innerHTML = container.dataset.fullHTML;
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });
});
