import fs from 'fs';
import path from 'path';

let cacheProjectRoot = null;
export const projectRoot = (_base?: string) => {
  if (cacheProjectRoot) return cacheProjectRoot;
  const base = _base || new URL(import.meta.url).pathname
  const fileName = path.join(base, 'package.json')
  const exists = fs.existsSync(fileName);
  if (!exists) return projectRoot(path.join(base, '..'))
  cacheProjectRoot = base;
  return base
}

export const SUB_DOMAIN_REG = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,7}$/;