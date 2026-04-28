import nextPlugin from '@next/eslint-plugin-next'
import rootConfig from '../../eslint.config.mjs'

export default [
  { ignores: ['scripts/**'] },
  ...rootConfig,
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    settings: {
      next: {
        rootDir: '.',
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
]
