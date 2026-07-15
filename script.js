/* script.js */

// Initialize Lucide Icons on DOMContentLoaded so they render as early as possible
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
});

// Initialize GSAP ScrollTrigger and animations on window 'load'
// This ensures all styling from Tailwind Play CDN, Google Fonts, and images are fully computed
// preventing layout shifts from breaking ScrollTrigger's position calculations.
window.addEventListener('load', () => {
  // Register GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Setup Scroll Entrance Animations for Sections
  initScrollAnimations();

  // Setup Football Rolling & Shooting Animation
  initFootballAnimation();

  // Safe margin refresh to handle any late asynchronous layout shifts
  setTimeout(() => {
    ScrollTrigger.refresh();
  }, 250);
});

/* ==========================================================================
   1. GSAP Scroll Entrance Animations (Hybrid IntersectionObserver for 100% Iframe/Sandbox Reliability)
   ========================================================================== */
function initScrollAnimations() {
  // Use native browser IntersectionObserver for bulletproof viewport entry detection (perfect for nested iframes/sandboxes)
  const observerOptions = {
    root: null, // viewport
    rootMargin: "0px 0px -12% 0px", // Trigger when elements are slightly inside the viewport
    threshold: 0.05 // Trigger as soon as 5% of the section is visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const section = entry.target;
        
        // Find elements to animate inside this section
        const rawElements = Array.from(section.querySelectorAll('h2, h3, p, .img-placeholder, .bg-pitch-card'));
        
        // Filter out nested elements to prevent double animations
        const animElements = rawElements.filter(el => {
          let parent = el.parentElement;
          while (parent && parent !== section) {
            if (rawElements.includes(parent)) {
              return false; // Skip nested child since its parent is already being animated
            }
            parent = parent.parentElement;
          }
          return true;
        });

        if (animElements.length > 0) {
          // Play smooth GSAP animation
          gsap.to(animElements, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: "power2.out",
            overwrite: "auto"
          });
        }
        
        // Stop observing this section after it has played once
        observer.unobserve(section);
      }
    });
  }, observerOptions);

  // Set initial states and observe all sections
  gsap.utils.toArray('section').forEach(section => {
    // Select potential animatable elements
    const rawElements = Array.from(section.querySelectorAll('h2, h3, p, .img-placeholder, .bg-pitch-card'));
    
    // Filter out nested descendants
    const animElements = rawElements.filter(el => {
      let parent = el.parentElement;
      while (parent && parent !== section) {
        if (rawElements.includes(parent)) {
          return false;
        }
        parent = parent.parentElement;
      }
      return true;
    });

    if (animElements.length > 0) {
      // Set initial hidden state immediately (prevents layout flash)
      gsap.set(animElements, { opacity: 0, y: 35 });
      
      // Start observing
      observer.observe(section);
    }
  });
}

/* ==========================================================================
   2. Special Football Roll & Shoot System
   ========================================================================== */
let isGoalScored = false;

function initFootballAnimation() {
  const ball = document.getElementById('scroll-football');
  const goal = document.getElementById('soccer-goal');
  const goalNet = document.getElementById('goal-net');
  
  if (!ball || !goal) return;

  // Master timeline for the entire page scroll (Touchline Track)
  const mainScrollTl = gsap.timeline({
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom-=500px bottom",
      scrub: 0.5,
    }
  });

  // Roll ball down the sidebar touchline during main page scroll
  mainScrollTl.to(ball, {
    y: "65vh", // Move down the viewport
    rotation: 1800, // Roll rotation
    ease: "none"
  });

  // Timeline for the final shot into the goal (triggered when footer/goal enters)
  const shotTl = gsap.timeline({
    scrollTrigger: {
      trigger: "footer",
      start: "top bottom", // Starts when footer top hits viewport bottom
      end: "bottom bottom", // Ends when fully scrolled to footer bottom
      scrub: 0.5,
      onUpdate: (self) => {
        // Trigger goal effect exactly at 100% progress
        if (self.progress >= 0.98 && !isGoalScored) {
          triggerGoalEffect();
        } else if (self.progress < 0.95 && isGoalScored) {
          resetGoalEffect();
        }
      }
    }
  });

  // Animate ball departing sideline and shooting centered inside the net
  shotTl.to(ball, {
    // Dynamically translate to viewport center (with mobile adjustment)
    x: () => {
      const isMobile = window.innerWidth < 768;
      const startOffset = isMobile ? 6 : -14; // match tailwind right placement
      const centerShift = -window.innerWidth / 2 + (isMobile ? 18 : 28);
      return centerShift + startOffset;
    },
    y: "85vh", // Align height inside the goal mouth
    scale: 0.55, // Shrink to simulate depth entry into the net
    rotation: "+=540", // Faster spin during shot
    ease: "power1.out"
  });
}

/* ==========================================================================
   3. Goal Celebration & Particles Effect
   ========================================================================== */
function triggerGoalEffect() {
  isGoalScored = true;
  
  // 1. Shake the netting
  const net = document.getElementById('goal-net');
  if (net) {
    net.classList.add('net-shake');
  }

  // 2. Play subtle impact sound simulation or visual glow (Gold glow)
  const goalSvg = document.getElementById('soccer-goal');
  if (goalSvg) {
    gsap.to(goalSvg, { filter: "drop-shadow(0px 0px 20px rgba(251,191,36,0.85))", duration: 0.2 });
  }

  // 3. Show the glowing success overlay inside the goal
  const successOverlay = document.getElementById('goal-success-overlay');
  const successBanner = document.getElementById('goal-success-banner');
  if (successOverlay && successBanner) {
    successOverlay.classList.remove('pointer-events-none');
    successOverlay.classList.add('opacity-100');
    
    gsap.to(successBanner, {
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.5)"
    });

    // Generate confetti blast inside the goal success overlay
    createConfettiBlast(successOverlay);
  }
}

