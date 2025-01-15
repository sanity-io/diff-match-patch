import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: [
      // ignore hidden files and folders
      '**/.*/**',
      '**/dist/**',
      '.releaserc.cjs',
      'coverage',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    plugins: {'simple-import-sort': simpleImportSort},
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 9,
      sourceType: 'module',
    },
    rules: {
      'import/extensions': ['error', 'always', {js: 'always', ignorePackages: true}],
      complexity: 'off',
      'max-depth': 'off',
      'max-statements': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'warn',
      'import/no-duplicates': ['error', {'prefer-inline': true}],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
      'import/order': 'off',
      'sort-imports': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/no-unresolved': 'off',
    },
  },
  {
    plugins: {'unused-imports': unusedImports},
  },
  {
    files: ['examples/ts/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    rules: {'no-console': 'off'},
  },
]
