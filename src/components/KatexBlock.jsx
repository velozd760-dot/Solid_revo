import React, { memo, useMemo } from 'react';
import katex from 'katex';
import { sanitizeLatexVariable } from '../math/expressionTools';

/**
 * Renderiza LaTeX con KaTeX (memoizado, protegido contra traducción automática
 * y contenido en contenedores con scroll horizontal táctil para móviles).
 */
const KatexBlock = memo(
  function KatexBlock({ tex, math, display = true, scrollable = false, className = '' }) {
    const rawMath = tex ?? math ?? '';

    const html = useMemo(() => {
      const clean = sanitizeLatexVariable(rawMath);
      try {
        const rendered = katex.renderToString(clean, {
          displayMode: display,
          output: 'html',
          throwOnError: false,
          strict: 'ignore',
        });
        return rendered.replace(/<span /g, '<span translate="no" ');
      } catch {
        return `<code translate="no" class="notranslate">${clean.replace(/</g, '&lt;')}</code>`;
      }
    }, [rawMath, display]);

    if (display) {
      return (
        <div
          translate="no"
          className={`notranslate katex-scroll-container w-full py-0.5 text-[13px] sm:text-sm ${className}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    const shouldScrollInline = scrollable || rawMath.length > 22;

    return (
      <span
        translate="no"
        className={`notranslate ${
          shouldScrollInline
            ? 'katex-scroll-container inline-block align-middle whitespace-nowrap'
            : ''
        } ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  },
  (prev, next) =>
    (prev.tex ?? prev.math) === (next.tex ?? next.math) &&
    prev.display === next.display &&
    prev.scrollable === next.scrollable &&
    prev.className === next.className
);

export default KatexBlock;
