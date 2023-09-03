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
  entryPoints: ['src/**/*.ts','src/**/*.hbs', 'src/public/styles.css'],
  loader: { '.html': 'copy', '.js': 'copy', '.hbs': 'copy' }, // Copy the HTML file to the output
  plugins: [
    postCssPlugin(),
    copy({
      copyOnStart:true, 
      resolveFrom: 'cwd',
      assets: { from: ['src/public/*'], to: ['dist/public'], },
    }
    )],
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