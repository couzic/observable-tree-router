import { History, Location } from 'history'
import { Path } from 'path-parser'
import { BehaviorSubject } from 'rxjs'

import { RouterConfig } from './RouterConfig'
import { TreeRouter } from './TreeRouter'

interface RouteMatch {
   id: string
   newState: {}
   updateRouter: () => void
}

class NestedBrowserRouter {
   public readonly path: string
   private readonly _pathParser: Path
   private readonly _state$: BehaviorSubject<any>
   private readonly _match$: BehaviorSubject<any>
   private readonly _nestedRouteIds: string[] = []
   private readonly _nestedRouters: NestedBrowserRouter[] = []
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
      readonly config: any,
      readonly _parentRouter: NestedBrowserRouter,
      private readonly _history: History
   ) {
      const relativePath = (config && config.path) || '/' + _routeId
      this.path = _parentRouter.path + relativePath
      this._pathParser = new Path(this.path)
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
   }
   public replace(params: any) {
      const url = this._pathParser.build(params)
      this._history.replace(url)
   }
   private _testUrl(url: string): RouteMatch | null {
      const partialMatch = this._pathParser.partialTest(url)
      if (Boolean(partialMatch)) {
         const exactMatch = this._pathParser.test(url)
         if (Boolean(exactMatch)) {
            return this._matchExactUrl(url, exactMatch)
         } else {
            return this._matchUrl(url, partialMatch)
         }
      } else {
         this._unmatch()
         return null
      }
   }
   private _matchExactUrl(url: string, exactMatch: any): RouteMatch {
      const newMatch =
         Object.keys(exactMatch).length > 0
            ? { exact: true, params: exactMatch }
            : { exact: true }
      if (this.isMatchingChild) this._unmatchChildren()
      const newState = {
         ...this._retrieveNestedRouteStates(),
         match: newMatch
      }
      return {
         id: this._routeId,
         newState,
         updateRouter: () => {
            this._state$.next(newState)
            this._match$.next(newState.match)
         }
      }
   }
   private _matchUrl(url: string, matchedParams: any): RouteMatch | null {
      let hasMatched: RouteMatch | null = null
      for (
         let i = 0, routeCount = this._nestedRouteIds.length;
         i < routeCount;
         i++
      ) {
         if (hasMatched !== null) {
            this._nestedRouters[i]._unmatch()
         } else {
            hasMatched = this._nestedRouters[i]._testUrl(url)
         }
      }
      const newMatch =
         Object.keys(matchedParams).length > 0
            ? { exact: false, params: matchedParams }
            : {
                 exact: false
              }
      const newState: any = {
         ...this._retrieveNestedRouteStates(),
         match: newMatch
      }
      if (hasMatched !== null) {
         newState[hasMatched.id] = hasMatched.newState
         return {
            id: this._routeId,
            newState,
            updateRouter: () => {
               this._state$.next(newState)
               this._match$.next(newState.match)
               hasMatched!.updateRouter()
            }
         }
      } else return null
   }
   private _retrieveNestedRouteStates() {
      const nestedStates = {} as any
      this._nestedRouteIds.forEach(nestedRouteId => {
         nestedStates[nestedRouteId] = (this as any)[nestedRouteId].currentState
      })
      return nestedStates
   }
   private _unmatch() {
      if (this.isMatching) {
         this._unmatchChildren()
         const newState = {
            match: null,
            ...this._retrieveNestedRouteStates()
         } as any
         this._state$.next(newState)
         this._match$.next(newState.match)
      }
   }
   private _unmatchChildren() {
      this._nestedRouters.forEach(nestedRouter => {
         nestedRouter._unmatch()
      })
   }
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
   const routeIds = Object.keys(config)
   const routeCount = routeIds.length
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
   })
   const testMatchOnChildren = (location: Location): RouteMatch | null => {
      const url = location.pathname + location.search
      let childMatch: RouteMatch | null = null
      for (let i = 0; i < routeCount; i++) {
         if (childMatch === null) {
            const nestedRoute = nestedRouters[i]
            childMatch = nestedRoute._testUrl(url)
            if (childMatch === null) nestedRoute._unmatch()
         } else {
            nestedRouters[i]._unmatch()
         }
      }
      return childMatch
   }
   const retrieveNestedStates = () => {
      const newState = {} as any
      nestedRouters.forEach(nestedRouter => {
         newState[nestedRouter._routeId] = nestedRouter.currentState
      })
      return newState
   }
   const initialMatch = testMatchOnChildren(history.location)
   const initialState =
      initialMatch !== null
         ? {
              ...retrieveNestedStates(),
              [initialMatch.id]: initialMatch.newState
           }
         : {
              ...retrieveNestedStates()
           }
   router._state$ = new BehaviorSubject(initialState)
   if (initialMatch !== null) initialMatch.updateRouter()
   history.listen(({ location }) => {
      const childMatch = testMatchOnChildren(location)
      const newState = {
         ...retrieveNestedStates()
      } as any
      if (childMatch !== null) {
         newState[childMatch.id] = childMatch.newState
         router._state$.next(newState)
         childMatch.updateRouter()
      } else {
         router._state$.next(newState)
      }
   })
   return router
}
