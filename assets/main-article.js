// Get canonical URL (works in all environments including customize view)
function getCanonicalUrl() {
  var canonical = document.querySelector('link[rel="canonical"]');
  return canonical ? canonical.href : window.location.href;
}

document.addEventListener('DOMContentLoaded', function () {
  // Main Article Fade-Up Animation
  const animatedElements = document.querySelectorAll('.article-content-animated, .related-articles-animated');

  // Set initial state for all elements
  animatedElements.forEach((element, index) => {
    element.style.transitionDelay = `${index * 0.2}s`;
  });

  // Create intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Trigger fade-up animation by adding animate class
          entry.target.classList.add('animate');

          // Stop observing this element
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1,
    }
  );

  // Observe all animated elements
  animatedElements.forEach((element) => {
    observer.observe(element);
  });

  // Mobile subheader padding
  if (window.innerWidth <= 768) {
  const subheaders = document.querySelectorAll('.subclass-subheader');
  if (subheaders.length > 0) {
    subheaders[subheaders.length - 1].classList.add('no-padding-bottom');
  }
}
// Check if parallax is enabled
const parallaxSection = document.querySelector('#parallax-section');
const isParallaxEnabled = parallaxSection?.dataset.parallaxEnabled === 'true';

const headingEl = document.querySelector('.animated-text');
const overlay = document.querySelector('.overlay-content');
const parallaxImage = document.querySelector('.parallax-image-overlay img');
const container = document.querySelector('.parallax-container');
const OFFSET_TOP = 55;
let ticking = false;
let resizeTimeout, orientationTimeout;

// Animate heading letters
if (headingEl) {
  const text = headingEl.innerText;
  headingEl.innerHTML = [...text].map((char, i) => {
    const delay = i * 0.08;
    return `<span class="letter" style="animation-delay: ${delay}s;">${char === ' ' ? '&nbsp;' : char}</span>`;
  }).join('');

  const delayTotal = (text.length - 1) * 0.07 + 0.8;
  const dateEl = document.querySelector('.date-tag');
  const arrowEl = document.querySelector('svg');

  if (dateEl) dateEl.style.animationDelay = `${delayTotal + 0.2}s`;
  if (arrowEl) arrowEl.style.animationDelay = `${delayTotal + 0.4}s`;

  // Only apply parallax image effects if parallax is enabled
  if (parallaxImage && isParallaxEnabled) {
    parallaxImage.style.position = 'absolute';
    parallaxImage.style.top = '0';
    parallaxImage.style.left = '0';
    parallaxImage.style.width = '100%';
    parallaxImage.style.opacity = '0';
    parallaxImage.style.transform = 'translateY(40px)';
    parallaxImage.style.transition = 'none';

    setTimeout(() => {
      parallaxImage.style.transition = 'opacity 1.2s ease-out, transform 1.2s ease-out';
      parallaxImage.style.opacity = '1';
      parallaxImage.style.transform = 'translateY(0)';
    }, delayTotal * 1000);
  } else if (parallaxImage && !isParallaxEnabled) {
    // Static image - just fade in
    parallaxImage.style.opacity = '0';
    parallaxImage.style.transition = 'opacity 1.2s ease-out';
    
    setTimeout(() => {
      parallaxImage.style.opacity = '1';
    }, delayTotal * 1000);
  }
}

// ✅ Parallax movement - only if enabled
function parallaxScrollEffect() {
  if (!parallaxImage || !container || !isParallaxEnabled) return;

  const rect = container.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  const containerTop = rect.top + scrollY;
  const distanceScrolled = scrollY - containerTop;

  const speed = 0.6; // Adjust the speed factor
  const offsetY = distanceScrolled * speed;

  parallaxImage.style.transform = `translateY(${offsetY}px)`;
}

function onScroll() {
  ticking = false;
  if (!overlay || !container) return;

  // Only apply parallax scroll effects if enabled
  if (isParallaxEnabled) {
    const containerRect = container.getBoundingClientRect();
    const overlayHeight = overlay.offsetHeight;
    const startParallax = containerRect.top <= OFFSET_TOP;
    const stopPoint = containerRect.bottom - overlayHeight - OFFSET_TOP;
    const shouldStopParallax = stopPoint <= OFFSET_TOP;

    overlay.classList.remove('mobile-fixed', 'mobile-absolute');

    if (startParallax && !shouldStopParallax) {
      overlay.style.position = 'fixed';
      overlay.style.top = `${OFFSET_TOP}px`;
      overlay.style.zIndex = '2';
      overlay.style.transform = 'translateZ(0)';
      overlay.style.width = '100vw';
      overlay.style.maxWidth = '100vw';

    } else if (shouldStopParallax) {
      overlay.style.position = 'absolute';
      overlay.style.top = `${Math.max(0, container.offsetHeight - overlayHeight - OFFSET_TOP)}px`;
      overlay.style.zIndex = '';
      overlay.style.transition = 'none';
      overlay.style.transform = 'translateY(-20px)';
      overlay.style.opacity = '1';
      overlay.style.width = '100vw';
    } else {
      overlay.style.position = 'relative';
      overlay.style.top = '';
      overlay.style.left = '';
      overlay.style.width = '';
      overlay.style.zIndex = '';
      overlay.style.transform = '';
      overlay.style.padding = '';
      overlay.style.maxWidth = '';
    }

    parallaxScrollEffect(); 
  }
}

function requestTick() {
  if (!ticking) {
    requestAnimationFrame(onScroll);
    ticking = true;
  }
}

function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(requestTick, 16);
}

function handleOrientationChange() {
  clearTimeout(orientationTimeout);
  orientationTimeout = setTimeout(requestTick, 100);
}

// Only add parallax scroll listeners if parallax is enabled
if (isParallaxEnabled) {
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleOrientationChange, { passive: true });
  
  requestTick();
}

if (parallaxImage && parallaxImage.src) {
  const img = new Image();
  img.src = parallaxImage.src;
}
});