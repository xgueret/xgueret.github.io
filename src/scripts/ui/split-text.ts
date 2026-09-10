/**
 * Split every `[data-split]` element into per-character spans (words kept
 * unbreakable) and reveal them when the element enters the viewport. The
 * stagger reads left-to-right with a small per-character jitter, so a line
 * resolves out of a blur rather than marching in like a ticker.
 */
export function initSplitText(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-split]'));

  els.forEach((el) => {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';

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
            word.style.display = 'inline-block';
            word.style.whiteSpace = 'nowrap';
            part.split('').forEach((ch) => {
              const s = document.createElement('span');
              s.className = 'tp-char';
              s.textContent = ch;
              word.appendChild(s);
            });
            frag.appendChild(word);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(el);

    el.querySelectorAll<HTMLElement>('.tp-char').forEach((s, i) => {
      const d = i * 0.016 + (Math.sin(i * 12.9898) * 0.5 + 0.5) * 0.09;
      s.style.transitionDelay = `${d.toFixed(3)}s`;
    });
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
  els.forEach((el) => io.observe(el));
  // Safety net: never leave copy invisible.
  window.setTimeout(() => els.forEach((el) => el.classList.add('tp-in')), 6000);
}
