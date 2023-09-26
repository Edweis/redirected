import fs from 'node:fs';
import path from 'node:path';

let cacheProjectRoot: string | undefined = undefined;
export const projectRoot = (_base?: string): string => {
	if (cacheProjectRoot) {
		return cacheProjectRoot;
	}

	const base = _base || new URL(import.meta.url).pathname;
	const fileName = path.join(base, 'package.json');
	const exists = fs.existsSync(fileName);
	if (!exists) {
		return projectRoot(path.join(base, '..'));
	}

	cacheProjectRoot = base;
	return base;
};

export const SUB_DOMAIN_REG = /^(?:[a-zA-Z\d](?:[a-zA-Z\d-]{0,61}[a-zA-Z\d])?\.)+[a-zA-Z]{2,7}$/;