function resetGoalEffect() {
  isGoalScored = false;
  
  // Remove net shake class
  const net = document.getElementById('goal-net');
  if (net) net.classList.remove('net-shake');

  // Reset goal glow
  const goalSvg = document.getElementById('soccer-goal');
  if (goalSvg) {
    gsap.to(goalSvg, { filter: "none", duration: 0.2 });
  }

  // Hide success overlay
  const successOverlay = document.getElementById('goal-success-overlay');
  const successBanner = document.getElementById('goal-success-banner');
  if (successOverlay && successBanner) {
    successOverlay.classList.add('pointer-events-none');
    successOverlay.classList.remove('opacity-100');
    
    gsap.set(successBanner, { scale: 0.9 });
  }
}

// Function to scroll smoothly to the top of the page
function scrollToTop() {
  resetGoalEffect();
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Custom CSS-based particle confetti system
function createConfettiBlast(parent) {
  const colors = ['#10b981', '#34d399', '#ffffff', '#fbbf24', '#f59e0b'];
  const particleCount = window.innerWidth < 768 ? 35 : 70;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    const size = gsap.utils.random(6, 12);
    const color = gsap.utils.random(colors);
    
    // Style particle
    particle.className = "absolute rounded-full pointer-events-none z-50";
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.backgroundColor = color;
    particle.style.left = "50%";
    particle.style.top = "50%";
    
    parent.appendChild(particle);

    // Blast outwards
    const angle = gsap.utils.random(0, Math.PI * 2);
    const distance = gsap.utils.random(100, 350);
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance - gsap.utils.random(50, 150); // lift upward

    gsap.to(particle, {
      x: destX,
      y: destY,
      rotation: gsap.utils.random(-360, 360),
      opacity: 0,
      scale: 0.2,
      duration: gsap.utils.random(1.2, 2.2),
      ease: "power3.out",
      onComplete: () => {
        particle.remove();
      }
    });
  }
}

/* ==========================================================================
   4. Gallery Lightbox System (Vanilla JS)
   ========================================================================== */
let galleryImages = [];

function initGalleryData() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  
  const items = Array.from(grid.querySelectorAll('.group.cursor-pointer'));
  if (items.length === 0) return;
  
  galleryImages = items.map((item, index) => {
    const img = item.querySelector('img');
    const titleEl = item.querySelector('.group-hover\\:opacity-100 p') || item.querySelector('p');
    const codeEl = item.querySelector('code');
    
    const src = img ? img.getAttribute('src') : `photo${index + 8}.jpg`;
    const title = titleEl ? titleEl.innerText : (img ? img.getAttribute('alt') : 'تصویر گالری');
    const code = codeEl ? codeEl.innerText : `photo${index + 8}.jpg`;
    
    return { src, title, code };
  });
}

let currentLightboxIndex = 0;

function openLightbox(index) {
  initGalleryData();
  currentLightboxIndex = index;
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');
  const indexIndicator = document.getElementById('lightbox-index');
  const placeholderTitle = document.getElementById('lightbox-placeholder-title');
  const placeholderCode = document.getElementById('lightbox-placeholder-code');

  if (!lightbox || !img) return;

  // Reveal Modal
  lightbox.classList.remove('pointer-events-none');
  lightbox.classList.add('opacity-100');

  // Load Image and captions with fallback
  updateLightboxContent();
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.classList.add('pointer-events-none');
    lightbox.classList.remove('opacity-100');
  }
}

function navigateLightbox(direction) {
  if (galleryImages.length === 0) {
    initGalleryData();
  }
  
  // RTL adjustments: direction -1 is prev, +1 is next
  currentLightboxIndex += direction;
  
  if (currentLightboxIndex < 0) {
    currentLightboxIndex = galleryImages.length - 1;
  } else if (currentLightboxIndex >= galleryImages.length) {
    currentLightboxIndex = 0;
  }

  updateLightboxContent();
}

function updateLightboxContent() {
  const img = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');
  const indexIndicator = document.getElementById('lightbox-index');
  const placeholderTitle = document.getElementById('lightbox-placeholder-title');
  const placeholderCode = document.getElementById('lightbox-placeholder-code');
  
  if (galleryImages.length === 0) {
    initGalleryData();
  }
  
  const currentItem = galleryImages[currentLightboxIndex];

  if (!img || !currentItem) return;

  // Reset opacity for transition feel
  img.style.opacity = '0';

  // Fallback setup: if physical photo missing, hide <img> and show fallback
  img.onerror = function() {
    this.classList.add('hidden');
    if (placeholderTitle) placeholderTitle.innerText = currentItem.title;
    if (placeholderCode) placeholderCode.innerText = currentItem.code;
  };

  img.onload = function() {
    this.classList.remove('hidden');
    this.style.opacity = '1';
  };

  img.src = currentItem.src;
  
  if (caption) caption.innerText = currentItem.title;
  if (indexIndicator) indexIndicator.innerText = `تصویر ${currentLightboxIndex + 1} از ${galleryImages.length}`;
}

// Attach functions to window scope to allow inline HTML onclick triggers
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.navigateLightbox = navigateLightbox;
window.scrollToTop = scrollToTop;
window.resetGoalEffect = resetGoalEffect;
