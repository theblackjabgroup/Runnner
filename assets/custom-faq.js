document.addEventListener("DOMContentLoaded", () => {
  const urlPattern = /(https?:\/\/[^\s<]+(?:\.[a-z]{2,})(?:\/[^\s<]*)?)/gi;
  const styleClass = 'font-bold underline break-all';

  const convertLinks = (text) => {
    return text.replace(urlPattern, match => {
      return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="${styleClass}">${match}</a>`;
    });
  };

  const wrappers = document.querySelectorAll(".faq-item");

  wrappers.forEach(item => {
    const wrapper = item.querySelector(".faq-toggle span");
    if (!wrapper) return;

    const svg = wrapper.querySelector("svg");
    const allNodes = Array.from(wrapper.childNodes);
    const textNode = allNodes.find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);

    if (!svg || !textNode) 
      return;

    svg.classList.add('arrow-svg1');

    const fullText = textNode.textContent.trim().replace(/\s+/g, ' ');
    const shortText = fullText.split(" ").slice(0, 6).join(" ") + "...";

    wrapper.innerHTML = '';
    wrapper.appendChild(svg);

    const span = document.createElement("span");
    span.className = "preview-text select-text selection:bg-yellow-200 selection:text-black";
    span.innerHTML = convertLinks(shortText);
    wrapper.appendChild(span);

    wrapper.dataset.shortText = convertLinks(shortText);
    wrapper.dataset.fullText = convertLinks(fullText);
    wrapper.dataset.expanded = "false";

    item.addEventListener("click", () => {
      document.querySelectorAll(".faq-item").forEach(otherItem => {
        if (otherItem !== item) {
          const otherSpan = otherItem.querySelector(".faq-toggle span .preview-text");
          const otherArrow = otherItem.querySelector(".arrow-svg1");
          const otherWrapper = otherItem.querySelector(".faq-toggle span");

          if (otherSpan && otherWrapper?.dataset.shortText) {
            otherSpan.innerHTML = otherWrapper.dataset.shortText;
            otherWrapper.dataset.expanded = "false";
          }
          if (otherArrow) {
            otherArrow.classList.remove("rotate--90");
          }
        }
      });

      const isExpanded = wrapper.dataset.expanded === "true";
      span.innerHTML = isExpanded ? wrapper.dataset.shortText : wrapper.dataset.fullText;
      wrapper.dataset.expanded = (!isExpanded).toString();
      svg.classList.toggle("rotate--90", !isExpanded);
    });
  });
});
