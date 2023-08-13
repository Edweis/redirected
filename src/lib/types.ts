import type { EventContext, KVNamespace } from '@cloudflare/workers-types'

type Env = { REDIRECTED_KV: KVNamespace }
export type PagesFunction<
   Params extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>
> = (context: EventContext<Env, Params, Data>) => Response | Promise<Response>;