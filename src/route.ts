import { RouteConfig } from './RouteConfig'
import { RouterConfig } from './RouterConfig'

/** With path and params and nested */
export function route<
   Path extends string,
   Params extends string,
   Nested extends object
>(config: {
   path: Path
   params: Params[]
   nested: Nested
}): RouteConfig<{
   path: Path
   params: Params
   nested: Nested extends RouterConfig ? Nested : never
}>

/** With path and params */
export function route<Path extends string, Params extends string>(config: {
   path: Path
   params: Params[]
}): RouteConfig<{
   path: Path
   params: Params
}>

/** With path and nested */
export function route<Path extends string, Nested extends object>(config: {
   path: Path
   nested: Nested
}): RouteConfig<{
   path: Path
   nested: Nested extends RouterConfig ? Nested : never
}>

/** With path */
export function route<Path extends string>(config: {
   path: Path
}): RouteConfig<{
   path: Path
}>

/** With params and nested */
export function route<Params extends string, Nested extends object>(config: {
   params: Params[]
   nested: Nested
}): RouteConfig<{
   params: Params
   nested: Nested extends RouterConfig ? Nested : never
}>

/** With params */
export function route<Params extends string>(config: {
   params: Params[]
}): RouteConfig<{
   params: Params
}>

/** With nested */
export function route<Nested extends RouterConfig>(config: {
   nested: Nested
}): RouteConfig<{
   nested: Nested extends RouterConfig ? Nested : never
}>

/** No config */
export function route(): RouteConfig<{}>

export function route(config?: any) {
   return config
}
