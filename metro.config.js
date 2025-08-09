const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Enable Hermes
config.resolver.platforms = ['ios', 'android', 'native', 'web']

// Development optimizations
if (process.env.NODE_ENV === 'development') {
  config.resolver.alias = {
    '@': './src',
  }
  config.transformer.minifierConfig = {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  }
}

module.exports = config


