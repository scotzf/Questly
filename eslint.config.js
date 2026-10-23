// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // TypeScript already checks namespace members; this rule cannot follow
    // `export *` re-exports such as Notifications.AndroidImportance.
    rules: { 'import/namespace': 'off' },
  },
  {
    files: ['tests/**'],
    languageOptions: { globals: globals.node },
  },
]);
