import { createBrowserHistory, History } from 'history'
import PathParser from 'path-parser'
import { BehaviorSubject, Observable } from 'rxjs'

import { equalParams } from './equalParams'
import { findDeepestMatchingRoute } from './findDeepestMatchingRoute'
import {
   AnyRouteConfig,
   AnyRouteWithNestedRoutesConfig,
   AnyRouteWithParamsConfig,
   AnyRouteWithPathConfig,
   RouteConfig
} from './RouteConfig'
import { RouterConfig } from './RouterConfig'

interface NoParamsLeafRouter<Config extends AnyRouteConfig> {
   isMatching: boolean
   match$: Observable<undefined | { params: {} }>
   push(): void
}

type NoParamsTreeRouter<
   Config extends AnyRouteWithNestedRoutesConfig
> = NoParamsLeafRouter<Config> & Router<Config['_nested']>

interface LeafRouter<Config extends AnyRouteWithParamsConfig> {
   isMatching: boolean
   match$: Observable<
      undefined | { params: { [P in Config['_params']]: string } }
   >
   push(params: { [P in Config['_params']]: string }): void
}

type TreeRouter<
   Config extends AnyRouteWithParamsConfig & AnyRouteWithNestedRoutesConfig
> = LeafRouter<Config> &
   Router<
      {
         [N in keyof Config['_nested']]: Config['_nested'][N] extends AnyRouteWithPathConfig &
            AnyRouteWithParamsConfig &
            AnyRouteWithNestedRoutesConfig
            ? RouteConfig<{
                 path: Config['_nested'][N]['_path']
                 params: Config['_nested'][N]['_params'] | Config['_params']
                 nested: Config['_nested'][N]['_nested']
              }>
            : Config['_nested'][N] extends AnyRouteWithPathConfig &
                 AnyRouteWithParamsConfig
               ? RouteConfig<{
                    path: Config['_nested'][N]['_path']
                    params: Config['_nested'][N]['_params'] | Config['_params']
                 }>
               : Config['_nested'][N] extends AnyRouteWithPathConfig &
                    AnyRouteWithNestedRoutesConfig
                  ? RouteConfig<{
                       path: Config['_nested'][N]['_path']
                       params: Config['_params']
                       nested: Config['_nested'][N]['_nested']
                    }>
                  : Config['_nested'][N] extends AnyRouteWithParamsConfig &
                       AnyRouteWithNestedRoutesConfig
                     ? RouteConfig<{
                          params:
                             | Config['_nested'][N]['_params']
                             | Config['_params']
                          nested: Config['_nested'][N]['_nested']
                       }>
                     : Config['_nested'][N] extends AnyRouteWithPathConfig
                        ? RouteConfig<{
                             path: Config['_nested'][N]['_path']
                             params: Config['_params']
                          }>
                        : Config['_nested'][N] extends AnyRouteWithParamsConfig
                           ? RouteConfig<{
                                params:
                                   | Config['_nested'][N]['_params']
                                   | Config['_params']
                             }>
                           : Config['_nested'][N] extends AnyRouteWithNestedRoutesConfig
                              ? RouteConfig<{
                                   params: Config['_params']
                                   nested: Config['_nested'][N]['_nested']
                                }>
                              : RouteConfig<{
                                   params: Config['_params']
                                }>
      }
   >

export type Router<Config extends RouterConfig> = {
   [PageId in keyof Config]: Config[PageId] extends AnyRouteWithParamsConfig &
      AnyRouteWithNestedRoutesConfig
      ? TreeRouter<Config[PageId]>
      : Config[PageId] extends AnyRouteWithNestedRoutesConfig
         ? NoParamsTreeRouter<Config[PageId]>
         : Config[PageId] extends AnyRouteWithParamsConfig
            ? LeafRouter<Config[PageId]>
            : NoParamsLeafRouter<Config[PageId]>
}

function doNothing() {
   // doNothing
}

const createPush = (targetRouter: any, parent: any) => (params: any = {}) => {
   if (targetRouter.isMatching) {
      targetRouter.unmatchChildren()
   } else {
      parent.push(params)
   }
   targetRouter.match(params)
}

function createNestedRouter(
   config: { path?: string; params?: string[]; nested?: RouterConfig } = {},
   parent: any,
   parentConfig: any
): any {
   const parentPath = parentConfig.path || ''
   const path = parentPath + config.path
   const router = {
      isMatching: false,
      path
   } as any
   router.match$ = new BehaviorSubject<undefined | object>(undefined)
   const paramKeys = (config && config.params) || []
   const children = [] as any[]
   router.unmatchChildren = () => children.forEach(child => child.unmatch())
   router.match = (params: any) => {
      if (router.isMatching) {
         if (!equalParams(paramKeys, router.params, params)) {
            parent.match(params)
            router.params = params
            router.match$.next({ params })
         }
      } else {
         router.isMatching = true
         router.params = params
         router.match$.next({ params })
      }
   }
   router.push = createPush(router, parent)
   if (config.path !== undefined) {
      const pathParser = new PathParser(path)
      router._matchesPath = (pathname: string): object | null => {
         const parsedParams = pathParser.partialTest(pathname)
         if (parsedParams !== null) {
            return {
               router,
               params: parsedParams
            }
         } else return null
      }
   } else {
      router._matchesPath = () => null
   }

   router.unmatch = () => {
      if (router.isMatching) {
         router.unmatchChildren()
         router.isMatching = false
         router.params = undefined
         router.match$.next(undefined)
      }
   }
   const { nested } = config as any
   if (nested !== undefined) {
      Object.keys(nested).forEach(nestedRouteId => {
         const nestedRouter = createNestedRouter(
            nested[nestedRouteId],
            router,
            config
         )
         children.push(nestedRouter)
         router[nestedRouteId] = nestedRouter
      })
   }
   router.nested = children
   return router
}

export function createMemoryRouter<Config extends RouterConfig>(
   config: Config
): Router<Config> {
   const routeIds = Object.keys(config)
   const router = {} as any
   routeIds.forEach(routeId => {
      router[routeId] = createNestedRouter(
         config[routeId] as any,
         router,
         config
      )
   })
   router.push = () => router.unmatchChildren()
   router.match = doNothing
   router.unmatchChildren = () =>
      routeIds.forEach(routeId => {
         router[routeId].unmatch()
      })
   return router
}

export function createBrowserRouter<Config extends RouterConfig>(
   config: Config,
   history: History = createBrowserHistory()
): Router<Config> {
   const routeIds = Object.keys(config)
   const routeCount = routeIds.length
   const router = {} as any
   const nestedRouters = [] as Array<Router<any>>
   routeIds.forEach(routeId => {
      const routeConfig = config[routeId] as any
      const nestedRouter = createNestedRouter(routeConfig, router, config)
      router[routeId] = nestedRouter
      nestedRouters.push(nestedRouter)
   })
   history.listen(({ pathname }) => {
      const match = findDeepestMatchingRoute(nestedRouters, pathname)
      if (match) (match as any).router.push(match.params)
   })
   router.push = doNothing
   //  router.push = () => router.unmatchChildren()
   //  router.match = doNothing
   //  router.unmatchChildren = () =>
   //     routeIds.forEach(routeId => {
   //        router[routeId].unmatch()
   //     })
   return router
}
