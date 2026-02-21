module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@shared': '../../packages/shared/src',
            '@components': './components',
            '@hooks': './hooks',
            '@services': './services',
          },
        },
      ],
    ],
  };
};
