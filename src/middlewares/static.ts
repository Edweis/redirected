import { Middleware } from "../lib/types.js";
import fs from 'fs';
import path from "path"
import { projectRoot } from "../lib/helpers.js";


const EXTS = new Map([
  ['html', 'html'],
  ['js', 'text/javascript'],
  ['css', 'text/css'],
  ['ico', 'image/x-icon'],
  ['png', 'image/png'],
  ['webmanifest', 'text'],
])
// Robot.txt
export const staticAssets: Middleware = async (ctx, next) => {
  const [, fileName, ext] = /\/public\/([\w\-]+\.(\w+))/.exec(ctx.path) || []
  if (!EXTS.has(ext)) return next()
  const pathName = path.join(projectRoot(), 'dist/public/' + fileName)
  ctx.body = fs.createReadStream(pathName);
  ctx.type = EXTS.get(ext)!
}

// Certificates
export const wellKnownForCerts: Middleware = async (ctx, next) => {
  const file = /^\/\.well-known\/(.+)$/.exec(ctx.path)?.[1]
  if (file == null) return next()
  if (file.includes('..')) return next()
  if (file.endsWith('/')) return next()

  const wellKnownPath = path.join(projectRoot(), 'src/.well-known/' + file)
  const exists = fs.existsSync(wellKnownPath)
  console.log('Looking for ', { file, wellKnownPath, exists })
  if (exists) {
    ctx.type = 'html';
    ctx.body = fs.createReadStream(wellKnownPath);
  }
}