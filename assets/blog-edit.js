document.addEventListener('DOMContentLoaded', function() {
  const headingEl = document.getElementById('animated-heading');
  if (headingEl) {
    const text = headingEl.innerText;
    let html = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i] === ' ' ? '&nbsp;' : text[i];
      const delay = i * 0.05;
      html += `<span class="letter" style="animation-delay: ${delay}s;">${char}</span>`;
    }
    
    headingEl.innerHTML = html;
    
    const lastLetterDelay = (text.length - 1) * 0.05;
    const textAnimationCompleteTime = lastLetterDelay + 0.2;
    
    const dateEl = document.querySelector('.date-tag');
    if (dateEl) {
      dateEl.style.animationDelay = `${textAnimationCompleteTime + 0.2}s`;
    }
    
    const excerptEl = document.querySelector('.card-excerpt');
    if (excerptEl) {
      excerptEl.style.animationDelay = `${textAnimationCompleteTime + 0.6}s`;
    }
    const arrowEl = document.querySelector('svg');
    if (arrowEl) {
      arrowEl.style.animationDelay = `${textAnimationCompleteTime + 0.4}s`;
    }
  }
});