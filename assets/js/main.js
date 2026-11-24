// Diogo Morais — Portfólio
(() => {
  // Cabeçalho: linha sutil ao rolar
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Revelação ao rolar
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add('is-in'));
  }

  // Ano no rodapé
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Olhos da ilustração seguem o cursor ---------------------------------
  (() => {
    const svg = document.querySelector('.cartoon-eyes');
    if (!svg) return;
    const eyes = Array.from(svg.querySelectorAll('.eye')).map((g) => ({
      pupil: g.querySelector('.pupil'),
      cx: +g.dataset.cx, cy: +g.dataset.cy,
      mx: +g.dataset.maxX, my: +g.dataset.maxY,
      x: 0, y: 0, tx: 0, ty: 0,
    }));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let pointer = null;      // última posição do cursor na tela
    let idle = null;         // alvo de "olhar em volta" quando não há cursor (toque)
    let raf = 0;

    // Converte o centro de cada olho (coordenadas da arte) para a tela
    const aim = (px, py) => {
      const m = svg.getScreenCTM();
      if (!m) return;
      eyes.forEach((e) => {
        const sx = m.a * e.cx + m.c * e.cy + m.e;
        const sy = m.b * e.cx + m.d * e.cy + m.f;
        const dx = px - sx, dy = py - sy;
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 220);        // perto do rosto, o olhar mexe menos
        e.tx = (dx / dist) * e.mx * reach;
        e.ty = (dy / dist) * e.my * reach;
      });
    };

    const tick = () => {
      let moving = false;
      eyes.forEach((e) => {
        e.x += (e.tx - e.x) * 0.22;
        e.y += (e.ty - e.y) * 0.22;
        if (Math.abs(e.tx - e.x) > 0.05 || Math.abs(e.ty - e.y) > 0.05) moving = true;
        e.pupil.setAttribute('transform', `translate(${e.x.toFixed(2)} ${e.y.toFixed(2)})`);
      });
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    window.addEventListener('pointermove', (ev) => {
      if (ev.pointerType === 'touch') return;
      pointer = [ev.clientX, ev.clientY];
      aim(ev.clientX, ev.clientY); kick();
    }, { passive: true });
    // ao rolar, o rosto se move em relação ao cursor parado
    window.addEventListener('scroll', () => { if (pointer) { aim(pointer[0], pointer[1]); kick(); } }, { passive: true });
    // toque: olha para onde a pessoa tocou
    window.addEventListener('touchstart', (ev) => {
      const t = ev.touches[0]; if (!t) return;
      aim(t.clientX, t.clientY); kick();
    }, { passive: true });

    // Sem mouse (celular/tablet): olha em volta de vez em quando
    if (!window.matchMedia('(hover: hover)').matches) {
      const r = svg.getBoundingClientRect();
      idle = setInterval(() => {
        const box = svg.getBoundingClientRect();
        const a = Math.random() * Math.PI * 2;
        aim(box.left + box.width / 2 + Math.cos(a) * 400, box.top + box.height / 2 + Math.sin(a) * 400);
        kick();
      }, 2200);
    }
  })();

  // Faixas horizontais: arrastar com o mouse --------------------------
  // (no toque o navegador já rola; aqui é só para mouse)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.strip').forEach((strip) => {
      strip.classList.add('is-draggable');
      let startX = 0, startLeft = 0, moved = 0, down = false;

      strip.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        down = true; moved = 0;
        startX = e.clientX; startLeft = strip.scrollLeft;
      });
      window.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (!strip.classList.contains('is-dragging') && Math.abs(dx) > 4) {
          strip.classList.add('is-dragging');      // desliga o "encaixe" durante o arraste
        }
        if (strip.classList.contains('is-dragging')) {
          moved = Math.abs(dx);
          strip.scrollLeft = startLeft - dx;
        }
      });
      const end = () => {
        if (!down) return;
        down = false;
        if (strip.classList.contains('is-dragging')) {
          // devolve o encaixe e alinha suavemente no item mais próximo
          const left = strip.scrollLeft;
          strip.classList.remove('is-dragging');
          strip.scrollLeft = left;
        }
      };
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
      // se arrastou, o clique de soltar não abre a imagem ampliada
      strip.addEventListener('click', (e) => {
        if (moved > 4) { e.preventDefault(); e.stopPropagation(); moved = 0; }
      }, true);
    });
  }

  // Vídeos curtos: tocam (mudos) só quando visíveis; com movimento reduzido, ficam com controles
  const vids = document.querySelectorAll('video[data-autoplay]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    vids.forEach((v) => { v.controls = true; v.preload = 'metadata'; });
  } else {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) { v.play().catch(() => { v.controls = true; }); }
        else { v.pause(); }
      });
    }, { threshold: 0.4 });
    vids.forEach((v) => vio.observe(v));
  }

  // YouTube leve: mostra a miniatura e só carrega o player ao clicar
  document.querySelectorAll('.yt-lite[data-yt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
      f.title = btn.getAttribute('aria-label').replace('Reproduzir vídeo ', '');
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      btn.replaceWith(f);
      f.focus();
    });
  });

  // Lightbox para galerias dos cases
  const triggers = Array.from(document.querySelectorAll('[data-lightbox]'));
  if (!triggers.length) return;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Imagem ampliada');
  lb.innerHTML = `
    <img alt="">
    <button class="lb-close" type="button" aria-label="Fechar">✕</button>
    <button class="lb-prev" type="button" aria-label="Imagem anterior">←</button>
    <button class="lb-next" type="button" aria-label="Próxima imagem">→</button>
    <div class="lb-count" aria-live="polite"></div>`;
  document.body.appendChild(lb);

  const img = lb.querySelector('img');
  const count = lb.querySelector('.lb-count');
  let index = 0;
  let lastFocus = null;

  const show = (i) => {
    index = (i + triggers.length) % triggers.length;
    const t = triggers[index];
    const src = t.querySelector('img');
    img.src = t.dataset.full || src.currentSrc || src.src;
    img.alt = src.alt;
    count.textContent = `${index + 1} / ${triggers.length}`;
  };
  const open = (i) => {
    lastFocus = document.activeElement;
    show(i);
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  };
  const close = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };

  triggers.forEach((t, i) => t.addEventListener('click', () => open(i)));
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  lb.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'Tab') { // mantém o foco dentro do lightbox
      const f = Array.from(lb.querySelectorAll('button'));
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
