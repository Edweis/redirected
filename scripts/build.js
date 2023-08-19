/* eslint-disable import/no-extraneous-dependencies */
import esbuild from 'esbuild';
import postCssPlugin from "esbuild-postcss";
import { copy } from 'esbuild-plugin-copy';
const isWatch = process.argv.includes('--watch');

const NODE_ENV = isWatch ? 'development' : 'production';

const context = await esbuild.context({
  outdir: 'dist',
  target: 'node18',
  platform: 'node',
  logLevel: 'debug',
  format: 'esm',
  entryPoints: ['src/**/*.ts', 'src/public/styles.css', 'src/public/index.html', 'src/public/script.js'],
  loader: { '.html': 'copy', '.js': 'copy' }, // Copy the HTML file to the output
  plugins: [postCssPlugin(), copy({
    resolveFrom: 'cwd',
    assets: {
      from: ['./public/*'],
      to: ['./public'],
    },
  })],
  banner: {
    // fix require import in ESM, @see https://github.com/evanw/esbuild/issues/1921#issuecomment-1403107887
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
    'process.env.DEPLOYED_AT': JSON.stringify(new Date().toISOString())
  },
});

if (isWatch) context.watch();
else {
  await context.rebuild();
  console.log('Built!')
  await context.dispose();
}