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

This is required since the project uses both JSX and TSX. The only other settings that are configured are:

- setting the ecmaVersion to match the one in the tsconfig.json
- setting the react version to match the one in package.json
- adding the stylistic and cypress plugins
- matching the typescript behavior for unused variables ( https://typescript-eslint.io/rules/no-unused-vars/ )
- disabling the react/prop-types rule

*/
export default ts.config(
  { ignores: ['build'] },
  {
    extends: [js.configs.recommended, ts.configs.recommended, stylistic.configs.recommended, cypress.configs.recommended],
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
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@stylistic': stylistic,
      cypress,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
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
    },
  },
)
