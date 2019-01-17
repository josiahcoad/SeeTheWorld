const path = require('path');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');

module.exports = {
    context: __dirname,
    entry: {
        content: [
            './src/content/index.js',
        ],
        background: [
            './src/background/index.js',
        ],
        popup: [
            './src/popup/index.js',
        ],
    },
    output: {
        filename: '[name]Bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [{
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
        },
        {
            test: /\.css$/,
            loader: 'style-loader!css-loader',
        },
        {
            test: /\.html$/,
            loader: 'html-loader',
            exclude: /node_modules/,
        },
        ],
    },
    resolve: {
        modules: [
            path.join(__dirname, 'node_modules'),
        ],
    },
    plugins: [
        new ChromeExtensionReloader({
            reloadPage: true,
            background: 'background',
        }),
    ],
};
