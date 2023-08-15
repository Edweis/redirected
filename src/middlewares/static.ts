import { Middleware } from "../lib/types.js";
import fs from 'fs';
import path from "path"
//@ts-ignore ???
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// HTML
export const rootWebsite: Middleware = async (ctx, next) => {
  if (ctx.path !== '/') return next()
  const pathName = path.join(__dirname, '../index.html')
  ctx.type = 'html';
  ctx.body = fs.createReadStream(pathName);
}

// Certificates
export const wellKnownForCerts: Middleware = async (ctx, next) => {
  const file = /^\/\.well-known\/(.+)$/.exec(ctx.path)?.[1]
  if (file == null) return next()

  const wellKnownPath = path.join(__dirname, '../../src/.well-known/' + file)
  const exists = fs.existsSync(wellKnownPath)
  console.log('Looking for ', { file, wellKnownPath, exists })
  if (exists) {
    ctx.type = 'html';
    ctx.body = fs.createReadStream(wellKnownPath);
  }
}