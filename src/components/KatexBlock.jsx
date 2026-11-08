import React, { memo, useMemo } from 'react';
import katex from 'katex';
import { sanitizeLatexVariable } from '../math/expressionTools';

/**
 * Renderiza LaTeX con KaTeX (memoizado con comparador estricto de expresión matemática
 * y protegido contra traductores automáticos del navegador).
 * El color se hereda del contenedor.
 */
const KatexBlock = memo(
  function KatexBlock({ tex, math, display = true, className = '' }) {
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

    const Tag = display ? 'div' : 'span';
    return (
      <Tag
        translate="no"
        className={`notranslate ${display ? 'overflow-x-auto overflow-y-hidden' : ''} ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  },
  (prev, next) =>
    (prev.tex ?? prev.math) === (next.tex ?? next.math) &&
    prev.display === next.display &&
    prev.className === next.className
);

export default KatexBlock;
