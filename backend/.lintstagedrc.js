module.exports = {
  'src/**/*.ts': [
    'eslint --fix --max-warnings=0',
    'prettier --write',
  ],
  '*.{json,md}': ['prettier --write'],
};
