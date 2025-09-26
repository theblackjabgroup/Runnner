// Image with Text Section JavaScript
// Handles animations, video controls, and interactive elements

window.addEventListener('load', function () {
  // Overlay animation functionality - handle all overlay elements
  const overlays = document.querySelectorAll('[class*="image-with-text-media-overlay-"]');
  overlays.forEach((overlay) => {
    const overlayDuration = overlay.dataset.duration || 1000;
    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.addEventListener('transitionend', () => overlay.remove());
    }, parseInt(overlayDuration));
  });
});

document.addEventListener('DOMContentLoaded', function () {
  // Initialize all image-with-text sections
  const sections = document.querySelectorAll('[class*="image-with-text-media-section"]');

  sections.forEach((section) => {
    const sectionId = section.id.replace('ImageWithText-', '');
    initializeSection(section, sectionId);
  });
});

function initializeSection(section, sectionId) {
  // Get section settings from data attributes or defaults
  const enableTextAnimation = section.dataset.enableTextAnimation === 'true';
  const enableButtonAnimation = section.dataset.enableButtonAnimation === 'true';
  const buttonAnimationDelay = parseFloat(section.dataset.buttonAnimationDelay) || 1.5;
  const enableOverlayAnimation = section.dataset.enableOverlayAnimation === 'true';
  const overlayDuration = parseFloat(section.dataset.overlayDuration) || 1;

  // Create and inject animation styles
  const styleElement = document.createElement('style');
  styleElement.textContent = `
        @keyframes letterAppear {
            0% {
                transform: translateX(10000%);
                opacity: 0;
            }
            100% {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes buttonAppear {
            0% {
                transform: translateY(100px);
                opacity: 0;
            }
            100% {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .button-animation.animated {
            animation: buttonAppear 0.8s forwards;
            animation-delay: ${buttonAnimationDelay}s; 
        }
    `;
  document.head.appendChild(styleElement);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Set initial states based on animation settings
  if (prefersReducedMotion || (!enableTextAnimation && !enableButtonAnimation)) {
    section.classList.add('no-animation');
  } else {
    // For elements that should be animated, ensure they start hidden
    if (enableTextAnimation) {
      section
        .querySelectorAll('.image-with-text-image-with-text-letter-animation, .date-animation, .text-animation')
        .forEach((element) => {
          element.style.opacity = '0';
        });
    } else {
      section
        .querySelectorAll('.image-with-text-image-with-text-letter-animation, .date-animation, .text-animation')
        .forEach((element) => {
          element.style.opacity = '1';
        });
    }

    if (enableButtonAnimation) {
      section.querySelectorAll('.button-animation').forEach((button) => {
        button.style.opacity = '0';
      });
    } else {
      section.querySelectorAll('.button-animation').forEach((button) => {
        button.style.opacity = '1';
      });
    }
  }

  if (prefersReducedMotion) {
    // For reduced motion, make everything visible immediately
    section
      .querySelectorAll(
        '.image-with-text-image-with-text-letter-animation, .date-animation, .text-animation, .button-animation'
      )
      .forEach((element) => {
        element.style.opacity = '1';
      });
  } else {
    // Set up intersection observer for animations
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (enableTextAnimation) {
              // Handle heading animations
              const headingElements = entry.target.querySelectorAll(
                '.image-with-text-image-with-text-letter-animation'
              );

              headingElements.forEach((element) => {
                const text = element.textContent.trim();
                element.textContent = '';
                element.classList.add('image-with-text-letter-animation-container', 'animation-ready');
                element.setAttribute('aria-label', text);
                element.style.opacity = '1'; // Make container visible

                // Split the text into words first
                const words = text.split(' ');

                let letterIndex = 0;
                words.forEach((word, wordIndex) => {
                  // Create a word container span
                  const wordSpan = document.createElement('span');
                  wordSpan.classList.add('animated-word');
                  wordSpan.style.display = 'inline-block';
                  wordSpan.style.whiteSpace = 'nowrap'; // Prevent word breaking

                  for (let i = 0; i < word.length; i++) {
                    const letterSpan = document.createElement('span');
                    letterSpan.classList.add('animated-letter');
                    letterSpan.textContent = word[i];
                    letterSpan.setAttribute('aria-hidden', 'true');

                    letterSpan.style.animation = `letterAppear 1s forwards`;
                    letterSpan.style.animationDelay = `${letterIndex * 0.07}s`;
                    letterIndex++;

                    wordSpan.appendChild(letterSpan);
                  }

                  element.appendChild(wordSpan);

                  // Add space between words (except for the last word)
                  if (wordIndex < words.length - 1) {
                    const spaceSpan = document.createElement('span');
                    spaceSpan.classList.add('animated-space');
                    spaceSpan.innerHTML = '&nbsp;';
                    spaceSpan.style.animation = `letterAppear 1s forwards`;
                    spaceSpan.style.animationDelay = `${letterIndex * 0.07}s`;
                    letterIndex++;
                    element.appendChild(spaceSpan);
                  }
                });
              });

              // Handle text content animations - similar approach for paragraph text
              const textContentElements = entry.target.querySelectorAll(
                '.image-with-text-text-content p.image-with-text-image-with-text-letter-animation'
              );

              textContentElements.forEach((element) => {
                const text = element.textContent.trim();
                element.textContent = '';
                element.classList.add('image-with-text-letter-animation-container', 'animation-ready');
                element.setAttribute('aria-label', text);
                element.style.opacity = '1'; // Make container visible

                // Split the text into words first
                const words = text.split(' ');

                let letterIndex = 0;
                words.forEach((word, wordIndex) => {
                  // Create a word container span
                  const wordSpan = document.createElement('span');
                  wordSpan.classList.add('animated-word');
                  wordSpan.style.display = 'inline-block';
                  wordSpan.style.whiteSpace = 'nowrap'; // Prevent word breaking

                  for (let i = 0; i < word.length; i++) {
                    const letterSpan = document.createElement('span');
                    letterSpan.classList.add('animated-letter');
                    letterSpan.textContent = word[i];
                    letterSpan.setAttribute('aria-hidden', 'true');

                    letterSpan.style.animation = `letterAppear 1s forwards`;
                    letterSpan.style.animationDelay = `${letterIndex * 0.07}s`;
                    letterIndex++;

                    wordSpan.appendChild(letterSpan);
                  }

                  element.appendChild(wordSpan);

                  // Add space between words (except for the last word)
                  if (wordIndex < words.length - 1) {
                    const spaceSpan = document.createElement('span');
                    spaceSpan.classList.add('animated-space');
                    spaceSpan.innerHTML = '&nbsp;';
                    spaceSpan.style.animation = `letterAppear 1s forwards`;
                    spaceSpan.style.animationDelay = `${letterIndex * 0.07}s`;
                    letterIndex++;
                    element.appendChild(spaceSpan);
                  }
                });
              });

              // Handle date animations
              const dateElements = entry.target.querySelectorAll('.date-animation');
              dateElements.forEach((element, index) => {
                element.classList.add('animation-ready');
                element.style.opacity = '1';
                element.style.animation = 'buttonAppear 0.8s forwards';
                element.style.animationDelay = `${index * 0.2}s`;
              });

              // Handle text block animations
              const textElements = entry.target.querySelectorAll('.text-animation');
              textElements.forEach((element, index) => {
                element.classList.add('animation-ready');
                element.style.opacity = '1';
                element.style.animation = 'buttonAppear 0.8s forwards';
                element.style.animationDelay = `${index * 0.3}s`;
              });
            } else {
              // If text animation is disabled, make text visible immediately
              const textElements = entry.target.querySelectorAll(
                '.image-with-text-image-with-text-letter-animation, .date-animation, .text-animation'
              );
              textElements.forEach((element) => {
                element.style.opacity = '1';
              });
            }

            if (enableButtonAnimation) {
              const buttons = entry.target.querySelectorAll('.button-animation');
              buttons.forEach((button) => {
                button.classList.add('animation-ready');
                setTimeout(() => {
                  button.classList.add('animated');
                }, 100);
              });
            } else {
              const buttons = entry.target.querySelectorAll('.button-animation');
              buttons.forEach((button) => {
                button.style.opacity = '1';
              });
            }

            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    observer.observe(section);
  }

  // Button keyboard accessibility
  const buttons = section.querySelectorAll('.image-with-text-custom-button-css');
  buttons.forEach((button) => {
    button.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.click();
      }
    });
  });

  // Initialize video controls
  initializeVideoControls(section, sectionId);
}

