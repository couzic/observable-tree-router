import { BehaviorSubject } from 'rxjs'

import { RouterConfig } from './RouterConfig'
import { TreeRouter } from './TreeRouter'

function doNothing() {
   // doNothing
}

// const createMemoryPush = (targetRouter: any, parent: any) => (
//    params: any = {}
// ) => {
//    if (targetRouter.isMatching) {
//       targetRouter.unmatchChildren()
//    } else {
//       parent.pushMemory(params)
//    }
//    targetRouter.match(params)
// }

// function createNestedRouter(
//    config: { path?: string; params?: string[]; nested?: RouterConfig } = {},
//    parent: any,
//    parentConfig: any,
//    createPush: any
// ): any {
//    const parentPath = parentConfig.path || ''
//    const path = parentPath + config.path
//    const router = {
//       currentState: { isMatching: false },
//       path
//    } as any
//    router.match$ = new BehaviorSubject<undefined | object>(undefined)
//    const paramKeys = (config && config.params) || []
//    const children = [] as any[]
//    router.unmatchChildren = () => children.forEach(child => child.unmatch())
//    router.match = (params: any) => {
//       if (router.currentState.isMatching) {
//          if (!equalParams(paramKeys, router.currentState.params, params)) {
//             parent.match(params)
//             router.currentState = {
//                isMatching: true,
//                params
//             }
//             router.match$.next({ params })
//          }
//       } else {
//          router.currentState = {
//             isMatching: true,
//             params
//          }
//          router.match$.next({ params })
//       }
//    }
//    router.push = createPush(router, parent)
//    router.pushMemory = createMemoryPush(router, parent)
//    if (config.path !== undefined) {
//       router.pathParser = new PathParser(path)
//       router._matchesPath = (pathname: string): object | null => {
//          const parsedParams = router.pathParser.partialTest(pathname)
//          if (parsedParams !== null) {
//             return {
//                router,
//                params: parsedParams
//             }
//          } else return null
//       }
//    } else {
//       router._matchesPath = () => null
//    }

//    router.unmatch = () => {
//       if (router.currentState.isMatching) {
//          router.unmatchChildren()
//          router.currentState = {
//             isMatching: false,
//             params: undefined
//          }
//          router.match$.next(undefined)
//       }
//    }
//    const { nested } = config as any
//    if (nested !== undefined) {
//       Object.keys(nested).forEach(nestedRouteId => {
//          const nestedRouter = createNestedRouter(
//             nested[nestedRouteId],
//             router,
//             config,
//             createPush
//          )
//          children.push(nestedRouter)
//          router[nestedRouteId] = nestedRouter
//       })
//    }
//    router.nested = children
//    return router
// }

interface RouterNode {
   unmatch(): void
   unmatchChildren(): void
}

class NestedMemoryRouter implements RouterNode {
   private readonly _state$: BehaviorSubject<any>
   private readonly _match$: BehaviorSubject<any>
   private readonly nestedRoutes: NestedMemoryRouter[] = []
   public get currentState() {
      return this._state$.getValue()
   }
   public get state$() {
      return this._state$
   }
   public get match$() {
      return this._match$
   }
   constructor(private config: any, private parent: any) {
      const initialState = { match: null }
      this._state$ = new BehaviorSubject(initialState)
      this._match$ = new BehaviorSubject(initialState.match)
      if (config && config.nested) {
         Object.keys(config.nested).forEach(routeId => {
            const nestedRouteConfig = config.nested[routeId]
            const nestedRouter = new NestedMemoryRouter(nestedRouteConfig, this)
            this.nestedRoutes.push(nestedRouter)
            ;(this as any)[routeId] = nestedRouter
         })
      }
   }
   public push(params: any, exact = true) {
      if (this.currentState.match) {
         this.unmatchChildren()
      } else {
         this.parent.onChildPush(params)
      }
      const newState = params
         ? { match: { exact, params } }
         : { match: { exact } }
      this._state$.next(newState)
      this._match$.next(newState.match)
   }
   public onChildPush(params: any) {
      this.push(params, false)
   }
   public unmatch() {
      if (this.currentState.match) {
         const newState = { match: null }
         this._state$.next(newState)
         this._match$.next(newState.match)
      }
   }

   public unmatchChildren() {
      //
   }
}

export function createMemoryRouter<Config extends RouterConfig>(
   config: Config
): TreeRouter<Config> {
   const routeIds = Object.keys(config)
   const router = {} as any
   const nestedRouters: RouterNode[] = []
   routeIds.forEach(routeId => {
      //   router[routeId] = createNestedRouter(
      //      config[routeId] as any,
      //      router,
      //      config,
      //      createMemoryPush
      //   )
      const nestedRouter = new NestedMemoryRouter(config[routeId], router)
      router[routeId] = nestedRouter
      nestedRouters.push(nestedRouter)
   })
   //   router.pushMemory = () => router.unmatchChildren()
   //    router.match = doNothing
   router.onChildPush = () => router.unmatchChildren()
   router.unmatchChildren = () =>
      nestedRouters.forEach(nestedRouter => {
         nestedRouter.unmatch()
      })
   return router
}
