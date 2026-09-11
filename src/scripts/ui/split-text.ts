/**
 * Reveal every `[data-split]` block when it enters the viewport: the block
 * starts a short step to the right and eases back to where it belongs.
 * Headings carry that motion on their own lines instead of on the whole box,
 * each line a beat behind the one above, so a title lands as a cascade.
 *
 * Nothing is hidden by the stylesheet alone — the hiding classes are added
 * here, so a page without JavaScript keeps its copy on screen.
 */

/** Two words belong to the same line while their tops sit this close. */
const LINE_EPSILON = 6;

/** Wrap each word of `el` in its own span, leaving `<br>` and markup intact. */
function splitWords(el: HTMLElement): void {
  const walk = (node: Node): void => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (n.textContent ?? '').split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const word = document.createElement('span');
          word.className = 'tp-word';
          word.textContent = part;
          frag.appendChild(word);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName !== 'BR') {
        walk(n);
      }
    });
  };
  walk(el);
}

/**
 * Number the rendered lines of a split heading. Every top is read before the
 * first index is written, so the measurement costs one layout, not one per
 * word.
 */
function assignLines(el: HTMLElement): void {
  const words = Array.from(el.querySelectorAll<HTMLElement>('.tp-word'));
  const tops = words.map((w) => w.getBoundingClientRect().top);
  let line = 0;
  words.forEach((w, i) => {
    if (i > 0 && Math.abs(tops[i] - tops[i - 1]) > LINE_EPSILON) line += 1;
    w.style.setProperty('--tp-line', String(line));
  });
}

export function initSplitText(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-split]'));
  const headings: HTMLElement[] = [];

  els.forEach((el) => {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';

    if (/^H[1-6]$/.test(el.tagName)) {
      splitWords(el);
      el.classList.add('tp-lines');
      headings.push(el);
      return;
    }
    // A transform has no effect on an inline box.
    if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
    /* An inline `opacity` would outrank the reveal and keep the block from
       fading; hand it to the stylesheet as the value to settle on. */
    if (el.style.opacity) {
      el.style.setProperty('--tp-opacity', el.style.opacity);
      el.style.opacity = '';
    }
    el.classList.add('tp-reveal');
  });

  /* Line boxes settle with the loaded font and move with the viewport; only
     headings still waiting to be revealed need the new numbering. */
  const measure = (): void => {
    headings.forEach((el) => {
      if (!el.classList.contains('tp-in')) assignLines(el);
    });
  };
  measure();
  document.fonts?.ready.then(measure).catch(() => {});

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(measure, 160);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.classList.add('tp-in');
      });
    },
    { threshold: 0.2 }
  );
  /* A block already on screen would be told to reveal in the same frame it
     was hidden, and jump instead of travelling. Arming the observer two
     frames later guarantees the offset state was painted once. */
  requestAnimationFrame(() => requestAnimationFrame(() => els.forEach((el) => io.observe(el))));
  // Safety net: never leave copy invisible.
  window.setTimeout(() => els.forEach((el) => el.classList.add('tp-in')), 6000);
}