// Video Controls Functionality
function initializeVideoControls(section, sectionId) {
  const muteBtn = document.getElementById('video-mute-button-' + sectionId);
  if (!muteBtn) return;

  const ytFrame = document.getElementById('youtube-player-' + sectionId);
  const vimeoFrame = document.getElementById('vimeo-player-' + sectionId);
  const shopifyVideo = document.getElementById('shopify-video-' + sectionId);
  let isMuted = true;

  function toggleIcon(muted) {
    const muteIcon = muteBtn.querySelector('.mute-icon');
    const unmuteIcon = muteBtn.querySelector('.unmute-icon');
    if (muted) {
      muteIcon.style.display = 'block';
      unmuteIcon.style.display = 'none';
      muteBtn.setAttribute('title', 'Unmute');
      muteBtn.setAttribute('aria-label', 'Unmute');
    } else {
      muteIcon.style.display = 'none';
      unmuteIcon.style.display = 'block';
      muteBtn.setAttribute('title', 'Mute');
      muteBtn.setAttribute('aria-label', 'Mute');
    }
  }

  // YouTube
  if (ytFrame) {
    if (!window._ytApiLoading) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window._ytApiLoading = true;
    }
    window._ytMuteReady = window._ytMuteReady || [];
    window._ytMuteReady.push(function () {
      const ytPlayer = new YT.Player('youtube-player-' + sectionId, {
        events: {
          onReady: function (event) {
            muteBtn.addEventListener('click', function () {
              if (isMuted) {
                ytPlayer.unMute();
                isMuted = false;
              } else {
                ytPlayer.mute();
                isMuted = true;
              }
              toggleIcon(isMuted);
            });
          },
        },
      });
    });
    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = function () {
        window._ytMuteReady.forEach(function (cb) {
          cb();
        });
      };
    }
  }

  // Vimeo
  if (vimeoFrame) {
    if (!window._vimeoApiLoading) {
      const vimeoScript = document.createElement('script');
      vimeoScript.src = 'https://player.vimeo.com/api/player.js';
      document.head.appendChild(vimeoScript);
      window._vimeoApiLoading = true;
    }
    function vimeoReady() {
      const vimeoPlayer = new Vimeo.Player(vimeoFrame);
      muteBtn.addEventListener('click', function () {
        if (isMuted) {
          vimeoPlayer.setVolume(1);
          isMuted = false;
        } else {
          vimeoPlayer.setVolume(0);
          isMuted = true;
        }
        toggleIcon(isMuted);
      });
    }
    if (window.Vimeo && window.Vimeo.Player) {
      vimeoReady();
    } else {
      const checkVimeo = setInterval(function () {
        if (window.Vimeo && window.Vimeo.Player) {
          clearInterval(checkVimeo);
          vimeoReady();
        }
      }, 100);
    }
  }

  // Shopify video
  if (shopifyVideo) {
    muteBtn.addEventListener('click', function () {
      if (isMuted) {
        shopifyVideo.muted = false;
        isMuted = false;
      } else {
        shopifyVideo.muted = true;
        isMuted = true;
      }
      toggleIcon(isMuted);
    });
  }

  // Hide button if no video
  if (!ytFrame && !vimeoFrame && !shopifyVideo) {
    muteBtn.style.display = 'none';
  }
}
