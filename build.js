/* eslint-disable import/no-extraneous-dependencies */
import esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const NODE_ENV =  isWatch ? 'development' : 'production';
const context = await esbuild.context({
  outdir: 'dist',
  bundle: true,
  target: 'node18',
  platform: 'node',
  format: 'esm',
  external: ['sqlite', 'sqlite3'], // Too hard to bunle, we install them on the server after the deployment
  entryPoints: ['src/index.ts',],
  loader: { '.html': 'text' }, // Copy the HTML file to the output
  banner: {
    // fix require import in ESM, @see https://github.com/evanw/esbuild/issues/1921#issuecomment-1403107887
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  define: { 'process.env.NODE_ENV': JSON.stringify(NODE_ENV) },
});

if (isWatch) context.watch();
else {
  await context.rebuild();
  await context.dispose();
}