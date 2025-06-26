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
    const wrapper = item.querySelector(".faq-toggle span");
    if (!wrapper) return;

    const svg = wrapper.querySelector("svg");
    const textNode = Array.from(wrapper.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
    if (!svg || !textNode) return;

    svg.classList.add("arrow-svg1");

    const fullText = textNode.textContent.trim().replace(/\s+/g, " ");
    const shortText = fullText.split(" ").slice(0, 6).join(" ") + "...";
    const lines = fullText.split(". ").filter(Boolean).map(line => convertLinks(line));

    wrapper.innerHTML = "";
    wrapper.style.alignItems = "flex-start";
    wrapper.style.gap = "10px";

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "faq-text-wrapper";
    contentWrapper.style.maxHeight = "100px";
    contentWrapper.style.overflow = "hidden";
    contentWrapper.style.transition = "max-height 0.6s ease";

    const contentSpan = document.createElement("span");
    contentSpan.className = "preview-text block select-text selection:bg-yellow-200 selection:text-black";
    contentSpan.innerHTML = convertLinks(shortText);

    contentWrapper.appendChild(contentSpan);
    wrapper.appendChild(svg);
    wrapper.appendChild(contentWrapper);

    wrapper.dataset.shortText = convertLinks(shortText);
    wrapper.dataset.fullLines = JSON.stringify(lines);
    wrapper.dataset.expanded = "false";

    item.addEventListener("click", () => {
      const isExpanded = wrapper.dataset.expanded === "true";
      const fullLines = JSON.parse(wrapper.dataset.fullLines);
      wrapper.dataset.expanded = (!isExpanded).toString();
      svg.classList.toggle("rotate--90", !isExpanded);

      if (!isExpanded) {
        contentSpan.innerHTML = "";

        let i = 0;
        contentWrapper.style.maxHeight = "0px";

        setTimeout(() => {
          const interval = setInterval(() => {
            if (i >= fullLines.length) {
              clearInterval(interval);
              contentWrapper.style.maxHeight = contentSpan.scrollHeight + 40 + "px";
              return;
            }

            const line = document.createElement("div");
            line.innerHTML = fullLines[i];
            line.style.opacity = "0";
            line.style.transition = "opacity 2.3s ease";
            contentSpan.appendChild(line);
            requestAnimationFrame(() => {
              line.style.opacity = "1";
            });

            contentWrapper.style.maxHeight = contentSpan.scrollHeight + 40 + "px";
            i++;
          }, 100);
        }, 100);
      } else {
        contentSpan.innerHTML = wrapper.dataset.shortText;
        contentWrapper.style.maxHeight = "100px";
      }
    });
  });
});
