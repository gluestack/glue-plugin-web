const withPlugins = require('next-compose-plugins');
const withTM = require('next-transpile-modules')([
  'react-native-web',
  '@expo/html-elements',
  // '@expo/vector-icons',
  // '@dank-style/react',
]);

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Transform all direct `react-native` imports to `react-native-web`
      'react-native$': 'react-native-web',
    };
    config.resolve.extensions = [
      '.web.js',
      '.web.ts',
      '.web.tsx',
      ...config.resolve.extensions,
    ];
    return config;
  },
};

module.exports = withPlugins([withTM], nextConfig);
