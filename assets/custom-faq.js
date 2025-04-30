document.addEventListener("DOMContentLoaded", () => {
  const urlPattern = /(https?:\/\/[^\s<]+(?:\.[a-z]{2,})(?:\/[^\s<]*)?)/gi;

  document.querySelectorAll(".faq-item").forEach(item => {
    const preview = item.querySelector(".faq-preview");
    const answer = item.querySelector(".faq-answer");

    const fullText = preview.dataset.answer || "";

    const styleClass = 'font-bold underline break-all';

    const convertLinks = (text) => {
      return text.replace(urlPattern, match => {
        return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="${styleClass}">${match}</a>`;
      });
    };

    const fullWithLinks = convertLinks(fullText);
    const shortRaw = fullText.split(" ").slice(0, 3).join(" ") + " ...";
    const shortWithLinks = convertLinks(shortRaw);

    preview.innerHTML = shortWithLinks;
    preview.dataset.shortText = shortWithLinks;
    preview.dataset.fullText = fullWithLinks;

    answer.innerHTML = fullWithLinks;
  });

  document.querySelectorAll(".faq-item").forEach(item => {
    const row = item.querySelector(".faq-row");
    const btn = item.querySelector(".faq-toggle");
    const preview = item.querySelector(".faq-preview");
    const arrow = item.querySelector(".arrow-svg");

    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-expanded", "false");

    const doToggle = () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";

      if (!expanded) {
        preview.innerHTML = preview.dataset.fullText;
        arrow.classList.add("rotate-90");
        btn.setAttribute("aria-expanded", "true");
        row.setAttribute("aria-expanded", "true");
      } else {
        preview.innerHTML = preview.dataset.shortText;
        arrow.classList.remove("rotate-90");
        btn.setAttribute("aria-expanded", "false");
        row.setAttribute("aria-expanded", "false");
      }
    };

    row.addEventListener("click", doToggle);
    row.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        doToggle();
      }
    });
    btn.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        doToggle();
      }
    });
  });
});
