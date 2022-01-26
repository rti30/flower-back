let path = require('path');

let conf = {
    entry: './index.js', // *Начадьная точка сборки приложения
    output: {
        path: path.resolve(__dirname, './dist'), // * Рекомендуется использовать абсолютный путь
        filename: 'index.js',
        publicPath: 'dist/',
    },
    devServer: {
        contentBase: './dist',
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: '/node_modules/',
            }
        ],
    }
};
module.exports = (env, argv) => {
    //conf.devtool = (argv.mode === 'production') ? 'none' : 'eval-cheap-module-source-map';
    if (argv.mode === 'development') {
        conf.devtool = 'eval-cheap-module-source-map';
    }
    return conf;
}