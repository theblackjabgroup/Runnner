document.addEventListener("DOMContentLoaded", () => {
  const urlPattern = /(https?:\/\/[^\s<]+(?:\.[a-z]{2,})(?:\/[^\s<]*)?)/gi;

  document.querySelectorAll(".faq-item").forEach(item => {
    const preview = item.querySelector(".faq-preview");
    const answer = item.querySelector(".faq-answer");

    const fullText = preview.dataset.answer || "";
    preview.classList.add("break-words");

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

  document.querySelectorAll(".faq-item").forEach(item => {
    const row = item.querySelector(".faq-row");
    const btn = item.querySelector(".faq-toggle");
    const preview = item.querySelector(".faq-preview");
    const arrowContainer = item.querySelector(".arrow-container");

    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-expanded", "false");

    // Insert single SVG with default arrow path
    arrowContainer.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="arrow-svg inline-block"
      fill="none" viewBox="0 0 14 14" stroke-width="1.5" stroke="currentColor"
      stroke-linecap="round" stroke-linejoin="round" style="width:24px; height:24px; margin-right:35px;">
        <path id="arrow-path" d="M7.47241 7.47241L7.47241 1.00001M7.47241 1.00001L1.00001 1.00001M7.47241 1.00001L1.00001 7.47241"/>
      </svg>
    `;

    const arrowSvg = arrowContainer.querySelector(".arrow-svg");
    const arrowPath = arrowSvg.querySelector("#arrow-path");

    const defaultPath = "M7.47241 7.47241L7.47241 1.00001M7.47241 1.00001L1.00001 1.00001M7.47241 1.00001L1.00001 7.47241";
    const expandedPath = "M1.1875 7.7334H7.6599M7.6599 7.7334V1.261M7.6599 7.7334L1.1875 1.261";

    const flipDuration = 500;

    const doToggle = () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      arrowSvg.style.transition = `transform ${flipDuration / 2}ms ease-in`;
      arrowSvg.style.transformOrigin = "center center";
      arrowSvg.style.transform = "rotateX(90deg)";

      setTimeout(() => {
        if (!expanded) {
          preview.innerHTML = preview.dataset.fullText;
          arrowPath.setAttribute("d", expandedPath);
          btn.setAttribute("aria-expanded", "true");
          row.setAttribute("aria-expanded", "true");
        } else {
          preview.innerHTML = preview.dataset.shortText;
          arrowPath.setAttribute("d", defaultPath);
          btn.setAttribute("aria-expanded", "false");
          row.setAttribute("aria-expanded", "false");
        }
        arrowSvg.style.transition = `transform ${flipDuration / 2}ms ease-out`;
        arrowSvg.style.transform = "rotateX(0deg)";
      }, flipDuration / 2);
    };

    row.addEventListener("click", (e) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === "") {
        doToggle();
      }
    });

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
