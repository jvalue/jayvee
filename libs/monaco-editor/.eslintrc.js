module.exports = {
  extends: [
    'plugin:@nrwl/nx/react',
    '@jvalue/eslint-config-jvalue/react',
    '../../.eslintrc.json',
  ],
  ignorePatterns: ['!**/*', '/*.*'],
  parserOptions: {
    project: ['./tsconfig.lib.json'],
    tsconfigRootDir: __dirname,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      rules: {},
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {},
    },
    {
      files: ['*.js', '*.jsx'],
      rules: {},
    },
  ],
};
