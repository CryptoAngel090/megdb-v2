import fs from 'node:fs'

const files = [
  'apps/web/src/components/LoginForm/LoginForm.module.css',
  'apps/web/src/components/RegisterForm/RegisterForm.module.css',
]

/** @type {readonly [string, string][]} — order: longer / more specific first where needed */
const pairs = [
  ['background: #000;', 'background: var(--bg);'],
  [
    'radial-gradient(circle at 20% 50%, rgba(229, 9, 20, 0.15) 0%, transparent 50%)',
    'radial-gradient(circle at 20% 50%, color-mix(in oklab, var(--primary) 15%, transparent) 0%, transparent 50%)',
  ],
  [
    'radial-gradient(circle at 80% 80%, rgba(139, 0, 139, 0.12) 0%, transparent 50%)',
    'radial-gradient(circle at 80% 80%, color-mix(in oklab, var(--color-info) 12%, transparent) 0%, transparent 50%)',
  ],
  [
    'radial-gradient(circle at 40% 20%, rgba(0, 100, 200, 0.08) 0%, transparent 50%)',
    'radial-gradient(circle at 40% 20%, color-mix(in oklab, var(--color-info) 8%, transparent) 0%, transparent 50%)',
  ],
  [
    'radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.15), transparent)',
    'radial-gradient(2px 2px at 20% 30%, color-mix(in oklab, var(--text-primary) 15%, transparent), transparent)',
  ],
  [
    'radial-gradient(2px 2px at 60% 70%, rgba(229, 9, 20, 0.2), transparent)',
    'radial-gradient(2px 2px at 60% 70%, color-mix(in oklab, var(--primary) 20%, transparent), transparent)',
  ],
  [
    'radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.1), transparent)',
    'radial-gradient(1px 1px at 50% 50%, color-mix(in oklab, var(--text-primary) 10%, transparent), transparent)',
  ],
  [
    'radial-gradient(1px 1px at 80% 10%, rgba(255, 255, 255, 0.15), transparent)',
    'radial-gradient(1px 1px at 80% 10%, color-mix(in oklab, var(--text-primary) 15%, transparent), transparent)',
  ],
  [
    'radial-gradient(2px 2px at 90% 60%, rgba(229, 9, 20, 0.15), transparent)',
    'radial-gradient(2px 2px at 90% 60%, color-mix(in oklab, var(--primary) 15%, transparent), transparent)',
  ],
  [
    'radial-gradient(1px 1px at 33% 80%, rgba(255, 255, 255, 0.1), transparent)',
    'radial-gradient(1px 1px at 33% 80%, color-mix(in oklab, var(--text-primary) 10%, transparent), transparent)',
  ],
  [
    'background: rgba(18, 18, 18, 0.85);',
    'background: color-mix(in oklab, var(--bg) 85%, transparent);',
  ],
  [
    'border: 1px solid rgba(229, 9, 20, 0.2);',
    'border: 1px solid color-mix(in oklab, var(--primary) 20%, transparent);',
  ],
  ['0 32px 80px rgba(0, 0, 0, 0.9),', 'var(--shadow-lg),'],
  [
    '0 0 60px rgba(229, 9, 20, 0.15),',
    '0 0 60px color-mix(in oklab, var(--primary) 15%, transparent),',
  ],
  [
    'inset 0 1px 0 rgba(255, 255, 255, 0.08),',
    'inset 0 1px 0 color-mix(in oklab, var(--text-primary) 8%, transparent),',
  ],
  [
    'inset 0 -1px 0 rgba(229, 9, 20, 0.1);',
    'inset 0 -1px 0 color-mix(in oklab, var(--primary) 10%, transparent);',
  ],
  [
    'background: radial-gradient(circle, rgba(229, 9, 20, 0.08) 0%, transparent 70%);',
    'background: radial-gradient(circle, color-mix(in oklab, var(--primary) 8%, transparent) 0%, transparent 70%);',
  ],
  [
    '0 0 30px rgba(229, 9, 20, 0.8),',
    '0 0 30px color-mix(in oklab, var(--primary) 80%, transparent),',
  ],
  [
    '0 0 60px rgba(229, 9, 20, 0.4);',
    '0 0 60px color-mix(in oklab, var(--primary) 40%, transparent);',
  ],
  [
    'background: linear-gradient(135deg, #fff 0%, var(--primary) 100%);',
    'background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);',
  ],
  [
    'text-shadow: 0 0 40px rgba(229, 9, 20, 0.3);',
    'text-shadow: 0 0 40px color-mix(in oklab, var(--primary) 30%, transparent);',
  ],
  [
    'background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);',
    'background: linear-gradient(135deg, var(--text-primary) 0%, color-mix(in oklab, var(--text-primary) 88%, var(--bg) 12%) 100%);',
  ],
  ['rgba(255, 255, 255, 0.9)', 'color-mix(in oklab, var(--text-primary) 90%, transparent)'],
  ['rgba(255, 255, 255, 0.7)', 'color-mix(in oklab, var(--text-primary) 70%, transparent)'],
  ['rgba(255, 255, 255, 0.65)', 'color-mix(in oklab, var(--text-primary) 65%, transparent)'],
  ['rgba(255, 255, 255, 0.6)', 'color-mix(in oklab, var(--text-primary) 60%, transparent)'],
  ['rgba(255, 255, 255, 0.5)', 'color-mix(in oklab, var(--text-primary) 50%, transparent)'],
  ['rgba(255, 255, 255, 0.45)', 'color-mix(in oklab, var(--text-primary) 45%, transparent)'],
  ['rgba(255, 255, 255, 0.4)', 'color-mix(in oklab, var(--text-primary) 40%, transparent)'],
  ['rgba(255, 255, 255, 0.38)', 'color-mix(in oklab, var(--text-primary) 38%, transparent)'],
  ['rgba(255, 255, 255, 0.35)', 'color-mix(in oklab, var(--text-primary) 35%, transparent)'],
  ['rgba(255, 255, 255, 0.3)', 'color-mix(in oklab, var(--text-primary) 30%, transparent)'],
  ['rgba(255, 255, 255, 0.25)', 'color-mix(in oklab, var(--text-primary) 25%, transparent)'],
  ['rgba(255, 255, 255, 0.22)', 'color-mix(in oklab, var(--text-primary) 22%, transparent)'],
  ['rgba(255, 255, 255, 0.2)', 'color-mix(in oklab, var(--text-primary) 20%, transparent)'],
  ['rgba(255, 255, 255, 0.16)', 'color-mix(in oklab, var(--text-primary) 16%, transparent)'],
  ['rgba(255, 255, 255, 0.15)', 'color-mix(in oklab, var(--text-primary) 15%, transparent)'],
  ['rgba(255, 255, 255, 0.12)', 'color-mix(in oklab, var(--text-primary) 12%, transparent)'],
  ['rgba(255, 255, 255, 0.1)', 'color-mix(in oklab, var(--text-primary) 10%, transparent)'],
  ['rgba(255, 255, 255, 0.08)', 'color-mix(in oklab, var(--text-primary) 8%, transparent)'],
  ['rgba(255, 255, 255, 0.06)', 'color-mix(in oklab, var(--text-primary) 6%, transparent)'],
  ['rgba(255, 255, 255, 0.05)', 'color-mix(in oklab, var(--text-primary) 5%, transparent)'],
  ['rgba(255, 255, 255, 0.04)', 'color-mix(in oklab, var(--text-primary) 4%, transparent)'],
  ['rgba(255, 255, 255, 0.03)', 'color-mix(in oklab, var(--text-primary) 3%, transparent)'],
  ['rgba(229, 9, 20, 0.5)', 'color-mix(in oklab, var(--primary) 50%, transparent)'],
  ['rgba(229, 9, 20, 0.4)', 'color-mix(in oklab, var(--primary) 40%, transparent)'],
  ['rgba(229, 9, 20, 0.3)', 'color-mix(in oklab, var(--primary) 30%, transparent)'],
  ['rgba(229, 9, 20, 0.2)', 'color-mix(in oklab, var(--primary) 20%, transparent)'],
  ['rgba(229, 9, 20, 0.18)', 'color-mix(in oklab, var(--primary) 18%, transparent)'],
  ['rgba(229, 9, 20, 0.15)', 'color-mix(in oklab, var(--primary) 15%, transparent)'],
  ['rgba(229, 9, 20, 0.12)', 'color-mix(in oklab, var(--primary) 12%, transparent)'],
  ['rgba(229, 9, 20, 0.1)', 'color-mix(in oklab, var(--primary) 10%, transparent)'],
  ['rgba(229, 9, 20, 0.08)', 'color-mix(in oklab, var(--primary) 8%, transparent)'],
  ['rgba(0, 0, 0, 0.95)', 'color-mix(in oklab, var(--bg) 95%, transparent)'],
  ['rgba(0, 0, 0, 0.9)', 'color-mix(in oklab, var(--bg) 90%, transparent)'],
  ['rgba(0, 0, 0, 0.3)', 'color-mix(in oklab, var(--bg) 30%, transparent)'],
  ['rgba(68, 255, 68, 0.4)', 'color-mix(in oklab, var(--color-success) 40%, transparent)'],
  ['rgba(68, 255, 68, 0.3)', 'color-mix(in oklab, var(--color-success) 30%, transparent)'],
  ['rgba(68, 255, 68, 0.2)', 'color-mix(in oklab, var(--color-success) 20%, transparent)'],
  ['rgba(0, 255, 136, 0.2)', 'color-mix(in oklab, var(--color-success) 20%, transparent)'],
  ['#44ff44', 'var(--color-success)'],
  ['#ff4444', 'var(--color-error)'],
  ['#ff6b6b', 'color-mix(in oklab, var(--color-error) 85%, var(--text-primary) 15%)'],
  ['#c00812', 'var(--primary-active)'],
  [
    'linear-gradient(135deg, rgba(229, 9, 20, 0.15) 0%, rgba(229, 9, 20, 0.08) 100%)',
    'linear-gradient(135deg, color-mix(in oklab, var(--primary) 15%, transparent) 0%, color-mix(in oklab, var(--primary) 8%, transparent) 100%)',
  ],
  [
    'linear-gradient(165deg, rgba(31, 31, 31, 0.95) 0%, rgba(18, 18, 18, 0.98) 100%)',
    'linear-gradient(165deg, color-mix(in oklab, var(--surface) 95%, transparent) 0%, color-mix(in oklab, var(--bg) 98%, transparent) 100%)',
  ],
  [
    'linear-gradient(135deg, rgba(68, 255, 68, 0.2) 0%, rgba(0, 255, 136, 0.2) 100%)',
    'linear-gradient(135deg, color-mix(in oklab, var(--color-success) 20%, transparent) 0%, color-mix(in oklab, var(--color-success) 20%, transparent) 100%)',
  ],
  [
    'linear-gradient(135deg, #44ff44 0%, #00ff88 100%)',
    'linear-gradient(135deg, var(--color-success) 0%, color-mix(in oklab, var(--color-success) 70%, var(--color-info) 30%) 100%)',
  ],
]

for (const rel of files) {
  const root = new URL('..', import.meta.url)
  const abs = new URL(rel, root)
  let s = fs.readFileSync(abs, 'utf8')
  for (const [a, b] of pairs) {
    if (!s.includes(a)) continue
    s = s.split(a).join(b)
  }
  fs.writeFileSync(abs, s)
}
