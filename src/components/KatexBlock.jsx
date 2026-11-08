import React, { memo, useMemo } from 'react';
import katex from 'katex';
import { sanitizeLatexVariable } from '../math/expressionTools';

/**
 * Renderiza LaTeX con KaTeX (memoizado y protegido contra traductores automáticos del navegador).
 * El color se hereda del contenedor.
 */
const KatexBlock = memo(function KatexBlock({ tex, display = true, className = '' }) {
  const html = useMemo(() => {
    const clean = sanitizeLatexVariable(tex);
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
  }, [tex, display]);

  const Tag = display ? 'div' : 'span';
  return (
    <Tag
      translate="no"
      className={`notranslate ${display ? 'overflow-x-auto overflow-y-hidden' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export default KatexBlock;
