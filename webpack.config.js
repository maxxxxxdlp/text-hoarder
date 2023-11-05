/**
 * WebPack config for development and production
 */

const path = require('node:path');
const webpack = require('webpack');

module.exports = ({ cwd }, argv) => {
  const pathParts = cwd?.split(path.sep) ?? [];
  const packagesPathPart = pathParts.indexOf('packages');
  const package = pathParts[packagesPathPart + 1] ?? 'browser-extension';
  const outputPath = path.resolve(__dirname, 'packages', package, 'dist');
  return /** @type { import('webpack').Configuration } */ ({
    module: {
      rules: [
        {
          test: /\.(png|gif|jpg|jpeg|svg)$/,
          type: 'asset',
        },
        {
          test: /\.css$/,
          use: [
            {
              // See https://stackoverflow.com/a/68995851/8584605
              loader: 'style-loader',
              options:
                package === 'browser-extension'
                  ? {
                      insert: require.resolve(
                        './packages/browser-extension/src/components/Core/styleLoader.ts',
                      ),
                    }
                  : undefined,
            },
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.[tj]sx?$/,
          exclude: /(node_modules)/,
          use: [
            {
              loader: 'babel-loader?+cacheDirectory',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      useBuiltIns: 'usage',
                      corejs: {
                        version: '3.33.0',
                        proposals: true,
                      },
                      bugfixes: true,
                      // See "browserslist" section of package.json
                      browserslistEnv: argv.mode,
                    },
                  ],
                  ['@babel/preset-react'],
                  ['@babel/preset-typescript'],
                ],
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      symlinks: false,
    },
    // Set appropriate process.env.NODE_ENV
    mode: argv.mode,
    /*
     * User recommended source map type in production
     * Can't use the recommended "eval-source-map" in development due to
     * https://stackoverflow.com/questions/48047150/chrome-extension-compiled-by-webpack-throws-unsafe-eval-error
     */
    devtool:
      argv.mode === 'development' ? 'cheap-module-source-map' : 'source-map',
    entry:
      package === 'browser-extension'
        ? {
            preferences:
              argv.mode === 'development'
                ? './packages/browser-extension/src/components/Preferences/development.tsx'
                : './packages/browser-extension/src/components/Preferences/index.tsx',
            background:
              './packages/browser-extension/src/components/Background/index.ts',
            readerMode:
              argv.mode === 'development'
                ? './packages/browser-extension/src/components/ReaderMode/development.tsx'
                : './packages/browser-extension/src/components/ReaderMode/index.tsx',
          }
        : {
            cli: './packages/cli/src/components/Cli/index.ts',
            web: './packages/cli/src/components/Web/index.tsx',
          },
    plugins:
      argv.mode === 'development'
        ? [
            new webpack.optimize.LimitChunkCountPlugin({
              maxChunks: 1,
            }),
          ]
        : undefined,
    output: {
      path: outputPath,
      clean: true,
      publicPath: '/public/',
      filename: '[name].bundle.js',
      environment: {
        arrowFunction: true,
        const: true,
        destructuring: true,
        bigIntLiteral: true,
        forOf: true,
        dynamicImport: true,
        module: true,
      },
    },
    watchOptions: {
      ignored: '**/node_modules/',
    },
    optimization: {
      minimize: false,
    },
    performance: {
      // Disable bundle size warnings for bundles <2 MB
      maxEntrypointSize: 2 * 1024 * 1024,
      maxAssetSize: 2 * 1024 * 1024,
    },
    stats: {
      env: true,
      outputPath: true,
      warnings: true,
      errors: true,
      errorDetails: true,
      errorStack: true,
      moduleTrace: true,
      timings: true,
    },
  });
};