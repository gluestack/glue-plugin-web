/** @type {import('next').NextConfig} */

const withPlugins = require('next-compose-plugins');
const { withExpo } = require('@expo/next-adapter');
const withTM = require('next-transpile-modules')([
  'react-native-web',
  '@gluestack/design-system',
  '@gluestack/ui-creator',
  '@gluestack/ui',
  '@gluestack/css-injector',
  '@gluestack/cssify',
  '@gluestack/ui-convert-utility-to-sx',
  '@dank-style/react',
  '@dank-style/css-injector',
  '@dank-style/color-mode',
  '@dank-style/cssify',
  '@expo/html-elements',
  'expo-linear-gradient',
  'react-native-svg',
  'dank-style',
  '@react-native-aria/checkbox',
  '@react-native-aria/focus',
  '@react-native-aria/overlays',
  '@react-native-aria/radio',
  '@react-native-aria/slider',
  '@react-native-aria/toggle',
  '@react-native-aria/utils',
]);
const nextConfig = {
  reactStrictMode: true,
  webpack5: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false };

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Transform all direct `react-native` imports to `react-native-web`
      'react-native$': 'react-native-web',
    };

    return config;
  },
};

module.exports = withPlugins([[withTM], [withExpo]], {
  // Append the default value with md extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  ...nextConfig,
});
