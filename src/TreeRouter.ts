import { Observable } from 'rxjs'

import {
   AnyRouteConfig,
   AnyRouteWithNestedRoutesConfig,
   AnyRouteWithParamsConfig,
   AnyRouteWithPathConfig,
   RouteConfig
} from './RouteConfig'
import { RouterConfig } from './RouterConfig'

interface NoParamsLeafRouter<Config extends AnyRouteConfig> {
   push(): void
   readonly path: string
   readonly isMatching: boolean
   readonly isMatchingExact: boolean
   readonly isMatchingChild: boolean
   readonly state$: Observable<
      {
         readonly [K in keyof NoParamsLeafRouteState<
            Config
         >]: NoParamsLeafRouteState<Config>[K]
      }
   >
   readonly currentState: {
      readonly [K in keyof NoParamsLeafRouteState<
         Config
      >]: NoParamsLeafRouteState<Config>[K]
   }
   readonly match$: Observable<null | {
      readonly exact: boolean
   }>
}

type NoParamsBranchRouter<
   Config extends AnyRouteWithNestedRoutesConfig
> = Router<Config['_nested']> & {
   push(): void
   readonly path: string
   readonly isMatching: boolean
   readonly isMatchingExact: boolean
   readonly isMatchingChild: boolean
   readonly state$: Observable<
      {
         readonly [K in keyof NoParamsBranchRouteState<
            Config
         >]: NoParamsBranchRouteState<Config>[K]
      }
   >
   readonly currentState: {
      readonly [K in keyof NoParamsBranchRouteState<
         Config
      >]: NoParamsBranchRouteState<Config>[K]
   }
   readonly match$: Observable<null | {
      readonly exact: boolean
   }>
}

interface LeafRouter<Config extends AnyRouteWithParamsConfig> {
   push(params: { [P in Config['_params']]: string }): void
   readonly path: string
   readonly isMatching: boolean
   readonly isMatchingExact: boolean
   readonly isMatchingChild: boolean
   readonly state$: Observable<
      {
         readonly [K in keyof LeafRouteState<Config>]: LeafRouteState<Config>[K]
      }
   >
   readonly currentState: {
      readonly [K in keyof LeafRouteState<Config>]: LeafRouteState<Config>[K]
   }
   readonly match$: Observable<null | {
      readonly exact: boolean
      readonly params: { readonly [P in Config['_params']]: string }
   }>
}

type BranchRouter<
   Config extends AnyRouteWithParamsConfig & AnyRouteWithNestedRoutesConfig
> = {
   push(params: { [P in Config['_params']]: string }): void
   readonly path: string
   readonly isMatching: boolean
   readonly isMatchingExact: boolean
   readonly isMatchingChild: boolean
   readonly state$: Observable<
      {
         readonly [K in keyof BranchRouteState<Config>]: BranchRouteState<
            Config
         >[K]
      }
   >
   readonly currentState: {
      readonly [K in keyof BranchRouteState<Config>]: BranchRouteState<
         Config
      >[K]
   }
   readonly match$: Observable<null | {
      readonly exact: boolean
      readonly params: { readonly [P in Config['_params']]: string }
   }>
} & Router<
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

type Router<Config extends RouterConfig> = {
   [PageId in keyof Config]: Config[PageId] extends AnyRouteWithParamsConfig &
      AnyRouteWithNestedRoutesConfig
      ? BranchRouter<Config[PageId]>
      : Config[PageId] extends AnyRouteWithNestedRoutesConfig
         ? NoParamsBranchRouter<Config[PageId]>
         : Config[PageId] extends AnyRouteWithParamsConfig
            ? LeafRouter<Config[PageId]>
            : NoParamsLeafRouter<Config[PageId]>
}

export type TreeRouter<Config extends RouterConfig> = Router<Config> & {
   readonly state$: Observable<RouterState<Config>>
   readonly currentState: RouterState<Config>
}

interface NoParamsLeafRouteState<Config extends AnyRouteConfig> {
   readonly match: null | {
      readonly exact: boolean
   }
}

type NoParamsBranchRouteState<
   Config extends AnyRouteWithNestedRoutesConfig
> = NoParamsLeafRouteState<Config> &
   {
      readonly [K in keyof RouterState<Config['_nested']>]: RouterState<
         Config['_nested']
      >[K]
   }

interface LeafRouteState<Config extends AnyRouteWithParamsConfig> {
   readonly match: null | {
      readonly exact: boolean
      readonly params: { readonly [P in Config['_params']]: string }
   }
}

type BranchRouteState<
   Config extends AnyRouteWithParamsConfig & AnyRouteWithNestedRoutesConfig
> = LeafRouteState<Config> &
   RouterState<
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

type RouterState<Config extends RouterConfig> = {
   [PageId in keyof Config]: Config[PageId] extends AnyRouteWithParamsConfig &
      AnyRouteWithNestedRoutesConfig
      ? BranchRouteState<Config[PageId]>
      : Config[PageId] extends AnyRouteWithNestedRoutesConfig
         ? NoParamsBranchRouteState<Config[PageId]>
         : Config[PageId] extends AnyRouteWithParamsConfig
            ? LeafRouteState<Config[PageId]>
            : NoParamsLeafRouteState<Config[PageId]>
}
