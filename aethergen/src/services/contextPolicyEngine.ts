type Rule = { name: string; when: string; effect: Record<string, any> }
type ContextRules = { version: number; defaults: Record<string, any>; rules: Rule[] }

export function evaluatePolicy(rules: ContextRules, context: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...(rules.defaults || {}) }
  for (const r of rules.rules || []) {
    try {
      // Extremely simple evaluator; replace with safe expression parser
      const expr = r.when
        .replace(/([a-zA-Z_][a-zA-Z0-9_]*)/g, (m) => (m in context ? JSON.stringify(context[m]) : m))
        .replace(/==/g, '===')
      // eslint-disable-next-line no-eval
      if (eval(expr)) Object.assign(out, r.effect)
    } catch {}
  }
  return out
}


