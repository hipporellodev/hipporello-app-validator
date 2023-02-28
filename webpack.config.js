var path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    watch: true,
    watchOptions: {
        aggregateTimeout: 200,
        poll: 1000,
    },
    output: {
        path: path.resolve('lib'),
        filename: 'index.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        react: 'commonjs react',
        'react-dom': 'commonjs react-dom',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                use: 'babel-loader'
            }
        ]
    }
}
