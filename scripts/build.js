/* eslint-disable import/no-extraneous-dependencies */
import esbuild from 'esbuild';
import postCssPlugin from "esbuild-postcss";
const isWatch = process.argv.includes('--watch');

const NODE_ENV = isWatch ? 'development' : 'production';
const context = await esbuild.context({
  outdir: 'dist',
  target: 'node18',
  platform: 'node',
  logLevel: 'debug',
  format: 'esm',
  entryPoints: ['src/**/*.ts', 'src/styles.css', 'src/index.html',],
  loader: { '.html': 'copy' }, // Copy the HTML file to the output
  plugins: [postCssPlugin()],
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