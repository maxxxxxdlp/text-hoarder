const eslintConfig = require('@maxxxxxdlp/eslint-config');
const eslintConfigReact = require('@maxxxxxdlp/eslint-config-react');
const globals = require('globals');

const abbreviationsConfig = eslintConfig
  .map((rules) =>
    typeof rules === 'object' && typeof rules.rules === 'object'
      ? Object.entries(rules.rules).find(
          ([name, options]) =>
            name === 'unicorn/prevent-abbreviations' && Array.isArray(options),
        )?.[1]?.[1]
      : undefined,
  )
  .find((options) => typeof options === 'object');
if (abbreviationsConfig === undefined)
  throw new Error('Unable to find unicorn/prevent-abbreviations config');

module.exports = [
  ...eslintConfig,
  ...eslintConfigReact,
  {
    languageOptions: {
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-empty-interface': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          ...abbreviationsConfig,
          allowList: {
            ...abbreviationsConfig.allowList,
            spAppResourceDir: true,
            SpAppResourceDir: true,
            ScopedAppResourceDir: true,
          },
        },
      ],
    },
  },
];