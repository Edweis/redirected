import type * as koa from 'koa'
export type Middleware = koa.Middleware<{ body?: any[] | Record<any, any>, render: (template: string, params?: Record<string, any>) => Promise<void> }>