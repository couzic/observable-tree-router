import { History } from 'history'
import Path from 'path-parser'
import { BehaviorSubject } from 'rxjs'

import { RouterConfig } from './RouterConfig'
import { TreeRouter } from './TreeRouter'

class NestedBrowserRouter {
   public readonly path: string
   private readonly _pathParser: Path
   private readonly _state$: BehaviorSubject<any>
   private readonly _match$: BehaviorSubject<any>
   private readonly _nestedRouteIds: string[] = []
   private readonly _nestedRouters: NestedBrowserRouter[] = []
   //    private readonly _params: string[] | undefined
   //    // TODO Make sure no route has same name as one of those public methods
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
   public get isMatchingChild(): boolean {
      const { match } = this.state$.getValue()
      return match !== null && !match.exact
   }
   public get currentParams(): null | object {
      const { match } = this._state$.getValue()
      if (match === null || match.params === undefined) return null
      else return match.params
   }
   constructor(
      private readonly _routeId: string,
      config: any,
      private readonly _parentRouter: NestedBrowserRouter,
      private readonly _history: History
   ) {
      const relativePath = (config && config.path) || '/' + _routeId
      this.path = _parentRouter.path + relativePath
      this._pathParser = new Path(this.path)
      //       if (
      //          _parentRouter._params !== undefined ||
      //          (config && config.params !== undefined && config.params.length > 0)
      //       ) {
      //          this._params = [
      //             ...(_parentRouter._params || []),
      //             ...((config && config.params) || [])
      //             // TODO Remove duplicates (in case a param is defined in both parent and child)
      //          ]
      //       }
      const initialState = { match: null }
      if (config && config.nested) {
         this._nestedRouteIds = Object.keys(config.nested)
         this._nestedRouteIds.forEach(nestedRouteId => {
            const nestedRouteConfig = config.nested[nestedRouteId]
            const nestedRouter = new NestedBrowserRouter(
               nestedRouteId,
               nestedRouteConfig,
               this,
               _history
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
      const url = this._pathParser.build(params)
      this._history.push(url)
      //       if (this.isMatchingExact) {
      //          this._handlePushWhenMatchingExact(params)
      //       } else if (this.isMatchingChild) {
      //          this._handlePushWhenMatchingChild(params)F
      //       } else {
      //          this._handlePushWhenNotMatching(params)
      //       }
   }
   private _testUrl(url: string): boolean {
      const partialMatch = this._pathParser.partialTest(url)
      if (Boolean(partialMatch)) {
         const exactMatch = this._pathParser.test(url)
         if (Boolean(exactMatch)) {
            this._matchExactUrl(url)
         } else {
            this._matchUrl(url)
         }
         return true
      } else {
         this._unmatch()
         return false
      }
   }
   private _matchExactUrl(url: string) {
      const newState = {
         //  ...this.currentState,
         match: { exact: true }
      }
      this._state$.next(newState)
      this._match$.next(newState.match)
   }
   private _matchUrl(url: string) {
      const newState = {
         //  ...this.currentState,
         match: { exact: false }
      }
      let hasMatched = false
      for (
         let i = 0, routeCount = this._nestedRouteIds.length;
         i < routeCount;
         i++
      ) {
         //  if (hasMatched) {
         //     this._nestedRouters[i]._unmatch()
         //  } else {
         hasMatched = this._nestedRouters[i]._testUrl(url)
         //  }
      }
      this._state$.next(newState)
      this._match$.next(newState.match)
   }
   //    private _handlePushWhenMatchingExact(params: any) {
   //       if (params === undefined) return
   //       if (
   //          this._params !== undefined &&
   //          equalParams(this._params, this.currentParams, params)
   //       )
   //          return
   //       const newState = {
   //          ...this.currentState,
   //          match: { exact: true, params }
   //       }
   //       this._parentRouter._onChildMatchAgain(this._routeId, newState)
   //       this._state$.next(newState)
   //       this._match$.next(newState.match)
   //    }
   //    private _handlePushWhenMatchingChild(params: any) {
   //       this._unmatchChildren()
   //       const newState = params
   //          ? {
   //               match: { exact: true, params },
   //               ...this._retrieveNestedRouteStates()
   //            }
   //          : { match: { exact: true }, ...this._retrieveNestedRouteStates() }
   //       this._parentRouter._onChildMatchAgain(this._routeId, newState)
   //       this._state$.next(newState)
   //       this._match$.next(newState.match)
   //    }
   //    private _handlePushWhenNotMatching(params: any) {
   //       const newState = params
   //          ? {
   //               match: { exact: true, params },
   //               ...this._retrieveNestedRouteStates()
   //            }
   //          : { match: { exact: true }, ...this._retrieveNestedRouteStates() }
   //       this._parentRouter._onChildMatch(this._routeId, newState)
   //       this._state$.next(newState)
   //       this._match$.next(newState.match)
   //    }
   private _retrieveNestedRouteStates() {
      const nestedStates = {} as any
      this._nestedRouteIds.forEach(nestedRouteId => {
         nestedStates[nestedRouteId] = (this as any)[nestedRouteId].currentState
      })
      return nestedStates
   }
   //    /**
   //     * Called when a direct child now matches, and previously did not.
   //     */
   //    private _onChildMatch(routeId: string, newChildState: any) {
   //       if (this.isMatchingExact) {
   //          this._handleChildMatchWhenMatchingExact(routeId, newChildState)
   //       } else if (this.isMatchingChild) {
   //          this._handleChildMatchWhenMatchingOtherChild(routeId, newChildState)
   //       } else {
   //          this._handleChildMatchWhenNotMatching(routeId, newChildState)
   //       }
   //    }
   //    private _handleChildMatchWhenMatchingExact(
   //       routeId: string,
   //       newChildState: any
   //    ) {
   //       const newState = {
   //          ...this.currentState,
   //          [routeId]: newChildState
   //       } as any
   //       if (this._params === undefined) {
   //          newState.match = { exact: false }
   //       } else {
   //          const newParams = {} as any
   //          this._params.forEach((param: string) => {
   //             newParams[param] = newChildState.match.params[param]
   //          })
   //          newState.match = { exact: false, params: newParams }
   //       }
   //       this._parentRouter._onChildMatchAgain(this._routeId, newState)
   //       this._state$.next(newState)
   //       this._match$.next(newState.match)
   //    }
   //    private _handleChildMatchWhenMatchingOtherChild(
   //       routeId: string,
   //       newChildState: any
   //    ) {
   //       this._unmatchChildren()
   //       const newState = {
   //          match: this.currentState.match,
   //          ...this._retrieveNestedRouteStates(),
   //          [routeId]: newChildState
   //       } as any
   //       if (this._params === undefined) {
   //          this._parentRouter._onChildStateChanged(this._routeId, newState)
   //          this._state$.next(newState)
   //       } else {
   //          const newParams = {} as any
   //          this._params.forEach((param: string) => {
   //             newParams[param] = newChildState.match.params[param]
   //          })
   //          if (equalParams(this._params, this.currentParams, newParams)) {
   //             this._parentRouter._onChildStateChanged(this._routeId, newState)
   //             this._state$.next(newState)
   //          } else {
   //             newState.match = { exact: false, params: newParams }
   //             this._parentRouter._onChildMatchAgain(this._routeId, newState)
   //             this._state$.next(newState)
   //             this._match$.next(newState.match)
   //          }
   //       }
   //    }
   //    private _handleChildMatchWhenNotMatching(
   //       routeId: string,
   //       newChildState: any
   //    ) {
   //       const newState = {
   //          ...this.currentState,
   //          [routeId]: newChildState
   //       } as any
   //       if (this._params === undefined) {
   //          newState.match = { exact: false }
   //       } else {
   //          const newParams = {} as any
   //          this._params.forEach((param: string) => {
   //             newParams[param] = newChildState.match.params[param]
   //          })
   //          newState.match = { exact: false, params: newParams }
   //       }
   //       this._parentRouter._onChildMatch(this._routeId, newState)
   //       this._state$.next(newState)
   //       this._match$.next(newState.match)
   //    }
   //    /**
   //     * Called when a route change causes a child to update its state, but since is not directly concerned by the change it does not emit a new match.
   //     * From this point and down to root store, params can not change.
   //     */
   //    private _onChildStateChanged(routeId: string, newChildState: any) {
   //       const newState = {
   //          ...this.currentState,
   //          [routeId]: newChildState
   //       } as any
   //       this._parentRouter._onChildStateChanged(this._routeId, newState)
   //       this._state$.next(newState)
   //    }
   //    /**
   //     * Called when a child that previously matched receives new and different params
   //     */
   //    private _onChildMatchAgain(routeId: string, newChildState: any) {
   //       if (this._params === undefined) {
   //          this._onChildStateChanged(routeId, newChildState)
   //       } else {
   //          const newState = {
   //             ...this.currentState,
   //             [routeId]: newChildState
   //          } as any
   //          const newParams = {} as any
   //          this._params.forEach((param: string) => {
   //             newParams[param] = newChildState.match.params[param]
   //          })
   //          if (equalParams(this._params, this.currentParams, newParams)) {
   //             this._parentRouter._onChildStateChanged(this._routeId, newState)
   //             this._state$.next(newState)
   //          } else {
   //             newState.match = { exact: false, params: newParams }
   //             this._parentRouter._onChildMatchAgain(this._routeId, newState)
   //             this._state$.next(newState)
   //             this._match$.next(newState.match)
   //          }
   //       }
   //    }
   private _unmatch() {
      if (this.currentState.match) {
         // this._unmatchChildren()
         const newState = {
            match: null,
            ...this._retrieveNestedRouteStates()
         } as any
         this._state$.next(newState)
         this._match$.next(newState.match)
      }
   }
   //    private _unmatchChildren() {
   //       this._nestedRouters.forEach(nestedRouter => {
   //          nestedRouter._unmatch()
   //       })
   //    }
}

export function createBrowserRouter<Config extends RouterConfig>(
   history: History,
   config: Config
): TreeRouter<Config> {
   const router = {
      path: '',
      get currentState() {
         return this._state$.getValue()
      },
      get state$() {
         return this._state$
      }
   } as any
   const initialState = {} as any
   const routeIds = Object.keys(config)
   const nestedRouters: any[] = []
   routeIds.forEach(routeId => {
      const nestedRouter = new NestedBrowserRouter(
         routeId,
         config[routeId],
         router,
         history
      )
      nestedRouters.push(nestedRouter)
      router[routeId] = nestedRouter
      initialState[routeId] = nestedRouter.currentState
   })
   router._state$ = new BehaviorSubject(initialState)
   const routeCount = routeIds.length
   history.listen(location => {
      let hasMatched = false
      for (let i = 0; i < routeCount; i++) {
         if (hasMatched) {
            nestedRouters[i]._unmatch()
         } else {
            hasMatched = nestedRouters[i]._testUrl(location.pathname)
         }
      }
   })
   //    router._onChildMatch = (childId: string, newChildState: any) => {
   //       router._unmatchAll()
   //       const newState = {} as any
   //       routeIds.forEach(routeId => {
   //          newState[routeId] = router[routeId].currentState
   //       })
   //       newState[childId] = newChildState
   //       router._state$.next(newState)
   //    }
   //    router._onChildStateChanged = (childId: string, newChildState: any) => {
   //       const newState = {
   //          ...router.currentState,
   //          [childId]: newChildState
   //       }
   //       router._state$.next(newState)
   //    }
   //    router._onChildMatchAgain = router._onChildStateChanged
   //    router._unmatchAll = () => routeIds.forEach(id => router[id]._unmatch())
   return router
}
