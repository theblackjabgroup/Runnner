document.addEventListener("DOMContentLoaded", () => {
  const urlPattern = /(https?:\/\/[^\s<]+(?:\.[a-z]{2,})(?:\/[^\s<]*)?)/gi;
  const styleClass = 'font-medium underline break-all';

  const convertLinks = (text) => {
    return text.replace(urlPattern, match => {
      return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="${styleClass}">${match}</a>`;
    });
  };

  const wrappers = document.querySelectorAll(".faq-item");

  wrappers.forEach(item => {
    const wrapper = item.querySelector(".faq-toggle");
    if (!wrapper) return;

    const container = wrapper.querySelector("div");
    const svg = container.querySelector("svg");
    if (!container || !svg) return;

    svg.classList.add("arrow-svg1");

    const originalText = container.innerText.trim().replace(/\s+/g, " ");
    const fullHTML = convertLinks(originalText);
    const shortHTML = convertLinks(originalText.split(" ").slice(0, 6).join(" ") + "...");

    container.dataset.fullHTML = fullHTML;
    container.dataset.shortHTML = shortHTML;
    container.dataset.expanded = "false";
    while (svg.nextSibling) 
      svg.parentNode.removeChild(svg.nextSibling);
    svg.insertAdjacentHTML("afterend", shortHTML);

    container.style.overflow = "hidden";
    container.style.transition = "max-height 0.5s ease";
    container.style.maxHeight = container.scrollHeight + "px";

    item.addEventListener("click", () => {
      const isExpanded = container.dataset.expanded === "true";
      container.dataset.expanded = (!isExpanded).toString();
      wrapper.setAttribute("data-expanded", (!isExpanded).toString());

      if (!isExpanded) {
        while (svg.nextSibling) svg.parentNode.removeChild(svg.nextSibling);
        svg.insertAdjacentHTML("afterend", container.dataset.fullHTML);

        container.style.maxHeight = "0px";
        requestAnimationFrame(() => {
          container.style.maxHeight = container.scrollHeight + "px";
        });
      } else {
        const currentHeight = container.scrollHeight;
        container.style.maxHeight = currentHeight + "px";

        requestAnimationFrame(() => {
          container.style.maxHeight = "25px";
        });
        setTimeout(() => {
          while (svg.nextSibling) svg.parentNode.removeChild(svg.nextSibling);
          svg.insertAdjacentHTML("afterend", container.dataset.shortHTML);
          container.style.maxHeight = container.scrollHeight + "px";
        }, 200);
      }
    });
  });
});
