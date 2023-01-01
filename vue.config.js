module.exports = {
  publicPath: "./",
  devServer: {
    proxy: {
      '^/api/': {
          target: 'http://localhost:8081',
          logLevel: 'debug',
          pathRewrite: { "^/api/": "/api/" }
      }
    }
  }
};
