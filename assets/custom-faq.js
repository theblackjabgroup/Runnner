document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".bandit-faq").forEach(section => {
    section.querySelectorAll(".faq-preview").forEach(preview => {
      const fullText = preview.dataset.answer || "";
      const shortPreview = fullText.split(" ").slice(0, 3).join(" ") + " ...";
      preview.innerText = shortPreview;
      preview.setAttribute("data-original-text", shortPreview);
    });
  });
});

function toggleFAQ(element, forceClose = false) {
  const faqItem = element.closest('.faq-item');
  const preview = faqItem.querySelector('.faq-preview');
  const answer = faqItem.querySelector('.faq-answer');
  const arrow = faqItem.querySelector('.faq-toggle svg');
  const toggleButton = faqItem.querySelector('.faq-toggle');

  const fullAnswer = preview.dataset.answer || preview.getAttribute('data-full-answer');
  const originalText = preview.getAttribute('data-original-text');
  const isExpanded = preview.classList.contains('expanded');

  if (!isExpanded && !forceClose) {
    preview.style.opacity = '0';
    setTimeout(() => {
      preview.innerText = fullAnswer;
      preview.classList.add('expanded');
      arrow.classList.add('rotate');
      preview.style.opacity = '1';

      toggleButton.setAttribute("aria-expanded", "true");
      toggleButton.disabled = true;
    }, 400);
  } else {
    preview.innerText = originalText;
    preview.classList.remove('expanded');
    preview.style.opacity = '1';
    arrow.classList.remove('rotate');

    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.disabled = false;
  }
}


function handleRowClick(event, rowElement) {
  const clickedEl = event.target;
  const isInsideToggle = clickedEl.closest('.faq-toggle');
  const isInsidePreview = clickedEl.closest('.faq-preview');
  const isInsideAnswer = clickedEl.closest('.faq-answer');
  const faqItem = rowElement.closest('.faq-item');
  const preview = faqItem.querySelector('.faq-preview');
  const isExpanded = preview.classList.contains('expanded');

  if (isInsideToggle || isInsidePreview || isInsideAnswer) {
    return;
  }
  
  toggleFAQ(preview, isExpanded); 
}
