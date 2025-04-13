document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".faq-preview").forEach(preview => {
    const fullText = preview.dataset.answer;
    const shortPreview = fullText.split(" ").slice(0, 3).join(" ") + " ...";  
    preview.innerText = shortPreview;
    preview.setAttribute("data-original-text", shortPreview);
  });
});
function toggleFAQ(element) {
  const faqItem = element.closest('.faq-item');
  const preview = faqItem.querySelector('.faq-preview');
  const answer = faqItem.querySelector('.faq-answer');
  const arrow = faqItem.querySelector('.faq-toggle svg');

  const fullAnswer = preview.dataset.answer || preview.getAttribute('data-full-answer');
  const originalText = preview.getAttribute('data-original-text');

  const isExpanded = preview.classList.contains('expanded');

  document.querySelectorAll('.faq-preview').forEach(pre => {
    if (pre.classList.contains('expanded')) {
      pre.innerText = pre.getAttribute('data-original-text');
      pre.classList.remove('expanded');
      pre.style.opacity = '1';
    }
  });

  document.querySelectorAll('.faq-toggle svg').forEach(svg => svg.classList.remove('rotate'));

  document.querySelectorAll('.faq-toggle').forEach(btn => btn.disabled = false); 

  if (!isExpanded) {
    preview.style.opacity = '0';
    setTimeout(() => {
      preview.innerText = fullAnswer;
      preview.classList.add('expanded');
      arrow.classList.add('rotate');
      preview.style.opacity = '1';
      element.disabled = true; 
    }, 400);
  }
}
