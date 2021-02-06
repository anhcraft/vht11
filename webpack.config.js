const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

const commonConfig = {
    mode: 'development',
    devtool: 'inline-source-map',
    node: {
        __dirname: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(png|jpg)$/,
                loader: 'url-loader',
                options: {
                    limit: 99999,
                    esModule: false,
                    /*name: 'assets/[name].[ext]',
                    publicPath: '/'*/
                }
            },
        ],
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js'],
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            automaticNameDelimiter: '-',
            name(module) {
                return module.identifier().split('/').reduceRight(item => item).split('.').slice(0, -1).join('.');
            },
        },
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ]
    }
};

module.exports = [
    Object.assign({}, commonConfig, {
        target: 'electron-main',
        entry: {
            renderer: './src/main/App.ts',
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'src/main/dist')
        },
    }),
    Object.assign({}, commonConfig, {
        target: 'web',
        entry: {
            ui: './src/renderer/Main.ts',
        },
        output: {
            filename: '[contenthash].js',
            path: path.resolve(__dirname, 'src/renderer/dist')
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: "./src/renderer/index.html",
                minify: true
            }),
            new webpack.NormalModuleReplacementPlugin( // remove MathJax3 warnings
                /AsyncLoad\.js/,
                function (resource) {
                    if (resource.context.endsWith('mathjax3/util')) {
                        resource.request = resource.request.replace(/AsyncLoad/,'AsyncLoad-disabled');
                    }
                }
            )
        ]
    })
];
