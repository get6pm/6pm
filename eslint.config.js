// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const rootDir = import.meta.dirname;

/** Files that are allowed (or required by their framework) to use a default export. */
const defaultExportAllowed = [
  'apps/mobile/src/app/**',
  'apps/web/src/pages/**',
  'apps/api/src/index.ts',
  '**/*.config.{js,mjs,cjs,ts,mts}',
  '**/*.d.ts',
];

const namedExportsOnly = {
  selector: 'ExportDefaultDeclaration',
  message:
    'Use named exports. Default exports are only for route files, Astro pages, the Worker entry and tool configs.',
};

/** Metro maps neither `./x.js` to `x.ts` nor such dynamic imports: bundled code imports relatives extensionless. */
const extensionlessRelativeImports = [
  'ImportDeclaration',
  'ExportNamedDeclaration',
  'ExportAllDeclaration',
  'ImportExpression',
].map((node) => ({
  selector: `${node}[source.value=/^\\..*\\.js$/]`,
  message:
    'Import relative TypeScript modules without an extension (Metro cannot resolve `.js` to `.ts`).',
}));

const testFiles = ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/test/**', '**/__tests__/**'];

export default defineConfig([
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/.expo/',
    '**/.astro/',
    '**/.wrangler/',
    '**/coverage/',
    'apps/mobile/ios/',
    'apps/mobile/android/',
    'design/',
    'docs/',
    'plans/',
    '**/*.generated.*',
    // Written by tools/scripts/generate-native.ts.
    'apps/mobile/targets/_shared/domain-native.js',
  ]),

  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.js', '*.mjs', '*.cjs', '*.ts'] },
        tsconfigRootDir: rootDir,
      },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-restricted-syntax': ['error', namedExportsOnly],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },

  // Plain JS config files and scripts: lint syntax only, no type information.
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } },
  },

  // Everything Metro may bundle (the app and the shared packages) uses extensionless relative imports.
  {
    files: ['apps/mobile/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', namedExportsOnly, ...extensionlessRelativeImports] },
  },

  { files: defaultExportAllowed, rules: { 'no-restricted-syntax': 'off' } },

  {
    files: testFiles,
    rules: {
      'max-lines': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  prettier,
]);
