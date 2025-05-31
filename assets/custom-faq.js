document.addEventListener("DOMContentLoaded", () => {
  const urlPattern = /(https?:\/\/[^\s<]+(?:\.[a-z]{2,})(?:\/[^\s<]*)?)/gi;

  document.querySelectorAll(".faq-item").forEach(item => {
    const preview = item.querySelector(".faq-preview");
    const answer = item.querySelector(".faq-answer");

    if (!preview || !answer) return;

    const fullText = preview.dataset.answer || "";
    const styleClass = 'font-bold underline break-all';

    const convertLinks = (text) => {
      return text.replace(urlPattern, match => {
        return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="${styleClass}">${match}</a>`;
      });
    };

    const fullWithLinks = convertLinks(fullText);
    const shortRaw = fullText.split(" ").slice(0, 5).join(" ") + "...";
    const shortWithLinks = convertLinks(shortRaw);

    preview.innerHTML = shortWithLinks;
    preview.dataset.shortText = shortWithLinks;
    preview.dataset.fullText = fullWithLinks;

    answer.innerHTML = fullWithLinks;
  });

  const originalPath = "M1.1875 7.7334H7.6599M7.6599 7.7334V1.261M7.6599 7.7334L1.1875 1.261";
  const toggledPath = "M7.47241 7.47241L7.47241 1.00001M7.47241 1.00001L1.00001 1.00001M7.47241 1.00001L1.00001 7.47241";

  document.querySelectorAll(".faq-row").forEach(button => {
    const item = button.closest(".faq-item");
    const arrow = button.querySelector(".arrow-svg1");
    const path = arrow.querySelector("path");
    const preview = item.querySelector(".faq-preview");

   const toggle = () => {
  const expanded = button.getAttribute("aria-expanded") === "true";

  if (!expanded) {
    document.querySelectorAll(".faq-item.open").forEach(openItem => {
      if (openItem !== item) {
        const openButton = openItem.querySelector(".faq-row");
        const openArrow = openItem.querySelector(".arrow-svg1");
        const openPreview = openItem.querySelector(".faq-preview");
        openButton.setAttribute("aria-expanded", "false");
        openArrow.classList.remove("rotate--90");
        openPreview.innerHTML = openPreview.dataset.shortText;
        openItem.classList.remove("open");
      }
    });
  }

  button.setAttribute("aria-expanded", !expanded);
  arrow.classList.toggle("rotate--90", !expanded);
  preview.innerHTML = expanded ? preview.dataset.shortText : preview.dataset.fullText;
  item.classList.toggle("open", !expanded);
};


    button.addEventListener("click", (e) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === "") toggle();
    });

    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });
});
