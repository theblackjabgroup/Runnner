document.addEventListener("DOMContentLoaded", () => {
  const urlPattern = /(https?:\/\/[^\s<]+(?:\.[a-z]{2,})(?:\/[^\s<]*)?)/gi;
  const styleClass = 'font-medium underline break-all';

  const convertLinks = (text) => {
    return text.replace(urlPattern, match => {
      return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="${styleClass}">${match}</a>`;
    });
  };

  const wrappers = document.querySelectorAll(".faq-item");

  wrappers.forEach((item, index) => {
    const wrapper = item.querySelector(".faq-toggle");
    if (!wrapper) return;

    const container = wrapper.querySelector("div");
    const svg = container.querySelector("svg");
    const button = item.querySelector(".faq-row");

    if (!container || !svg || !button) return;

    svg.classList.add("arrow-svg1");

    let fullAnswerText = container.getAttribute('data-full-answer') || '';

    if (!fullAnswerText) {
      const currentText = container.textContent.replace(/^\s*\S+\s*/, '').trim();
      fullAnswerText = currentText.replace(/…$/, '');
      if (currentText.includes('…') || currentText.includes('...')) {
        console.warn(`FAQ item ${index}: Full answer text not available. Please add data-full-answer attribute to the container div.`);
        fullAnswerText = currentText;
      }
    }

    const fullHTML = convertLinks(fullAnswerText);
    const shortHTML = convertLinks(fullAnswerText.split(" ").slice(0, 6).join(" ") + "...");

    container.dataset.fullHTML = fullHTML;
    container.dataset.shortHTML = shortHTML;
    container.dataset.expanded = "false";
    while (svg.nextSibling) {
      svg.parentNode.removeChild(svg.nextSibling);
    }
    const previewSpan = document.createElement('span');
    previewSpan.className = 'preview-text';
    previewSpan.innerHTML = shortHTML;
    svg.insertAdjacentElement("afterend", previewSpan);

    container.style.overflow = "hidden";
    container.style.transition = "max-height 0.5s ease";
    container.style.maxHeight = container.scrollHeight + "px";

    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener("click", (e) => {
      e.preventDefault();

      const currentContainer = newButton.parentNode.querySelector(".faq-toggle div");
      const previewSpan = currentContainer.querySelector('.preview-text');
      const currentWrapper = newButton.parentNode.querySelector(".faq-toggle");

      const isExpanded = currentContainer.dataset.expanded === "true";
      const newState = !isExpanded;

      currentContainer.dataset.expanded = newState.toString();
      currentWrapper.setAttribute("data-expanded", newState.toString());
      newButton.setAttribute("aria-expanded", newState.toString());

      if (newState) {
        previewSpan.innerHTML = currentContainer.dataset.fullHTML;
        previewSpan.classList.add("fadeUpIn");

        currentContainer.style.maxHeight = "0px";
        requestAnimationFrame(() => {
          currentContainer.style.maxHeight = currentContainer.scrollHeight + "px";
        });
      } else {
        const currentHeight = currentContainer.scrollHeight;
        currentContainer.style.maxHeight = currentHeight + "px";
        requestAnimationFrame(() => {
          currentContainer.style.maxHeight = "60px";
          setTimeout(() => {
            previewSpan.innerHTML = currentContainer.dataset.shortHTML;
            previewSpan.classList.remove("fadeUpIn");
            currentContainer.style.maxHeight = currentContainer.scrollHeight + "px";
          }, 250);
        });
      }
    });

    newButton.setAttribute("aria-expanded", "false");
  });
});
