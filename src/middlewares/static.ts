import fs from 'node:fs';
import path from 'node:path';
import { type Middleware } from '../lib/types.js';
import { projectRoot } from '../lib/helpers.js';

const EXTS = new Map([
	['html', 'html'],
	['js', 'text/javascript'],
	['css', 'text/css'],
	['ico', 'image/x-icon'],
	['png', 'image/png'],
	['webmanifest', 'text'],
]);

// serve static assets for dev
export const staticAssets: Middleware = async (ctx, next) => {
	const [, fileName, ext] = /\/public\/([\w\-]+\.(\w+))/.exec(ctx.path) || [];
	if (!EXTS.has(ext)) {
		return next();
	}

	const pathName = path.join(projectRoot(), 'dist/public/' + fileName);
	ctx.body = fs.createReadStream(pathName);
	ctx.type = EXTS.get(ext)!;
};

