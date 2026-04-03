const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const path = require('path');

const projectRoot = process.cwd();

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['@', path.resolve(projectRoot)],
            ['@/components', path.resolve(projectRoot, 'components')],
            ['@/app', path.resolve(projectRoot, 'app')],
            ['@/hooks', path.resolve(projectRoot, 'hooks')],
            ['@/assets', path.resolve(projectRoot, 'assets')],
            ['@/services', path.resolve(projectRoot, 'services')],
            ['@/config', path.resolve(projectRoot, 'config')],
            ['@/constants', path.resolve(projectRoot, 'constants')],
          ],
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      },
    },
  },
]);