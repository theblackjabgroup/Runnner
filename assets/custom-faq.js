document.querySelectorAll('.faq-item').forEach(item => {
    const row = item.querySelector('.faq-row');
    const answer = item.querySelector('.faq-answer');
    const arrow = item.querySelector('.arrow-svg');
    
    row.addEventListener('click', () => {
      const isOpen = answer.style.maxHeight && answer.style.maxHeight !== "0px";
      
      if (isOpen) return;
      
      document.querySelectorAll('.faq-answer').forEach(a => a.style.maxHeight = null);
      document.querySelectorAll('.arrow-svg').forEach(svg => svg.classList.remove('rotate'));
      
      document.querySelectorAll('.faq-preview').forEach(preview => {
        if (preview.classList.contains('expanded')) {
          const baseText = preview.getAttribute('data-original-text') || preview.textContent.split('...')[0].trim() + '...';
          preview.innerHTML = baseText;
          preview.classList.remove('expanded');
          preview.style.opacity = '1'; 
        }
      });
      
      answer.style.maxHeight = answer.scrollHeight + "px"; 
      arrow.classList.add('rotate');
    });
  });
  
  function toggleFAQ(element) {
    const faqItem = element.closest('.faq-item');
    const preview = faqItem.querySelector('.faq-preview');
    const answer = faqItem.querySelector('.faq-answer');
    const arrow = faqItem.querySelector('.faq-toggle svg');
    
    if (preview.classList.contains('expanded')) return;
    
    document.querySelectorAll('.faq-answer').forEach(a => a.style.maxHeight = null);
    document.querySelectorAll('.arrow-svg, .faq-toggle svg').forEach(svg => svg.classList.remove('rotate'));
    
    document.querySelectorAll('.faq-preview').forEach(preview => {
      if (preview.classList.contains('expanded')) {
        const baseText = preview.getAttribute('data-original-text') || preview.textContent.split('...')[0].trim() + '...';
        preview.innerHTML = baseText;
        preview.classList.remove('expanded');
        preview.style.opacity = '1'; 
      }
    });
    
    const fullAnswer = preview.getAttribute('data-answer');
    
    if (!preview.hasAttribute('data-original-text')) {
      preview.setAttribute('data-original-text', preview.textContent);
    }
    
    preview.style.opacity = '0';
    setTimeout(() => {
      const baseText = preview.textContent.split('...')[0].trim();
      preview.innerHTML = baseText + " " + fullAnswer;
      preview.classList.add('expanded');
      arrow.classList.add('rotate');
      preview.style.opacity = '1';
      answer.style.maxHeight = answer.scrollHeight + 'px'; 
    }, 400);
  }