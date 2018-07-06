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

   describe('simple route', () => {
      const createRouter = () =>
         createBrowserRouter(
            {
               otherRoute: route({
                  path: '/other'
               }),
               home: route({
                  path: '/'
               })
            },
            history
         )
      let router: ReturnType<typeof createRouter>

      beforeEach(() => {
         router = createRouter()
      })

      it('initially does not match', () => {
         expectNotToMatch(router.home)
      })

      it('matches when navigated to', () => {
         router.home.push()
         expectToMatch(router.home)
      })

      it('matches when history pushes path', () => {
         history.push('/')
         expectToMatch(router.home)
         expectNotToMatch(router.otherRoute)
      })

      it('matches other route when history pushes path', () => {
         history.push('/other')
         expectNotToMatch(router.home)
         expectToMatch(router.otherRoute)
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

      it('matches params when history pushes path', () => {
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

      beforeEach(() => {
         router = createRouter()
      })

      it('matches nested route when history pushes path', () => {
         history.push('/user/userId/post/postId')
         expectToMatch(router.user.post, { userId: 'userId', postId: 'postId' })
      })
   })
})
