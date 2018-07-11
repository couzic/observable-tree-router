import { createBrowserHistory, History } from 'history'
import PathParser from 'path-parser'
import { BehaviorSubject } from 'rxjs'

import { equalParams } from './equalParams'
import { findDeepestMatchingRoute } from './findDeepestMatchingRoute'
import { RouterConfig } from './RouterConfig'
import { Router, TreeRouter } from './TreeRouter'

function doNothing() {
   // doNothing
}

const createMemoryPush = (targetRouter: any, parent: any) => (
   params: any = {}
) => {
   if (targetRouter.isMatching) {
      targetRouter.unmatchChildren()
   } else {
      parent.pushMemory(params)
   }
   targetRouter.match(params)
}

const createBrowserPush = (history: History) => (
   targetRouter: any,
   parent: any
) => {
   if (targetRouter.path === undefined) {
      return createMemoryPush(targetRouter, parent)
   } else {
      return (params: any = {}) =>
         history.push(targetRouter.pathParser.build(params))
   }
}

function createNestedRouter(
   config: { path?: string; params?: string[]; nested?: RouterConfig } = {},
   parent: any,
   parentConfig: any,
   createPush: any
): any {
   const parentPath = parentConfig.path || ''
   const path = parentPath + config.path
   const router = {
      currentState: { isMatching: false },
      path
   } as any
   router.match$ = new BehaviorSubject<undefined | object>(undefined)
   const paramKeys = (config && config.params) || []
   const children = [] as any[]
   router.unmatchChildren = () => children.forEach(child => child.unmatch())
   router.match = (params: any) => {
      if (router.currentState.isMatching) {
         if (!equalParams(paramKeys, router.currentState.params, params)) {
            parent.match(params)
            router.currentState = {
               isMatching: true,
               params
            }
            router.match$.next({ params })
         }
      } else {
         router.currentState = {
            isMatching: true,
            params
         }
         router.match$.next({ params })
      }
   }
   router.push = createPush(router, parent)
   router.pushMemory = createMemoryPush(router, parent)
   if (config.path !== undefined) {
      router.pathParser = new PathParser(path)
      router._matchesPath = (pathname: string): object | null => {
         const parsedParams = router.pathParser.partialTest(pathname)
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
      if (router.currentState.isMatching) {
         router.unmatchChildren()
         router.currentState = {
            isMatching: false,
            params: undefined
         }
         router.match$.next(undefined)
      }
   }
   const { nested } = config as any
   if (nested !== undefined) {
      Object.keys(nested).forEach(nestedRouteId => {
         const nestedRouter = createNestedRouter(
            nested[nestedRouteId],
            router,
            config,
            createPush
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
): TreeRouter<Config> {
   const routeIds = Object.keys(config)
   const router = {} as any
   routeIds.forEach(routeId => {
      router[routeId] = createNestedRouter(
         config[routeId] as any,
         router,
         config,
         createMemoryPush
      )
   })
   router.pushMemory = () => router.unmatchChildren()
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
): TreeRouter<Config> {
   const routeIds = Object.keys(config)
   const router = {} as any
   const nestedRouters = [] as Array<Router<any>>
   routeIds.forEach(routeId => {
      const routeConfig = config[routeId] as any
      const nestedRouter = createNestedRouter(
         routeConfig,
         router,
         config,
         createBrowserPush(history)
      )
      router[routeId] = nestedRouter
      nestedRouters.push(nestedRouter)
   })
   history.listen(({ pathname }) => {
      const match = findDeepestMatchingRoute(nestedRouters, pathname)
      if (match) (match as any).router.pushMemory(match.params)
   })
   router.pushMemory = () => router.unmatchChildren()
   router.match = doNothing
   router.unmatchChildren = () =>
      nestedRouters.forEach(nestedRouter => (nestedRouter as any).unmatch())
   return router
}
