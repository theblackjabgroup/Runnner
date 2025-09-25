document.querySelectorAll('.main-404-button').forEach(btn => {
  if (btn.dataset.delay) {
    btn.style.setProperty('--animation-delay', btn.dataset.delay);
  }
});


