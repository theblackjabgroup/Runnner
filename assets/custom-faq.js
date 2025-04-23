document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".faq-preview").forEach(preview => {
    const fullText    = preview.dataset.answer || "";
    const shortText   = fullText.split(" ").slice(0, 3).join(" ") + " ...";
    preview.innerText            = shortText;
    preview.dataset.shortText    = shortText;
    preview.dataset.fullText     = fullText;
  });

  document.querySelectorAll(".faq-item").forEach(item => {
    const row     = item.querySelector(".faq-row");
    const btn     = item.querySelector(".faq-toggle");
    const preview = item.querySelector(".faq-preview");
    const arrow   = item.querySelector(".arrow-svg");

    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-expanded", "false");

    const doToggle = () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";

      if (!expanded) {
        preview.innerText = preview.dataset.fullText;
        arrow.classList.add("rotate-90");
        btn.setAttribute("aria-expanded", "true");
        row.setAttribute("aria-expanded", "true");
      } else {
        preview.innerText            = preview.dataset.shortText;
        arrow.classList.remove("rotate-90");
        btn.setAttribute("aria-expanded", "false");
        row.setAttribute("aria-expanded", "false");
      }
    };

    row.addEventListener("click",  doToggle);
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
