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

  document.querySelectorAll(".faq-row").forEach(button => {
    const item = button.closest(".faq-item");
    const arrow = button.querySelector(".rotate-arrow");
    const preview = item.querySelector(".faq-preview");
    const answer = item.querySelector(".faq-answer");

    const toggle = () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", !expanded);
      arrow.classList.toggle("rotated", !expanded);

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
