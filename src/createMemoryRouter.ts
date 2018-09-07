import { BehaviorSubject } from 'rxjs'

import { equalParams } from './equalParams'
import { RouterConfig } from './RouterConfig'
import { TreeRouter } from './TreeRouter'

function doNothing() {
   return
}

class NestedMemoryRouter {
   private readonly _state$: BehaviorSubject<any>
   private readonly _match$: BehaviorSubject<any>
   private readonly _nestedRouteIds: string[] = []
   private readonly _nestedRouters: NestedMemoryRouter[] = []
   private readonly _params: string[] | undefined
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
      private readonly _parentRouter: NestedMemoryRouter
   ) {
      if (
         _parentRouter._params !== undefined ||
         (config && config.params !== undefined && config.params.length > 0)
      ) {
         this._params = [
            ...(_parentRouter._params || []),
            ...((config && config.params) || [])
            // TODO Remove duplicates (in case a param is defined in both parent and child)
         ]
      }
      const initialState = { match: null }
      if (config && config.nested) {
         this._nestedRouteIds = Object.keys(config.nested)
         this._nestedRouteIds.forEach(nestedRouteId => {
            const nestedRouteConfig = config.nested[nestedRouteId]
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
      if (this.isMatchingExact) {
         this.handlePushWhenMatchingExact(params)
      } else if (this.isMatchingChild) {
         this.handlePushWhenMatchingChild(params)
      } else {
         this.handlePushWhenNotMatching(params)
      }
   }
   private handlePushWhenMatchingExact(params: any) {
      if (params === undefined) return
      if (
         this._params !== undefined &&
         equalParams(this._params, this.currentParams, params)
      )
         return
      const newState = {
         ...this.currentState,
         match: { exact: true, params }
      }
      this._parentRouter.onChildMatchAgain(this._routeId, newState)
      this._state$.next(newState)
      this._match$.next(newState.match)
   }
   private handlePushWhenMatchingChild(params: any) {
      this.unmatchChildren()
      const newState = params
         ? {
              match: { exact: true, params },
              ...this.retrieveNestedRouteStates()
           }
         : { match: { exact: true }, ...this.retrieveNestedRouteStates() }

      this._parentRouter.onChildStateChanged(this._routeId, newState)
      // TODO Should be:
      // this._parentRouter.onChildMatchAgain(this._routeId, newState)
      // TEST grandparent updates match when its params change
      this._state$.next(newState)
      this._match$.next(newState.match)
   }
   private handlePushWhenNotMatching(params: any) {
      const newState = params
         ? {
              match: { exact: true, params },
              ...this.retrieveNestedRouteStates()
           }
         : { match: { exact: true }, ...this.retrieveNestedRouteStates() }
      this._parentRouter.onChildMatch(this._routeId, newState)
      this._state$.next(newState)
      this._match$.next(newState.match)
   }
   private retrieveNestedRouteStates() {
      const nestedStates = {} as any
      this._nestedRouteIds.forEach(nestedRouteId => {
         nestedStates[nestedRouteId] = (this as any)[nestedRouteId].currentState
      })
      return nestedStates
   }
   /**
    * Called when a direct child now matches, and previously did not.
    */
   private onChildMatch(routeId: string, newChildState: any) {
      if (this.isMatchingExact) {
         this.handleChildMatchWhenMatchingExact(routeId, newChildState)
      } else if (this.isMatchingChild) {
         this.handleChildMatchWhenMatchingOtherChild(routeId, newChildState)
      } else {
         this.handleChildMatchWhenNotMatching(routeId, newChildState)
      }
   }
   private handleChildMatchWhenMatchingExact(
      routeId: string,
      newChildState: any
   ) {
      const newState = {
         ...this.currentState,
         [routeId]: newChildState
      } as any
      if (this._params === undefined) {
         newState.match = { exact: false }
      } else {
         const newParams = {} as any
         this._params.forEach((param: string) => {
            newParams[param] = newChildState.match.params[param]
         })
         newState.match = { exact: false, params: newParams }
      }
      this._parentRouter.onChildMatchAgain(this._routeId, newState)
      this._state$.next(newState)
      this._match$.next(newState.match)
   }
   private handleChildMatchWhenMatchingOtherChild(
      routeId: string,
      newChildState: any
   ) {
      this.unmatchChildren()
      const newState = {
         match: this.currentState.match,
         ...this.retrieveNestedRouteStates(),
         [routeId]: newChildState
      } as any
      if (this._params === undefined) {
         this._parentRouter.onChildStateChanged(this._routeId, newState)
         this._state$.next(newState)
      } else {
         const newParams = {} as any
         this._params.forEach((param: string) => {
            newParams[param] = newChildState.match.params[param]
         })
         if (equalParams(this._params, this.currentParams, newParams)) {
            this._parentRouter.onChildStateChanged(this._routeId, newState)
            this._state$.next(newState)
         } else {
            newState.match = { exact: false, params: newParams }
            this._parentRouter.onChildMatchAgain(this._routeId, newState)
            this._state$.next(newState)
            this._match$.next(newState.match)
            // TODO update state AND match
            // TODO test grandparent
            // newState.match = { exact: false, params: newParams }
         }
      }
   }
   private handleChildMatchWhenNotMatching(
      routeId: string,
      newChildState: any
   ) {
      const newState = {
         ...this.currentState,
         [routeId]: newChildState
      } as any
      if (this._params === undefined) {
         if (this.isMatchingChild) {
            // TODO Do NOT eject, state still has to be updated (match can still be ignored though)
            // TEST When child state changes but parent is not impacted:
            // 1. Parent state changes
            // 2. Parent match does not change
            // 3. Parent state.match keeps same reference
            return
         }
         newState.match = { exact: false }
      } else {
         const newParams = {} as any
         this._params.forEach((param: string) => {
            newParams[param] = newChildState.match.params[param]
         })
         if (
            this.currentState.match !== null &&
            equalParams(this._params, this.currentParams, newParams)
         ) {
            // TODO Do NOT eject, state still has to be updated (match can still be ignored though)
            // TEST When child state changes but parent is not impacted:
            // 1. Parent state changes
            // 2. Parent match does not change
            // 3. Parent state.match keeps same reference
            return
         }
         newState.match = { exact: false, params: newParams }
      }
      this._parentRouter.onChildMatch(this._routeId, newState)
      this._state$.next(newState)
      this._match$.next(newState.match)
   }
   /**
    * Called when a route change causes a child to emit a new state, but since is not directly concerned by the change it does not emit a new match
    */
   private onChildStateChanged(routeId: string, newChildState: any) {
      const newState = {
         ...this.currentState,
         [routeId]: newChildState
      } as any
      if (this._params !== undefined) {
         const newParams = {} as any
         this._params.forEach((param: string) => {
            newParams[param] = newChildState.match.params[param]
         })
         newState.match = { exact: false, params: newParams }
      }
      this._parentRouter.onChildStateChanged(this._routeId, newState)
      this._state$.next(newState)
      // this._match$.next(newState.match) // TODO Delete !!!
   }
   /**
    * Called when a child that previously matched receives new and different params
    */
   private onChildMatchAgain(routeId: string, newChildState: any) {
      const newState = {
         ...this.currentState,
         [routeId]: newChildState
      } as any
      if (this._params === undefined) {
         // TODO Test state updates
         this._state$.next(newState)
         // TODO Test great grandparent FOR
         // this._parentRouter.onChildStateChanged(this._routeId, newState) || onchildmatchagain
      } else {
         const newParams = {} as any
         this._params.forEach((param: string) => {
            newParams[param] = newChildState.match.params[param]
         })
         // TODO Check if params have changed. If not, keep previous match reference
         // If params have changed:
         newState.match = { exact: false, params: newParams }
         this._state$.next(newState)
         this._match$.next(newState.match)
         // else
         //   this._state$.next(newState)
         // TODO Test great grandparent FOR
         //  this._parentRouter.onChildStateChanged(this._routeId, newState) || onchildmatchagain
      }
   }
   private unmatch() {
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
   private unmatchChildren() {
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
   const nestedRouters: any[] = []
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
   router.onChildMatch = (childId: string, newChildState: any) => {
      router.unmatchOtherBranches(childId)
      const newState = {} as any
      routeIds.forEach(routeId => {
         newState[routeId] = router[routeId].currentState
      })
      newState[childId] = newChildState
      router._state$.next(newState)
   }
   router.onChildStateChanged = doNothing
   router.onChildMatchAgain = doNothing
   router.unmatchOtherBranches = (routeId: string) => {
      routeIds.filter(id => id !== routeId).forEach(id => router[id].unmatch())
   }
   return router
}
