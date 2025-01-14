const path = require("path");

module.exports = {
  mode: "production",
  entry: path.resolve(__dirname, "src/index.js"),
  watch: true,
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000,
  },
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, "lib"),
    filename: "[name].js",
    libraryTarget: "commonjs2",
    chunkFilename: "language-[name].[chunkhash].js",
  },
  externals: {
    react: "commonjs react",
    "react-dom": "commonjs react-dom",
  },
  // optimization: {
  //     splitChunks: {
  //         cacheGroups: {
  //             languages: {
  //                 test: /localize\/langs\/.*\.json$/,
  //                 name: (module) => {
  //                     const languageName = module.resource.match(/langs\/(.*).json$/)[1];
  //                     return `language-${languageName}`;
  //                 },
  //                 chunks: "all",
  //                 type: "json",
  //                 enforce: true,
  //             },
  //         },
  //     },
  // },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        use: "babel-loader",
      },
    ],
  },
};
