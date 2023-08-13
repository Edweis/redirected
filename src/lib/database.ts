import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

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
export const db = await open({
  filename: './sqlite.db',
  driver: sqlite3.Database,
});