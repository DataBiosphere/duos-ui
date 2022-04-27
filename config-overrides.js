const webpack = require('webpack');
module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    util: require.resolve("util"),
    stream: require.resolve("stream-browserify"),
    zlib: require.resolve("browserify-zlib"),
    assert: require.resolve("assert"),
    buffer: require.resolve("buffer"),
    process: require.resolve("process/browser")
  });
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false,
    },
  });
  return config;
};
