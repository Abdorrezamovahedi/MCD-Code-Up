/* MCD Code Up — restrained, accessible interactions. */
(function () {
  'use strict';


  // User-controlled theme preference. If no preference has been saved,
  // the initial theme follows the operating system; users can always override it.
  const themeRoot = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]') || (() => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
    return meta;
  })();
  const themeColors = { light: '#eef3ee', dark: '#0b1210' };
  const storedTheme = (() => {
    try { return localStorage.getItem('mcd-theme'); } catch (_) { return null; }
  })();
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  let activeTheme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : (systemDark ? 'dark' : 'light');

  const applyTheme = (theme, save) => {
    activeTheme = theme === 'dark' ? 'dark' : 'light';
    themeRoot.dataset.theme = activeTheme;
    themeMeta.setAttribute('content', themeColors[activeTheme]);
    if (save) {
      try { localStorage.setItem('mcd-theme', activeTheme); } catch (_) { /* Storage may be disabled. */ }
    }
    const isDark = activeTheme === 'dark';
    document.querySelectorAll('.mcd-theme-toggle').forEach(button => {
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', isDark ? 'فعال‌کردن حالت روشن' : 'فعال‌کردن حالت تیره');
      button.title = isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره';
      const icon = button.querySelector('.mcd-theme-icon');
      const label = button.querySelector('.mcd-theme-label');
      if (icon) icon.textContent = isDark ? '☀' : '☾';
      if (label) label.textContent = isDark ? 'حالت روشن' : 'حالت تاریک';
    });
  };
  const themeButton = document.createElement('button');
  themeButton.type = 'button';
  themeButton.className = 'mcd-theme-toggle';
  themeButton.innerHTML = '<span class="mcd-theme-icon" aria-hidden="true">☾</span><span class="mcd-theme-label">حالت تاریک</span>';
  themeButton.addEventListener('click', () => applyTheme(activeTheme === 'dark' ? 'light' : 'dark', true));
  const themeHeader = document.querySelector('header.topbar');
  if (themeHeader) {
    themeHeader.appendChild(themeButton);
  } else {
    themeButton.classList.add('mcd-theme-toggle-floater');
    document.body.appendChild(themeButton);
  }
  applyTheme(activeTheme, false);


  // Compact, keyboard-accessible mobile navigation.
  const header = document.querySelector('header.topbar');
  const nav = header && header.querySelector('.nav');
  if (header && nav) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mcd-menu-toggle';
    toggle.setAttribute('aria-label', 'باز کردن منو');
    toggle.setAttribute('aria-expanded', 'false');
    if (!nav.id) nav.id = 'mcd-main-navigation';
    toggle.setAttribute('aria-controls', nav.id);
    toggle.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(toggle);

    const closeMenu = () => {
      header.classList.remove('mcd-nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'باز کردن منو');
    };
    toggle.addEventListener('click', () => {
      const open = !header.classList.contains('mcd-nav-open');
      header.classList.toggle('mcd-nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', event => {
      if (!header.contains(event.target)) closeMenu();
    });
  }

  // Do not let unfinished syllabus links behave like broken links that jump to the top.
  // They remain visible as planned topics, but their unavailable state is announced honestly.
  document.querySelectorAll('a[href="#"]').forEach(link => {
    link.dataset.mcdUnavailable = 'true';
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('title', 'این سرفصل هنوز به صفحهٔ آموزشی متصل نشده است.');
    if (!link.hasAttribute('aria-label')) {
      const name = link.textContent.trim();
      if (name) link.setAttribute('aria-label', `${name} — هنوز فعال نیست`);
    }
    link.addEventListener('click', event => event.preventDefault());
  });

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal meaningful content blocks once as they enter the viewport.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const selectors = [
      'main > .hero',
      'main:not(.wrap) > h1',
      'main:not(.wrap) > .lead',
      'main > section.section',
      'main > .lesson-hero',
      // Long, content-heavy syllabus containers must never be hidden as one animated block.
      'main > section:not(.hero):not(.lesson-section):not(.list-section)',
      'main .card',
      'main .guide',
      'main .download-card',
      'main .gif-card',
      'main .faq',
      'main .note',
      'main .exercise',
      'main .trust-item'
    ].join(',');

    const items = Array.from(document.querySelectorAll(selectors));
    if (items.length) {
      document.documentElement.classList.add('mcd-motion-ready');
      items.forEach((element, index) => {
        element.classList.add('mcd-reveal');
        element.style.setProperty('--mcd-delay', `${(index % 4) * 40}ms`);
      });

      const observer = new IntersectionObserver((entries, activeObserver) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          activeObserver.unobserve(entry.target);
        });
      // Trigger on any intersection. A high ratio can permanently hide tall sections.
      }, { threshold: 0, rootMargin: '0px' });

      items.forEach(element => observer.observe(element));
    }
  }

  // Honest reading-position indicator on long lesson pages (not a mastery score).
  const readingMain = document.querySelector('main:not(.wrap)');
  if (readingMain && !reduceMotion && document.documentElement.scrollHeight > window.innerHeight * 1.55) {
    const progress = document.createElement('div');
    progress.className = 'mcd-reading-progress';
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', 'میزان پیشروی در صفحه');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    progress.setAttribute('aria-valuenow', '0');
    progress.innerHTML = '<span></span>';
    document.body.appendChild(progress);

    const fill = progress.querySelector('span');
    let progressFrame = 0;
    const updateReadingProgress = () => {
      if (progressFrame) return;
      progressFrame = window.requestAnimationFrame(() => {
        progressFrame = 0;
        const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const ratio = Math.min(1, Math.max(0, window.scrollY / scrollable));
        fill.style.transform = `scaleX(${ratio})`;
        progress.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
      });
    };
    window.addEventListener('scroll', updateReadingProgress, { passive: true });
    window.addEventListener('resize', updateReadingProgress, { passive: true });
    window.addEventListener('load', updateReadingProgress, { once: true });
    updateReadingProgress();
  }
})();


  // Soft retention layer (loss aversion) — no fake timers, honest framing
  (function retentionLayer() {
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dismissedKey = 'mcd-retain-dismissed';
    const nudgeKey = 'mcd-nudge-dismissed';
    let retainShown = false;

    const wasDismissed = (key) => {
      try { return sessionStorage.getItem(key) === '1'; } catch (_) { return false; }
    };
    const dismiss = (key) => {
      try { sessionStorage.setItem(key, '1'); } catch (_) { /* ignore */ }
    };

    // Exit-intent banner (desktop: mouse leaves top)
    const banner = document.createElement('div');
    banner.className = 'mcd-retain-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML =
      '<button type="button" class="mcd-retain-close" aria-label="بستن">×</button>' +
      '<p>اگر الان بری، <strong>مسیر یادگیری‌ات نیمه‌کاره می‌مونه</strong> — چند دقیقه دیگه مسیر مناسبت رو پیدا کن.</p>' +
      '<a href="#paths" class="mcd-retain-cta">ادامه بده، مسیرت اینجاست</a>';

    const closeBanner = () => {
      banner.classList.remove('is-visible');
      dismiss(dismissedKey);
      retainShown = true;
    };
    banner.querySelector('.mcd-retain-close').addEventListener('click', closeBanner);
    banner.querySelector('.mcd-retain-cta').addEventListener('click', closeBanner);

    // Only inject on homepage-like pages with paths section, or always lightly
    const isHome = !!document.querySelector('main.wrap') || !!document.querySelector('#paths, .path-grid, .card-grid');
    if (isHome && !wasDismissed(dismissedKey)) {
      document.body.appendChild(banner);

      document.addEventListener('mouseout', (e) => {
        if (retainShown || wasDismissed(dismissedKey)) return;
        if (e.relatedTarget || e.toElement) return;
        if (e.clientY > 12) return;
        retainShown = true;
        banner.classList.add('is-visible');
        setTimeout(() => {
          if (banner.classList.contains('is-visible')) closeBanner();
        }, 14000);
      });
    }

    // Sticky nudge after meaningful scroll (loss of progress framing)
    if (!wasDismissed(nudgeKey) && isHome) {
      const nudge = document.createElement('div');
      nudge.className = 'mcd-sticky-nudge';
      nudge.innerHTML =
        '<button type="button" class="mcd-nudge-close" aria-label="بستن">×</button>' +
        '<strong>هنوز مسیرت را انتخاب نکردی</strong>' +
        'یادگیری وقتی شروع می‌شود که یک مسیر مشخص داشته باشی. الان انتخاب کن تا از دستش ندهی.' +
        '<br><a href="#paths">دیدن مسیرهای یادگیری</a>';
      document.body.appendChild(nudge);

      nudge.querySelector('.mcd-nudge-close').addEventListener('click', () => {
        nudge.classList.remove('is-visible');
        dismiss(nudgeKey);
      });
      nudge.querySelector('a').addEventListener('click', () => {
        nudge.classList.remove('is-visible');
        dismiss(nudgeKey);
      });

      let nudgeShown = false;
      window.addEventListener('scroll', () => {
        if (nudgeShown || wasDismissed(nudgeKey)) return;
        const scrolled = window.scrollY || document.documentElement.scrollTop;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        if (docH > 400 && scrolled / docH > 0.35) {
          nudgeShown = true;
          nudge.classList.add('is-visible');
          setTimeout(() => {
            if (nudge.classList.contains('is-visible')) {
              nudge.classList.remove('is-visible');
            }
          }, 12000);
        }
      }, { passive: true });
    }
  })();
