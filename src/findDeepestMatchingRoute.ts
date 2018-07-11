import { Router } from './TreeRouter'

export function findDeepestMatchingRoute(
   routers: Array<Router<any>>,
   pathname: string
): null | { router: Router<any>; params: Record<string, string> } {
   let match: ReturnType<typeof findDeepestMatchingRoute> = null
   for (
      let i = 0, routerCount = routers.length;
      match === null && i < routerCount;
      i++
   ) {
      const router = routers[i] as any
      const routerMatch = router._matchesPath(pathname)
      if (routerMatch !== null) {
         if (router.nested !== undefined) {
            match = findDeepestMatchingRoute(router.nested, pathname)
         }
         if (match === null) {
            match = routerMatch
         }
      }
   }
   return match
}
