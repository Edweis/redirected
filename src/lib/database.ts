import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';

sqlite3.verbose();
export type RedirectNew = {
	domain: string;
	pathname: string;
	destination: string;
};
export type Redirect = RedirectNew & {
	createdAt: string; deletedAt?: string;
};
export type Travel = {
	domain: string;
	pathname: string;
	createdAt: string;
	ip?: string;
	method?: string;
	referrer?: string;
	userAgent?: string;
	userAgentBrowser?: string;
	userAgentOs?: string;
	userAgentDevice?: string;
	status?: string;
	redirectedTo?: string;
}

// Init database
export const db = await open({ filename: './.sqlite.db', driver: sqlite3.Database });
