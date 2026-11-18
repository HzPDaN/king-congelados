(function () {
  'use strict';

  var I = window.KC_I18N;
  var root = document.documentElement;
  var lang = I.initial;

  var FORM_ENDPOINT = 'https://formspree.io/f/xaqggnoz';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function t(path) {
    var parts = path.split('.');
    var dict = I.dict[lang] || I.dict.PT;
    var v = dict[parts[0]] && dict[parts[0]][parts[1]];
    if (v == null) v = I.dict.PT[parts[0]] && I.dict.PT[parts[0]][parts[1]];
    return v == null ? '' : v;
  }

  function applyLanguage(code) {
    lang = I.dict[code] ? code : 'PT';
    root.lang = I.htmlLang[lang];
    root.dir = lang === 'AR' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      node.textContent = t(node.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (node) {
      node.innerHTML = t(node.getAttribute('data-i18n-html'));
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function (node) {
      node.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':');
        if (p.length === 2) node.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });

    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
    });

    renderYear();
    syncMenuLabel();
    root.classList.remove('i18n-pending');
  }

  function initLanguage() {
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.getAttribute('data-lang');
        try { localStorage.setItem(I.storageKey, code); } catch (e) {}
        applyLanguage(code);
        closeMenu();
      });
    });
    if (lang !== 'PT') applyLanguage(lang);
    else renderYear();
  }

  function renderYear() {
    var node = document.querySelector('[data-year]');
    if (!node) return;
    var y = new Date().getFullYear();
    node.textContent = lang === 'AR' ? y.toLocaleString('ar-EG', { useGrouping: false }) : String(y);
  }

  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('mobile-menu');

  function syncMenuLabel() {
    if (!toggle) return;
    var open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-label', t(open ? 'nav.menuClose' : 'nav.menuOpen'));
  }

  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    syncMenuLabel();
  }

  function initMenu() {
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.hidden = !open;
      syncMenuLabel();
    });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { closeMenu(); toggle.focus(); }
    });
  }

  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var update = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initLogo() {
    var logo = document.querySelector('.logo');
    if (!logo || reduceMotion) return;
    logo.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      logo.classList.add('is-glow');
      setTimeout(function () {
        logo.classList.remove('is-glow');
        if (document.body.getAttribute('data-page') === 'inicio') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.location.href = logo.getAttribute('href');
        }
      }, 220);
    });
  }

  function initTimeline() {
    document.querySelectorAll(".timeline").forEach(function (tl) {
      var steps = tl.querySelectorAll(".timeline__step");
      var n = steps.length;
      var cur = 0, timer = null;
      function set(k) {
        cur = k;
        tl.style.setProperty("--p", n > 1 ? Math.max(0, k - 1) / (n - 1) : 1);
        steps.forEach(function (s, i) {
          s.classList.toggle("is-on", i < k);
          s.classList.toggle("is-current", i === k - 1);
        });
      }
      if (reduceMotion || !("IntersectionObserver" in window)) { set(n); return; }
      tl.classList.add("is-live");
      function tick() {
        if (cur < n) { set(cur + 1); timer = setTimeout(tick, 900); }
        else { timer = setTimeout(function () { set(0); timer = setTimeout(tick, 700); }, 2800); }
      }
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { if (!timer) timer = setTimeout(tick, 500); }
          else { clearTimeout(timer); timer = null; }
        });
      }, { threshold: 0.3 }).observe(tl);
    });
  }

  function initProductTabs() {
    var root = document.querySelector(".pcat");
    if (!root) return;
    var tabs = Array.prototype.slice.call(root.querySelectorAll(".pcat__tab"));
    var panels = Array.prototype.slice.call(root.querySelectorAll(".pcat__panel"));
    function show(id, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("aria-controls") === id;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.forEach(function (p) {
        var on = p.id === id;
        p.hidden = !on;
        p.classList.remove("is-entering");
        if (on && !reduceMotion) { void p.offsetWidth; p.classList.add("is-entering"); }
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        var id = t.getAttribute("aria-controls");
        show(id);
        if (history.replaceState) history.replaceState(null, "", "#" + id);
      });
      t.addEventListener("keydown", function (e) {
        var k = e.key, d = 0;
        if (k === "ArrowRight") d = 1; else if (k === "ArrowLeft") d = -1; else return;
        if (document.documentElement.dir === "rtl") d = -d;
        e.preventDefault();
        var next = tabs[(i + d + tabs.length) % tabs.length];
        show(next.getAttribute("aria-controls"), true);
      });
    });
    var inicial = location.hash.slice(1);
    show(panels.some(function (p) { return p.id === inicial; }) ? inicial : panels[0].id);
  }

  function initHeroBanner() {
    var root = document.querySelector('.hb');
    if (!root) return;
    var track = root.querySelector('.hb__track');
    var slides = root.querySelectorAll('.hb__slide');
    var dots = root.querySelectorAll('.hb__dot');
    var atual = 0, timer = null, visivel = true;
    function mostrar(i) {
      atual = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-100 * atual) + '%)';
      slides.forEach(function (s, k) {
        s.classList.toggle('is-active', k === atual);
        if (k === atual) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
      });
      dots.forEach(function (d, k) {
        d.classList.toggle('is-active', k === atual);
        if (k === atual) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }
    function tocar() {
      clearInterval(timer);
      timer = setInterval(function () { if (visivel && !document.hidden) mostrar(atual + 1); }, 6000);
    }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { mostrar(k); tocar(); }); });
    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { mostrar(atual + (dx < 0 ? 1 : -1)); tocar(); }
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visivel = en[0].isIntersecting; }).observe(root);
    }
    mostrar(0);
    tocar();
  }

  function initTestimonials() {
    var root = document.querySelector('.depo');
    if (!root) return;
    var track = root.querySelector('.depo__track');
    var prev = root.querySelector('[data-depo="prev"]');
    var next = root.querySelector('[data-depo="next"]');
    var bar = root.querySelector('.depo__progress span');
    function rtl() { return document.documentElement.dir === 'rtl'; }
    function step() {
      var card = track.querySelector('.depo-card');
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var pos = Math.abs(track.scrollLeft);
      prev.disabled = pos <= 2;
      next.disabled = pos >= max - 2;
      var visible = track.clientWidth / track.scrollWidth;
      var w = Math.min(100, visible * 100);
      bar.style.setProperty('--w', w + '%');
      bar.style.setProperty('--x', (max > 0 ? (pos / max) * (100 / w * 100 - 100) : 0) + '%');
    }
    function go(dir) { track.scrollBy({ left: dir * step() * (rtl() ? -1 : 1) }); }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        go((e.key === 'ArrowRight' ? 1 : -1) * (rtl() ? -1 : 1));
      }
    });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    update();

    var visivel = false, timer = null;
    function tick() {
      if (!visivel || document.hidden) return;
      var max = track.scrollWidth - track.clientWidth;
      if (Math.abs(track.scrollLeft) >= max - 2) track.scrollTo({ left: 0 });
      else go(1);
    }
    function reiniciar() { clearInterval(timer); timer = setInterval(tick, 4000); }
    track.addEventListener('touchstart', reiniciar, { passive: true });
    prev.addEventListener('click', reiniciar);
    next.addEventListener('click', reiniciar);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; }, { threshold: 0.3 }).observe(track);
    } else { visivel = true; }
    reiniciar();
  }

  function initProductDetail() {
    var dlg = document.querySelector('.pdet');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('.pcat .pcard[data-slug]'));
    var $ = function (s) { return dlg.querySelector(s); };
    var atual = 0, origem = null;

    function render(i, troca) {
      atual = (i + cards.length) % cards.length;
      var card = cards[atual];
      var painel = card.closest('.pcat__panel');
      var veg = painel.classList.contains('pcat__panel--veg');
      var foto = card.getAttribute('data-photo');
      dlg.classList.toggle('pdet--veg', veg);
      $('.pdet__photo').src = foto || '';
      $('.pdet__slide--photo').hidden = !foto;
      $('.pdet__dots').hidden = !foto;
      $('.pdet__pack').src = card.querySelector('.pcard__media img').getAttribute('src');
      slide(0);
      tocar();
      $('.pdet__line-txt').textContent = painel.querySelector('.pcat__title').textContent.trim();
      $('.pdet__name').textContent = card.querySelector('.pcard__name').textContent.trim();
      $('.pdet__desc').textContent = card.querySelector('[data-k="desc"]').textContent.trim();
      var lista = $('.pdet__ap');
      var ids = (card.getAttribute('data-apelos') || '').split(' ');
      lista.querySelectorAll('li').forEach(function (li) { li.hidden = ids.indexOf(li.getAttribute('data-ap')) < 0; });
      ids.forEach(function (id) { var li = lista.querySelector('[data-ap="' + id + '"]'); if (li) lista.appendChild(li); });
      $('.pdet__cta').href = 'contato.html?produto=' + card.getAttribute('data-slug') + '#parceiro';
      $('.pdet__count').textContent = (atual + 1) + ' / ' + cards.length;
      if (troca) {
        dlg.classList.remove('is-switching');
        void dlg.offsetWidth;
        dlg.classList.add('is-switching');
      }
    }

    var timer = null;
    function slide(n) {
      dlg.style.setProperty('--s', n);
      dlg.querySelectorAll('.pdet__dot').forEach(function (d, k) { d.setAttribute('aria-current', k === n ? 'true' : 'false'); });
    }
    function tocar() {
      clearInterval(timer);
      if (!cards[atual].getAttribute('data-photo')) return;
      timer = setInterval(function () {
        if (!dlg.open) return clearInterval(timer);
        slide(dlg.style.getPropertyValue('--s').trim() === '1' ? 0 : 1);
      }, 3500);
    }
    dlg.querySelectorAll('.pdet__dot').forEach(function (d) {
      d.addEventListener('click', function () { slide(+d.getAttribute('data-slide')); tocar(); });
    });
    var x0 = null;
    $('.pdet__media').addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    $('.pdet__media').addEventListener('touchend', function (e) {
      if (x0 === null || !cards[atual].getAttribute('data-photo')) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) < 40) return;
      var rtl = document.documentElement.dir === 'rtl';
      slide((dx < 0) !== rtl ? 1 : 0);
      tocar();
    });

    function abrir(i, el) {
      origem = el || null;
      render(i, false);
      dlg.classList.remove('is-switching');
      dlg.showModal();
      document.documentElement.classList.add('pdet-lock');
      $('.pdet__close').focus();
    }
    function fechar() { if (dlg.open) dlg.close(); }

    cards.forEach(function (card, i) {
      card.addEventListener('click', function () { abrir(i, card.querySelector('.pcard__more')); });
    });
    $('[data-pdet="close"]').addEventListener('click', fechar);
    $('[data-pdet="prev"]').addEventListener('click', function () { render(atual - 1, true); });
    $('[data-pdet="next"]').addEventListener('click', function () { render(atual + 1, true); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) fechar(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.target.closest && e.target.closest('a')) return;
      var rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowRight') render(atual + (rtl ? -1 : 1), true);
      if (e.key === 'ArrowLeft') render(atual + (rtl ? 1 : -1), true);
    });
    dlg.addEventListener('close', function () {
      clearInterval(timer);
      document.documentElement.classList.remove('pdet-lock');
      if (origem) origem.focus();
    });

    new MutationObserver(function () { if (dlg.open) render(atual, false); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  function initReveal() {
    var items = document.querySelectorAll('.scroll-animate');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add('animate-in'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  function formatPhoneBR(value) {
    var digits = value.replace(/[^\d+]/g, '');
    var intl = digits.indexOf('+55') === 0 || (digits.indexOf('55') === 0 && digits.length > 11);
    var n = (intl ? digits.replace(/^\+?55/, '') : digits).replace(/\D/g, '');
    var out = intl ? '+55' : '';
    if (n.length > 0) out += (intl ? ' (' : '(') + n.substring(0, 2);
    if (n.length >= 2) out += ') ';
    if (n.length > 2) out += n.substring(2, 7);
    if (n.length > 7) out += '-' + n.substring(7, 11);
    return out;
  }

  var VOLUME_PT = {
    '1': 'Até 5 toneladas/mês',
    '2': '5 a 10 toneladas/mês',
    '3': '10 a 20 toneladas/mês',
    '4': 'Acima de 20 toneladas/mês'
  };

  function productLabelPT(slug) {
    if (!slug) return 'Não informado';
    if (slug === 'varios') return I.dict.PT.contact.prodMulti;
    return I.dict.PT.cf[slug + 'Name'] || slug;
  }

  function initForm() {
    var form = document.getElementById('partner-form');
    if (!form) return;

    var f = form.elements;
    var status = form.querySelector('.form__status');
    var submit = form.querySelector('.form__submit');
    var submitLabel = submit.querySelector('span');
    var lastSent = 0;

    var wanted = new URLSearchParams(window.location.search).get('produto');
    if (wanted && f.product && f.product.querySelector('option[value="' + wanted.replace(/[^a-z]/g, '') + '"]')) {
      f.product.value = wanted;
    }

    f.phone.addEventListener('input', function () {
      if (lang === 'PT') f.phone.value = formatPhoneBR(f.phone.value);
    });
    f.cnpj.addEventListener('input', function () {
      var v = f.cnpj.value.replace(/[^0-9A-Za-z./ -]/g, '');
      if (v !== f.cnpj.value) f.cnpj.value = v;
    });

    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('input', function () { field.removeAttribute('aria-invalid'); });
    });

    function fail(message, field, isHTML) {
      if (isHTML) status.innerHTML = message; else status.textContent = message;
      if (status.scrollIntoView && !field) status.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
      if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
      return false;
    }

    function validate() {
      status.textContent = '';
      var missing = ['company', 'cnpj', 'email', 'phone', 'volume'].filter(function (name) {
        return !f[name].value.trim();
      });
      if (missing.length) {
        missing.forEach(function (name) { f[name].setAttribute('aria-invalid', 'true'); });
        return fail(t('contact.errRequired'), f[missing[0]]);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) {
        return fail(t('contact.errEmail'), f.email);
      }
      var phoneDigits = f.phone.value.replace(/\D/g, '');
      var phoneOk = lang === 'PT'
        ? phoneDigits.length >= 10 && phoneDigits.length <= 13
        : phoneDigits.length >= 7 && phoneDigits.length <= 15;
      if (!phoneOk) return fail(t('contact.errPhone'), f.phone);
      if (f.cnpj.value.replace(/[^0-9A-Za-z]/g, '').length < 4) return fail(t('contact.errCnpj'), f.cnpj);
      return true;
    }

    function setSending(on) {
      submit.disabled = on;
      submitLabel.textContent = t(on ? 'contact.sending' : 'contact.submit');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f._gotcha.value) return;
      if (!validate()) return;
      if (Date.now() - lastSent < 10000) { fail(t('contact.errWait')); return; }

      var company = f.company.value.trim();
      var payload = {
        _subject: 'Nova Proposta Comercial — ' + company,
        _replyto: f.email.value.trim(),
        _language: lang.toLowerCase(),
        'Nome da Empresa': company,
        'CNPJ / Tax ID': f.cnpj.value.trim() || 'Não informado',
        'E-mail': f.email.value.trim(),
        'Telefone': f.phone.value.trim(),
        'Produto de Interesse': productLabelPT(f.product ? f.product.value : ''),
        'Volume Mensal Estimado': VOLUME_PT[f.volume.value] || 'Não selecionado',
        'Mensagem': f.message.value.trim() || 'Não informado'
      };

      setSending(true);
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        lastSent = Date.now();
        form.reset();
        openModal();
      }).catch(function () {
        fail(t('contact.errSend'), null, true);
      }).then(function () {
        setSending(false);
      });
    });
  }

  function initLegalToc() {
    var links = document.querySelectorAll('.legal__toc a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var link = byId[entry.target.id];
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(byId).forEach(function (id) {
      var h = document.getElementById(id);
      if (h) observer.observe(h);
    });
  }

  function initCookieBar() {
    var bar = document.querySelector('.cookie-bar');
    if (!bar) return;
    var seen = false;
    try { seen = localStorage.getItem('kc-cookies') === '1'; } catch (e) {}
    if (seen) return;
    bar.hidden = false;
    bar.querySelector('.cookie-bar__ok').addEventListener('click', function () {
      try { localStorage.setItem('kc-cookies', '1'); } catch (e) {}
      bar.hidden = true;
    });
  }

  var modal = document.getElementById('success-modal');
  var lastFocus = null;

  function openModal() {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal__btn').focus();
  }

  function closeModal() {
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  function initModal() {
    if (!modal) return;
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }

  initLanguage();
  initMenu();
  initHeaderScroll();
  initLogo();
  initReveal();
  initTimeline();
  initProductTabs();
  initProductDetail();
  initHeroBanner();
  initTestimonials();
  initForm();
  initModal();
  initLegalToc();
  initCookieBar();
})();
