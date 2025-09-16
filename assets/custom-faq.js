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

    // Icon setup
    svg.classList.remove("arrow-svg1");
    svg.classList.add("plus-minus-icon");

    // Get answer text
    let fullAnswerText = container.getAttribute("data-full-answer") || "";

    if (!fullAnswerText) {
      const currentText = container.textContent.replace(/^\s*\S+\s*/, "").trim();
      fullAnswerText = currentText.replace(/…$/, "");
      if (currentText.includes("…") || currentText.includes("...")) {
        console.warn(
          `FAQ item ${index}: Full answer text not available. Please add data-full-answer attribute to the container div.`
        );
        fullAnswerText = currentText;
      }
    }

    const fullHTML = convertLinks(fullAnswerText);
    const shortHTML = convertLinks(
      fullAnswerText.split(" ").slice(0, 6).join(" ") + "..."
    );

    container.dataset.fullHTML = fullHTML;
    container.dataset.shortHTML = shortHTML;
    container.dataset.expanded = "false";

    // Remove old siblings & add preview span
    while (svg.nextSibling) {
      svg.parentNode.removeChild(svg.nextSibling);
    }

    const previewSpan = document.createElement("span");
    previewSpan.className = "preview-text";
    previewSpan.innerHTML = shortHTML;
    svg.insertAdjacentElement("afterend", previewSpan);

    // Start collapsed
    container.style.overflow = "hidden";
    container.style.maxHeight = "50px";
    container.style.transition = "max-height 0.7s ease";

    // Replace button with fresh copy
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener("click", (e) => {
      e.preventDefault();

      const currentItem = newButton.closest(".faq-item");
      const currentContainer = currentItem.querySelector(".faq-toggle div");
      const currentPreviewSpan = currentContainer.querySelector(".preview-text");

      const isExpanded = currentContainer.dataset.expanded === "true";
      const newState = !isExpanded;

      // Collapse all other items
      wrappers.forEach((otherItem) => {
        if (otherItem !== currentItem) {
          const otherContainer = otherItem.querySelector(".faq-toggle div");
          const otherPreviewSpan = otherContainer.querySelector(".preview-text");
          if (otherContainer.dataset.expanded === "true") {
            otherItem.classList.remove("expanded");
            otherContainer.dataset.expanded = "false";
            otherContainer.style.maxHeight = "50px";
            otherPreviewSpan.innerHTML = otherContainer.dataset.shortHTML;
          }
        }
      });

      // Toggle current
      currentContainer.dataset.expanded = newState.toString();
      newButton.setAttribute("aria-expanded", newState.toString());

      if (newState) {
        // Open instantly with smooth slide
        currentItem.classList.add("expanded");
        currentPreviewSpan.innerHTML = currentContainer.dataset.fullHTML;
        currentContainer.style.maxHeight = currentContainer.scrollHeight + "px";
      } else {
        // Collapse
        currentItem.classList.remove("expanded");
        currentContainer.style.maxHeight = "50px";
        setTimeout(() => {
          currentPreviewSpan.innerHTML = currentContainer.dataset.shortHTML;
        }, 300);
      }
    });

    newButton.setAttribute("aria-expanded", "false");
  });
});
