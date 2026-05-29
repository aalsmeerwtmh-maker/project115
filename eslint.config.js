const tseslint = require('typescript-eslint');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

// Note: eslint-plugin-react is not included here — it has an internal
// compatibility bug with ESLint v10 (getFilename API was removed).
// typescript-eslint + react-hooks covers the critical rules for a TS React Native project.

module.exports = tseslint.config(
  { ignores: ['node_modules', '.expo', 'dist', 'web-build', 'coverage', 'android', 'ios'] },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    plugins: {
      'react-hooks': reactHooksPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // Enforces Rules of Hooks — no conditional hooks, no missing deps
      ...reactHooksPlugin.configs.recommended.rules,

      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Prettier formatting as warnings
      'prettier/prettier': 'warn',
    },
  },

  prettierConfig,
);
