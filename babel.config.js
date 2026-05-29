module.exports = function (api) {
  api.cache(true);
  // api.env() conflicts with api.cache(true), so read NODE_ENV directly instead.
  const isTest = process.env.NODE_ENV === 'test';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Inlines .sql files as string literals so Metro can bundle them.
      // Required for Drizzle migrations — drizzle-orm/expo-sqlite/migrator reads SQL as strings.
      ['inline-import', { extensions: ['.sql'] }],
      [
        'module-resolver',
        {
          alias: { '@': './src' },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      // Reanimated plugin depends on native worklets and must be excluded in Jest.
      // It must remain last when included. See: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation
      ...(isTest ? [] : ['react-native-reanimated/plugin']),
    ],
  };
};
