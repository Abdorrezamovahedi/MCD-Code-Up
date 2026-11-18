/**
 * Directional Motion Blur – robust version
 * Works on all pages, even short ones.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const MAX_BLUR = 14;
  const VELOCITY_SMOOTH = 0.30;
  const BLUR_SMOOTH = 0.20;
  const DECAY = 0.84;
  const SENSITIVITY = 0.48;

  function ensureFilter() {
    if (document.getElementById('motionBlur')) return document.getElementById('blurKernel');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    svg.innerHTML = `
      <defs>
        <filter id="motionBlur" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
          <feGaussianBlur id="blurKernel" in="SourceGraphic" stdDeviation="0 0" edgeMode="duplicate"/>
        </filter>
      </defs>
    `;
    document.documentElement.appendChild(svg);
    return document.getElementById('blurKernel');
  }

  function findTarget() {
    // Prefer main, but fall back to body so it always works
    return document.querySelector('main') || document.body;
  }

  let lastY = window.scrollY || window.pageYOffset || 0;
  let lastTime = performance.now();
  let velocity = 0;
  let currentBlurY = 0;
  let target = null;
  let blurKernel = null;
  let running = false;

  function applyFilter(value) {
    if (!blurKernel) return;
    const v = Math.max(0, value);
    blurKernel.setAttribute('stdDeviation', '0 ' + v.toFixed(2));
  }

  function tick(now) {
    if (!running) return;

    const deltaTime = Math.max(now - lastTime, 0.5);
    const currentY = window.scrollY || window.pageYOffset || 0;
    const deltaY = currentY - lastY;

    const instant = (deltaY / deltaTime) * 16.67;
    velocity += (instant - velocity) * VELOCITY_SMOOTH;

    if (Math.abs(deltaY) < 0.5) {
      velocity *= DECAY;
    }

    let targetBlurY = Math.min(Math.abs(velocity) * SENSITIVITY, MAX_BLUR);
    currentBlurY += (targetBlurY - currentBlurY) * BLUR_SMOOTH;

    if (currentBlurY < 0.1 && Math.abs(velocity) < 0.3) {
      currentBlurY = 0;
      velocity = 0;
    }

    applyFilter(currentBlurY);

    lastY = currentY;
    lastTime = now;
    requestAnimationFrame(tick);
  }

  function start() {
    blurKernel = ensureFilter();
    target = findTarget();

    if (!target || !blurKernel) {
      console.warn('Motion blur: target or filter not found');
      return;
    }

    // Apply the filter to the target
    target.style.filter = 'url(#motionBlur)';
    target.style.willChange = 'filter';
    // Promote to its own layer
    if (!target.style.transform) {
      target.style.transform = 'translateZ(0)';
    }

    lastY = window.scrollY || window.pageYOffset || 0;
    lastTime = performance.now();
    running = true;
    requestAnimationFrame(tick);
  }

  // Start as soon as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Also try again after a short delay in case of late DOM changes
  setTimeout(function () {
    if (!running) start();
  }, 300);
})();
