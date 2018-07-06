import { RouterConfig } from './RouterConfig'

export interface RouteConfig<
   Config extends {
      path?: string
      params?: string
      nested?: RouterConfig
   }
> {
   _hasPath: Config extends { path: string } ? true : false
   _path: Config['path']
   _hasParams: Config extends { params: string } ? true : false
   _params: Config['params']
   _hasNested: Config extends { nested: RouterConfig } ? true : false
   _nested: Config['nested']
}

export interface AnyRouteWithParamsConfig {
   _hasPath: boolean
   _path: any
   _hasParams: true
   _params: string
   _hasNested: boolean
   _nested: any
}

export interface AnyRouteWithNestedRoutesConfig {
   _hasPath: boolean
   _path: any
   _hasParams: boolean
   _params: any
   _hasNested: true
   _nested: RouterConfig
}

export interface AnyRouteWithPathConfig {
   _hasPath: true
   _path: string
   _hasParams: boolean
   _params: any
   _hasNested: boolean
   _nested: any
}

export interface AnyRouteConfig extends RouteConfig<any> {}
