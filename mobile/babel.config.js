module.exports = {
  presets: ['metro-react-native-babel-preset'],
  plugins: [
    // Allow resolveJsonModule-style imports for config.json
    ['@babel/plugin-transform-modules-commonjs', { allowTopLevelThis: true }],
  ],
};
