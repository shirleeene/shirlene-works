/* main.js — Portfolio interactions */

// ── Custom Cursor ──────────────────────────────
const cursor = document.getElementById('cursor');
const dot = document.getElementById('cursor-dot');

let mouseX = -100, mouseY = -100;
let cursorX = -100, cursorY = -100;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.left = mouseX + 'px';
  dot.style.top = mouseY + 'px';
});


function animateCursor() {
  cursorX += (mouseX - cursorX) * 0.12;
  cursorY += (mouseY - cursorY) * 0.12;
  cursor.style.left = cursorX + 'px';
  cursor.style.top = cursorY + 'px';
  requestAnimationFrame(animateCursor);
}

animateCursor();

// Hover states
const hoverEls = document.querySelectorAll('a, button, [data-hover]');
hoverEls.forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});




// ── Nav scroll behaviour ───────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Logo face bubble — follows mouse position on the logo ──
const navLogo = document.querySelector('.nav-logo');

const bubble = document.createElement('div');
bubble.className = 'logo-face-bubble';
bubble.innerHTML = `<img src="images/profile.png" />`;
document.body.appendChild(bubble);

let bx = 2, by = 2;   // current rendered position (lerped)
let tx = 5, ty = 1;   // target position
let floatRaf = null;
let isLogoHovered = false;


function getLogoRect() {
  return navLogo.getBoundingClientRect();
}

// Map mouse position within the logo to a small offset range
// so the bubble moves subtly in the direction the mouse is within the element
function updateTarget(mouseX, mouseY) {
  const rect = getLogoRect();

  // Normalise mouse position within the logo: -1 to +1 on each axis
  const nx = ((mouseX - rect.left) / rect.width)  * 2 - 1; // -1 = left edge, +1 = right edge
  const ny = ((mouseY - rect.top)  / rect.height) * 2 - 1; // -1 = top edge,  +1 = bottom edge

  // Base anchor: just to the bottom-right of the logo
  const anchorX = rect.right  + 16;
  const anchorY = rect.bottom + 16;

  // Shift the anchor slightly based on mouse position within logo
  const driftRange = { x: 22, y: 15 };

  tx = anchorX + nx * driftRange.x;
  ty = anchorY + ny * driftRange.y;
}

// Smooth float loop — lerps current position toward target
function floatLoop() {
  bx += (tx - bx) * 0.09;
  by += (ty - by) * 0.09;

  bubble.style.left = bx + 'px';
  bubble.style.top  = by + 'px';

  floatRaf = requestAnimationFrame(floatLoop);
}

navLogo.addEventListener('mouseenter', (e) => {
  isLogoHovered = true;
  const rect = getLogoRect();

  // Snap to anchor immediately so it doesn't fly in from off-screen
  bx = rect.right  + 16;
  by = rect.bottom + 16;
  tx = bx; ty = by;

  bubble.style.left = bx + 'px';
  bubble.style.top  = by + 'px';
  bubble.classList.add('visible');

  if (!floatRaf) floatLoop();

  // Seed the first target from current mouse position
  updateTarget(e.clientX, e.clientY);
});

navLogo.addEventListener('mousemove', (e) => {
  if (!isLogoHovered) return;
  updateTarget(e.clientX, e.clientY);
});

navLogo.addEventListener('mouseleave', () => {
  isLogoHovered = false;
  bubble.classList.remove('visible');

  // Stop float loop after fade-out
  setTimeout(() => {
    if (!isLogoHovered) {
      cancelAnimationFrame(floatRaf);
      floatRaf = null;
    }
  }, 350);
});


// ── Scroll reveal ──────────────────────────────
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay * 1);
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Card display Right efshtml
const cards = document.querySelectorAll('.project-card, .project-cardright');
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
cards.forEach(c => cardObserver.observe(c));

// Observe work items with staggered delay
document.querySelectorAll('.work-item').forEach((el, i) => {
  el.dataset.delay = i * 80;
  revealObserver.observe(el);
});

// Observe generic fade-in elements
document.querySelectorAll('.fade-in, .cap-item, .play-item, .now-item').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(16px)';
  el.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 60}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 60}ms`;
  revealObserver.observe(el);
});


// ── Image Lightbox / Zoom Effect ───────────────
document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.createElement('div');
  backdrop.className = 'lightbox-backdrop';
  document.body.appendChild(backdrop);

  const visualItems = document.querySelectorAll('.project-visual > div');

  visualItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      backdrop.innerHTML = '';
      
      // Clone the clicked visual container
      const activeClone = item.cloneNode(true);
      activeClone.className += ' lightbox-target';
      
      // Explicitly pull and apply the background image computed style
      const computedStyle = window.getComputedStyle(item);
      const bgImage = computedStyle.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        activeClone.style.backgroundImage = bgImage;
      }

      backdrop.appendChild(activeClone);
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });
  });

  // Close lightbox when clicking outside the zoomed image (on the backdrop)
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop || e.target.classList.contains('lightbox-target')) {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
      
      setTimeout(() => {
        backdrop.innerHTML = '';
      }, 350);
    }
  });

  // ── Full-page background color transition on hover ───────────
  const defaultBg = '#e2d8c6';
  const colorTriggers = document.querySelectorAll('[data-color]');

  colorTriggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', () => {
      const targetColor = trigger.getAttribute('data-color');
      if (targetColor) {
        document.body.style.backgroundColor = targetColor;
      }
    });

    trigger.addEventListener('mouseleave', () => {
      document.body.style.backgroundColor = defaultBg;
    });
  });
});

// ── Active nav link based on current page ────────
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath || (currentPath === '' && href === 'index.html')) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});