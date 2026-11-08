/**
 * Hook: useMathParser
 * Parseo seguro de f(x) / g(x): valida, compila y genera LaTeX limpio (KaTeX).
 */
import { useMemo } from 'react';
import { analyzeExpression } from '../math/expressionTools';

export function useMathParser(expressionStr = 'sqrt(x)') {
  return useMemo(() => analyzeExpression(expressionStr), [expressionStr]);
}
