import { BehaviorSubject } from 'rxjs'

import { equalParams } from './equalParams'
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
   private readonly _nestedRouteIds: string[] = []
   private readonly _nestedRouters: NestedMemoryRouter[] = []
   public get currentState() {
      return this._state$.getValue()
   }
   public get state$() {
      return this._state$
   }
   public get match$() {
      return this._match$
   }
   public get isMatching(): boolean {
      return this._state$.getValue().match !== null
   }
   public get isMatchingExact(): boolean {
      const { match } = this._state$.getValue()
      return match !== null && match.exact
   }
   public get currentParams(): null | object {
      const { match } = this._state$.getValue()
      if (match === null || match.params === undefined) return null
      else return match.params
   }
   constructor(
      private readonly _routeId: string,
      private readonly _config: any,
      private readonly _parentRouter: any
   ) {
      const initialState = { match: null }
      if (_config && _config.nested) {
         this._nestedRouteIds = Object.keys(_config.nested)
         this._nestedRouteIds.forEach(nestedRouteId => {
            const nestedRouteConfig = _config.nested[nestedRouteId]
            const nestedRouter = new NestedMemoryRouter(
               nestedRouteId,
               nestedRouteConfig,
               this
            )
            this._nestedRouters.push(nestedRouter)
            ;(initialState as any)[nestedRouteId] = nestedRouter.currentState
            ;(this as any)[nestedRouteId] = nestedRouter
         })
      }
      this._state$ = new BehaviorSubject(initialState)
      this._match$ = new BehaviorSubject(initialState.match)
   }
   public push(params: any) {
      const newState = params
         ? { match: { exact: true, params } }
         : { match: { exact: true } }
      if (this.currentState.match) {
         if (!this.currentState.match.exact) {
            this.unmatchChildren()
         }
      } else {
         // TODO Add test for newState => should have nested route states
      }
      this._parentRouter.onChildPush(this._routeId, newState)
      this._nestedRouteIds.forEach(nestedRouteId => {
         ;(newState as any)[nestedRouteId] = (this as any)[
            nestedRouteId
         ].currentState
      })
      this._state$.next(newState)
      this._match$.next(newState.match)
   }
   public onChildPush(routeId: string, newChildState: any) {
      const newState = {
         ...this.currentState,
         [routeId]: newChildState
      } as any
      if (this._config.params === undefined) {
         newState.match = { exact: false }
      } else {
         const newParams = {} as any
         this._config.params.forEach((param: string) => {
            newParams[param] = newChildState.match.params[param]
         })
         if (
            this.currentState.match &&
            equalParams(this._config.params, this.currentParams, newParams)
         ) {
            // No params changed at this level, eject
            return
         }
         newState.match = { exact: false, params: newParams }
      }
      this._parentRouter.onChildPush(this._routeId, newState)
      this._state$.next(newState)
      this._match$.next(newState.match)
   }
   public unmatch() {
      if (this.currentState.match) {
         this.unmatchChildren()
         const newState = { match: null } as any
         this._nestedRouteIds.forEach(nestedRouteId => {
            newState[nestedRouteId] = (this as any)[nestedRouteId].currentState
         })
         this._state$.next(newState)
         this._match$.next(newState.match)
      }
   }
   public unmatchChildren() {
      this._nestedRouters.forEach(nestedRouter => {
         nestedRouter.unmatch()
      })
   }
}

export function createMemoryRouter<Config extends RouterConfig>(
   config: Config
): TreeRouter<Config> {
   const routeIds = Object.keys(config)
   const router = {
      get currentState() {
         return this._state$.getValue()
      },
      get state$() {
         return this._state$
      }
   } as any
   const nestedRouters: RouterNode[] = []
   const initialState = {} as any
   routeIds.forEach(routeId => {
      const nestedRouter = new NestedMemoryRouter(
         routeId,
         config[routeId],
         router
      )
      nestedRouters.push(nestedRouter)
      router[routeId] = nestedRouter
      initialState[routeId] = nestedRouter.currentState
   })
   router._state$ = new BehaviorSubject(initialState)
   //   router.pushMemory = () => router.unmatchChildren()
   //    router.match = doNothing
   router.onChildPush = (childId: string, newChildState: any) => {
      router.unmatchOtherBranches(childId)
      const newState = {} as any
      routeIds.forEach(routeId => {
         newState[routeId] = router[routeId].currentState
      })
      newState[childId] = newChildState
      router._state$.next(newState)
   }
   router.unmatchOtherBranches = (routeId: string) => {
      routeIds.filter(id => id !== routeId).forEach(id => router[id].unmatch())
   }
   return router
}
