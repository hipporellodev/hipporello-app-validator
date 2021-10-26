var path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/HippoValidator.js',
    output: {
        path: path.resolve('lib'),
        filename: 'HippoValidator.js',
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
