/* eslint-disable import/no-extraneous-dependencies */
import esbuild from 'esbuild';
import autoprefixer from "autoprefixer";
import postCssPlugin from "@deanc/esbuild-plugin-postcss";
import postCssNested from "postcss-nested";
const isWatch = process.argv.includes('--watch');

const NODE_ENV = isWatch ? 'development' : 'production';
const context = await esbuild.context({
  outdir: 'dist',
  target: 'node18',
  platform: 'node',
  format: 'esm',
  entryPoints: ['src/**/*.ts', 'src/index.html', 'src/styles.css'],
  loader: { '.html': 'copy' }, // Copy the HTML file to the output
  plugins: [
    postCssPlugin({ plugins: [autoprefixer, postCssNested], }),
  ],
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