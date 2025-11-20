/**
 * Webpack Configuration for SK8 TypeScript
 * Supports both development and production builds
 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/sk8.ts',

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDevelopment ? 'sk8.js' : 'sk8.min.js',
      library: {
        name: 'SK8',
        type: 'umd',
        export: 'default',
        umdNamedDefine: true,
      },
      globalObject: 'this',
      clean: true,
    },

    resolve: {
      extensions: ['.ts', '.js', '.json'],
      extensionAlias: {
        '.js': ['.js', '.ts'],
      },
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.json',
                transpileOnly: isDevelopment,
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg|woff2?|ttf|eot)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name][ext]',
          },
        },
      ],
    },

    plugins: [
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: 'sk8.css',
            }),
          ]
        : []),
    ],

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: false,
              passes: 2,
            },
            mangle: {
              properties: false,
            },
            format: {
              comments: false,
              preamble: '/* SK8 TypeScript Port - https://github.com/apple/sk8 */',
            },
          },
          extractComments: false,
        }),
      ],
      usedExports: true,
      sideEffects: false,
    },

    devtool: isDevelopment ? 'eval-source-map' : 'source-map',

    performance: {
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
      hints: isProduction ? 'warning' : false,
    },

    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
    },

    // Development server configuration
    devServer: {
      static: {
        directory: path.join(__dirname, 'demo'),
      },
      compress: true,
      port: 8080,
      hot: true,
      open: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  };
};
