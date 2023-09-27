
import esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

const isWatch = process.argv.includes('--watch');

const NODE_ENV = isWatch ? 'development' : 'production';
const context = await esbuild.context({
	outdir: 'dist',
	target: 'node18',
	platform: 'node',
	format: 'esm',
	bundle: true,
	entryPoints: ['src/**/*.ts', 'src/redirected.app.conf'],
	external: [
		'sequelize', 'mongoose', 'redis', 'mock-aws-s3', 'aws-sdk', 'nock', // some lib were badly written, we have to exclude these
		'sqlite3' // SQLlite 3 needs to be installed on the server !
	],
	loader: { '.html': 'copy', '.conf': 'copy' }, // Copy the HTML file to the output
	plugins: [
		copy({
			copyOnStart: true,
			resolveFrom: 'cwd',
			assets: { from: ['src/public/*'], to: ['dist/public'], },
		}),
		copy({
			resolveFrom: 'cwd',
			assets: [
				{ from: ['views/*'], to: 'dist/views' },
				{ from: ['dist/index.js'], to: ['dist/index.mjs'], }, // We copy the file in mjs to run it with pm2
			]
		}),
	],
	banner: {
		// Fix require import in ESM, @see https://github.com/evanw/esbuild/issues/1921#issuecomment-1403107887
		js: 'import { createRequire } from \'module\'; const require = createRequire(import.meta.url);\n' +
			// Polyfill __dirname
			`import * as url from 'url';
				const __filename = url.fileURLToPath(import.meta.url);
				const __dirname = url.fileURLToPath(new URL('.', import.meta.url));`,
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
		'process.env.DEPLOYED_AT': JSON.stringify(new Date().toISOString()),
	},
});

if (isWatch) {
	context.watch();
} else {
	await context.rebuild();
	console.log('Built!');
	await context.dispose();
}
