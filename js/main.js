(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var header = $('#header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('#burger');
  var nav = $('#nav');

  function setNav(open) {
    if (!nav || !burger) return;
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setNav(burger.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (nav) {
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNav(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 992) setNav(false);
  });

  var navLinks = $$('.nav__link');
  var sections = navLinks
    .map(function (a) { return a.getAttribute('href'); })
    .filter(function (h) { return h && h.charAt(0) === '#'; })
    .map(function (h) { return document.querySelector(h); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { secObs.observe(s); });
  }

  var revealEls = $$('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          revObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revObs.observe(el); });
  }

  function formatNum(value, decimals) {
    var lang = (window.I18N && window.I18N.lang) || 'ru';
    try {
      return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ru-RU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    } catch (e) {
      return decimals ? value.toFixed(decimals) : String(Math.round(value));
    }
  }

  function paintStat(el, value) {
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    el.textContent = formatNum(value, decimals) + suffix;
  }

  function animateStat(el) {
    if (el.dataset.animated === '1') return;
    el.dataset.animated = '1';
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reduced) { paintStat(el, target); return; }
    var dur = 1400;
    var start = performance.now();
    function step(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      paintStat(el, decimals ? val : Math.round(val));
      if (p < 1) requestAnimationFrame(step);
      else paintStat(el, target);
    }
    requestAnimationFrame(step);
  }

  var stats = $$('.stat__num');
  if (stats.length) {
    if (!('IntersectionObserver' in window) || reduced) {
      stats.forEach(animateStat);
    } else {
      var stObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animateStat(en.target); stObs.unobserve(en.target); }
        });
      }, { threshold: 0.5 });
      stats.forEach(function (el) { stObs.observe(el); });
    }
    document.addEventListener('langchange', function () {
      stats.forEach(function (el) {
        if (el.dataset.animated === '1') paintStat(el, parseFloat(el.getAttribute('data-count')));
      });
    });
  }

  $$('.ba').forEach(function (ba) {
    var range = $('.ba__range', ba);
    if (!range) return;
    function update() { ba.style.setProperty('--pos', range.value + '%'); }
    range.addEventListener('input', update);
    update();
  });

  var slider = $('[data-slider]');
  if (slider) {
    var track = $('.slider__track', slider);
    var slides = $$('.slide', slider);
    var dotsWrap = $('[data-dots]', slider);
    var index = 0;
    var perView = 1;

    function calcPerView() {
      var w = window.innerWidth;
      if (w >= 1200) return 3;
      if (w >= 768) return 2;
      return 1;
    }
    function maxIndex() { return Math.max(0, slides.length - perView); }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      for (var i = 0; i <= maxIndex(); i++) {
        (function (i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Слайд ' + (i + 1));
          b.addEventListener('click', function () { index = i; render(); });
          dotsWrap.appendChild(b);
        })(i);
      }
    }

    function render() {
      index = Math.max(0, Math.min(index, maxIndex()));
      var step = 100 / perView;
      track.style.transform = 'translateX(' + (-index * step) + '%)';
      if (dotsWrap) {
        $$('button', dotsWrap).forEach(function (d, i) {
          d.classList.toggle('is-active', i === index);
        });
      }
    }

    function onResize() {
      var next = calcPerView();
      if (next !== perView) {
        perView = next;
        buildDots();
        render();
      }
    }

    var prevBtn = $('[data-prev]', slider);
    var nextBtn = $('[data-next]', slider);
    if (prevBtn) prevBtn.addEventListener('click', function () { index--; if (index < 0) index = maxIndex(); render(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { index++; if (index > maxIndex()) index = 0; render(); });

    var startX = null;
    var viewport = $('.slider__viewport', slider);
    viewport.addEventListener('pointerdown', function (e) { startX = e.clientX; }, { passive: true });
    viewport.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) { index++; if (index > maxIndex()) index = 0; }
        else { index--; if (index < 0) index = maxIndex(); }
        render();
      }
      startX = null;
    }, { passive: true });
    viewport.addEventListener('pointercancel', function () { startX = null; });

    window.addEventListener('resize', onResize);
    perView = calcPerView();
    buildDots();
    render();
  }

  var faqItems = $$('.faq__item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  var phone = $('#f-phone');
  if (phone) {
    phone.addEventListener('input', function () {
      var lang = (window.I18N && window.I18N.lang) || 'ru';
      if (lang === 'en') return;
      var d = phone.value.replace(/\D/g, '');
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      var out = '';
      if (d.length) out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 5) out += ') ' + d.slice(4, 7);
      if (d.length >= 8) out += '-' + d.slice(7, 9);
      if (d.length >= 10) out += '-' + d.slice(9, 11);
      phone.value = out;
    });
  }

  var form = $('#form');
  var toast = $('#toast');
  var toastTimer;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-show'); }, 4200);
  }

  function fieldOf(el) { return el.closest('.field'); }

  function validateField(el) {
    var wrap = fieldOf(el);
    if (!wrap) return true;
    var ok = true;
    if (el.type === 'checkbox') {
      ok = el.checked;
    } else if (el.hasAttribute('required')) {
      var v = (el.value || '').trim();
      if (!v) ok = false;
      else if (el.id === 'f-name' && v.length < 2) ok = false;
      else if (el.id === 'f-phone') {
        var digits = v.replace(/\D/g, '');
        ok = digits.length >= 10;
      }
    }
    wrap.classList.toggle('is-invalid', !ok);
    return ok;
  }

  if (form) {
    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('blur', function () {
        if (el.hasAttribute('required') || el.value) validateField(el);
      });
      el.addEventListener('input', function () {
        var wrap = fieldOf(el);
        if (wrap && wrap.classList.contains('is-invalid')) validateField(el);
      });
      el.addEventListener('change', function () {
        if (el.hasAttribute('required')) validateField(el);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('[required]', form);
      var valid = true;
      fields.forEach(function (el) {
        if (!validateField(el)) valid = false;
      });
      if (!valid) {
        var firstBad = $('.is-invalid input, .is-invalid select', form);
        if (firstBad) firstBad.focus();
        return;
      }
      var btn = $('button[type="submit"]', form);
      var lang = (window.I18N && window.I18N.lang) || 'ru';
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '.7';
      }
      setTimeout(function () {
        form.reset();
        $$('.field', form).forEach(function (f) { f.classList.remove('is-invalid'); });
        if (btn) { btn.disabled = false; btn.style.opacity = ''; }
        showToast(window.I18N ? window.I18N.t('form.ok') : 'Заявка отправлена!');
      }, 700);
      void lang;
    });
  }

  var shareBtn = $('#share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var url = location.href;
      var done = function () {
        showToast(window.I18N ? window.I18N.t('blogPage.copied') : 'Link copied');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
      function fallbackCopy() {
        var ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  }

  var FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#1a2030"/><stop offset="1" stop-color="#0b0e14"/></linearGradient></defs>' +
    '<rect width="800" height="600" fill="url(#g)"/>' +
    '<circle cx="400" cy="300" r="70" fill="none" stroke="#ff8a00" stroke-width="6" opacity=".7"/>' +
    '<path d="M370 300h60M400 270v60" stroke="#ff8a00" stroke-width="6" stroke-linecap="round" opacity=".7"/>' +
    '</svg>'
  );
  $$('img').forEach(function (img) {
    img.addEventListener('error', function () {
      if (img.dataset.fallback === '1') return;
      img.dataset.fallback = '1';
      img.src = FALLBACK;
    });
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id === '#') return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    setNav(false);
    var top = target.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight + 8 : 0);
    window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });
})();
