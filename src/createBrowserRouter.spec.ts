import { expect } from 'chai'
import { createMemoryHistory, History } from 'history'

import { createBrowserRouter } from './createRouter'
import { route } from './route'
import { toArray } from './toArray'

const expectNotToMatch = (router: any) => {
   expect(router.isMatching).to.equal(false)
   expect(router.params).to.equal(undefined)
   expect(toArray(router.match$)).to.deep.equal([undefined])
}

const expectToMatch = (router: any, params = {}) => {
   expect(router.isMatching).to.equal(true)
   expect(router.params).to.deep.equal(params)
   expect(toArray(router.match$)).to.deep.equal([{ params }])
}

describe('createBrowserRouter', () => {
   let history: History

   beforeEach(() => {
      history = createMemoryHistory()
   })

   describe('simple routes', () => {
      const createRouter = (h = history) =>
         createBrowserRouter(
            {
               otherRoute: route({
                  path: '/other'
               }),
               home: route({
                  path: '/'
               })
            },
            h
         )
      let router: ReturnType<typeof createRouter>

      beforeEach(() => {
         router = createRouter()
      })

      xit('initially does not match', () => {
         expectNotToMatch(router.home)
      })

      xit('matches when navigated to', () => {
         router.home.push()
         expectToMatch(router.home)
      })

      xit('pushes path to history when navigated to', () => {
         let pushHasBeenCalled = false
         let pushedPathname: undefined | string
         const historySpy = {
            push(pathname: string) {
               pushHasBeenCalled = true
               pushedPathname = pathname
               history.push(pathname)
            },
            listen(listener: any) {
               history.listen(listener)
            }
         } as any
         const r = createRouter(historySpy)

         r.home.push()

         expect(pushHasBeenCalled).to.equal(true)
         expect(pushedPathname).to.equal('/')
      })

      xit('matches when history pushes path', () => {
         history.push('/')
         expectToMatch(router.home)
         expectNotToMatch(router.otherRoute)
      })

      xit('matches other route when navigated to', () => {
         router.otherRoute.push()
         expectNotToMatch(router.home)
         expectToMatch(router.otherRoute)
      })

      xit('matches other route when history pushes path', () => {
         history.push('/other')
         expectNotToMatch(router.home)
         expectToMatch(router.otherRoute)
      })

      xit('unmatches when navigated to other route', () => {
         history.push('/')
         router.otherRoute.push()
         expectNotToMatch(router.home)
      })

      xit('unmatches when history pushes other route path', () => {
         history.push('/')
         history.push('/other')
         expectNotToMatch(router.home)
      })
   })

   describe('simple route with params', () => {
      const createRouter = () =>
         createBrowserRouter(
            {
               user: route({
                  path: '/user/:userId',
                  params: ['userId']
               })
            },
            history
         )
      let router: ReturnType<typeof createRouter>

      beforeEach(() => {
         router = createRouter()
      })

      xit('matches params when history pushes path', () => {
         history.push('/user/userId')
         expectToMatch(router.user, { userId: 'userId' })
      })
   })

   describe('nested route with params', () => {
      const createRouter = () =>
         createBrowserRouter(
            {
               user: route({
                  path: '/user/:userId',
                  params: ['userId'],
                  nested: {
                     post: route({
                        path: '/post/:postId',
                        params: ['postId']
                     })
                  }
               })
            },
            history
         )
      let router: ReturnType<typeof createRouter>
      let userMatches: any
      let postMatches: any

      beforeEach(() => {
         router = createRouter()

         userMatches = toArray(router.user.match$)
         postMatches = toArray(router.user.post.match$)
      })

      xit('matches nested route when navigated to', () => {
         const params = { userId: 'userId', postId: 'postId' }

         router.user.post.push(params)

         expectToMatch(router.user, params)
         expectToMatch(router.user.post, params)

         expect(userMatches).to.deep.equal([undefined, { params }])
         expect(postMatches).to.deep.equal([undefined, { params }])
      })

      xit('matches nested route when history pushes path', () => {
         const params = { userId: 'userId', postId: 'postId' }
         history.push(`/user/${params.userId}/post/${params.postId}`)
         expectToMatch(router.user, params)
         expectToMatch(router.user.post, params)

         expect(userMatches).to.deep.equal([undefined, { params }])
         expect(postMatches).to.deep.equal([undefined, { params }])
      })
   })

   xit('when changing params of route with path it matches new params')
})
