module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    // Отключаем правила, которые могут вызывать проблемы в существующем коде
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-unused-vars': 'warn',
    'react/no-unescaped-entities': 'off', // Отключаем правило для неэкранированных кавычек
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
