import { defineConfig, globalIgnores } from 'eslint/config'
import ts from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

/*
This ESLint config is only for code formatting via @stylistic.

All React, Typescript, react-hooks, react-refresh, and other correctness linting
has moved to oxlint (see .oxlintrc.json), which is faster and is the recommended
approach for Vite projects. @stylistic currently has no oxlint equivalent, and
typescript-eslint is only used to provide TS/TSX compatibility.

The switch to oxlint mirrors Vite's recommended React templates:

- https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react
- https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts

*/
export default defineConfig([
  globalIgnores(['build/**', 'server/dist/**']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [stylistic.configs.recommended],
    languageOptions: {
      parser: ts.parser,
      ecmaVersion: 2022,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      '@stylistic/jsx-one-expression-per-line': ['off'],
    },
  },
])
