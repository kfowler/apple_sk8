/**
 * Rollup Configuration for SK8 TypeScript
 * Generates optimized ESM and CJS bundles
 */

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

const banner = `/**
 * SK8 TypeScript Port
 * A multimedia authoring environment for the web
 * Based on the original SK8 by Apple Computer, Inc.
 * @license SEE LICENSE IN sk8_license.pdf
 */`;

const baseConfig = {
  input: 'src/sk8.ts',

  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    json(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      rootDir: './src',
      outDir: './dist',
      exclude: ['**/*.test.ts', '**/*.spec.ts', 'tests/**'],
    }),
  ],

  external: [],

  onwarn(warning, warn) {
    // Suppress certain warnings
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    warn(warning);
  },
};

export default [
  // ESM build (for modern bundlers and browsers)
  {
    ...baseConfig,
    output: {
      file: 'dist/sk8.esm.js',
      format: 'es',
      banner,
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      ...baseConfig.plugins,
      production && terser({
        compress: {
          passes: 2,
          pure_getters: true,
          unsafe: false,
        },
        format: {
          comments: false,
          preamble: banner,
        },
        mangle: {
          properties: false,
        },
      }),
    ].filter(Boolean),
  },

  // CJS build (for Node.js compatibility)
  {
    ...baseConfig,
    output: {
      file: 'dist/sk8.cjs.js',
      format: 'cjs',
      banner,
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      ...baseConfig.plugins,
      production && terser({
        compress: {
          passes: 2,
          pure_getters: true,
          unsafe: false,
        },
        format: {
          comments: false,
          preamble: banner,
        },
        mangle: {
          properties: false,
        },
      }),
    ].filter(Boolean),
  },

  // UMD build (for browser <script> tags)
  {
    ...baseConfig,
    output: {
      file: 'dist/sk8.umd.js',
      format: 'umd',
      name: 'SK8',
      banner,
      sourcemap: true,
      exports: 'named',
      globals: {},
    },
    plugins: [
      ...baseConfig.plugins,
      production && terser({
        compress: {
          passes: 2,
          pure_getters: true,
          unsafe: false,
        },
        format: {
          comments: false,
          preamble: banner,
        },
        mangle: {
          properties: false,
        },
      }),
    ].filter(Boolean),
  },
];
