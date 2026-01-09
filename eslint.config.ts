import { defineConfig, globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import globals from 'globals'
import ts from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import stylistic from '@stylistic/eslint-plugin'
import cypress from 'eslint-plugin-cypress'

/*
This config is a combination of the basic recommended React configs from Vite:

- https://github.com/vitejs/vite/blob/main/packages/create-vite/template-react/eslint.config.js
- https://github.com/vitejs/vite/blob/main/packages/create-vite/template-react-ts/eslint.config.js

This is required since the project uses both JSX and TSX. The other settings that are configured are:

- setting the ecmaVersion to match the one in the tsconfig.json
- setting the react version to match the one in package.json
- adding the stylistic and cypress plugins
- a few overrides to the recommended rules:
  - matching the typescript behavior for unused variables ( https://typescript-eslint.io/rules/no-unused-vars/ )
  - disabling the react/prop-types rule
  - allowing more than one JSX expression per line

*/
export default defineConfig([
  globalIgnores(['build']),
  {
    extends: [
      js.configs.recommended,
      ts.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      stylistic.configs.recommended,
      cypress.configs.recommended,
    ],
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'react/prop-types': 'off',
      '@stylistic/jsx-one-expression-per-line': ['off'],
      // TODO: these issues should be fixed
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
