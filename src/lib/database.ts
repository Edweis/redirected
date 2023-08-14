import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';

sqlite3.verbose();
export type RedirectNew = {
  domain: string,
  pathname: string,
  destination: string,
}
export type Redirect = RedirectNew & {
  createdAt: string, deletedAt
  ?: string
};

// init database
// I would love to use a top-level await as the doc says, it requires ESM target but esbuild 
export let db: Database<sqlite3.Database, sqlite3.Statement> = null
export const dbPromise = open({ filename: './.sqlite.db', driver: sqlite3.Database, }).then( value => { db = value})