import * as chai from 'chai'
import { createMemoryHistory, History } from 'history'
import { spy, stub } from 'sinon'
import * as sinonChai from 'sinon-chai'

import { createBrowserRouter } from './createBrowserRouter'
import { route } from './route'
import {
   expectNotToMatch,
   expectToMatch,
   expectToMatchExact
} from './testUtils'
import { toArray } from './toArray'

chai.use(sinonChai)
const { expect } = chai

const createHistorySpy = (): History =>
   ({
      push: spy(),
      listen: stub()
   } as any)

describe('createBrowserRouter', () => {
   let history: History

   beforeEach(() => {
      history = createMemoryHistory()
   })

   describe('given simple route', () => {
      const createRouter = (h = history) =>
         createBrowserRouter(h, {
            otherRoute: route({
               path: '/other'
            }),
            home: route({
               path: '/'
            })
         })
      let router: ReturnType<typeof createRouter>

      beforeEach(() => {
         router = createRouter()
      })

      it('has root state', () => {
         expect(router.currentState).to.deep.equal({
            home: { match: null },
            otherRoute: { match: null }
         })
         expect(toArray(router.state$)).to.deep.equal([
            {
               home: { match: null },
               otherRoute: { match: null }
            }
         ])
      })

      it('has path', () => {
         expect(router.home.path).to.equal('/')
         expect(router.otherRoute.path).to.equal('/other')
      })

      it('initially does not match', () => {
         expectNotToMatch(router.home)
      })

      it('pushes url to history when navigated to', () => {
         history = createHistorySpy()
         router = createRouter(history)

         router.home.push()

         expect(history.push).to.have.been.calledWith('/')
      })

      it('matches when history pushes path', () => {
         history.push(router.home.path)
         expectToMatchExact(router.home)
         expectNotToMatch(router.otherRoute)
      })

      xit('matches when navigated to', () => {
         router.home.push()
         expectToMatchExact(router.home)
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
      const createRouter = (h = history) =>
         createBrowserRouter(h, {
            user: route({
               path: '/user/:userId',
               params: ['userId']
            })
         })
      let router: ReturnType<typeof createRouter>

      beforeEach(() => {
         router = createRouter()
      })

      it('pushes url to history when navigated to', () => {
         history = createHistorySpy()
         router = createRouter(history)

         router.user.push({ userId: 'id' })

         expect(history.push).to.have.been.calledWith('/user/id')
      })

      xit('matches params when history pushes path', () => {
         history.push('/user/userId')
         expectToMatch(router.user, { userId: 'userId' })
      })
   })

   describe('nested route with params', () => {
      const createRouter = (h = history) =>
         createBrowserRouter(history, {
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
         })
      let router: ReturnType<typeof createRouter>
      //   let userMatches: any
      //   let postMatches: any

      beforeEach(() => {
         router = createRouter()

         //  userMatches = toArray(router.user.match$)
         //  postMatches = toArray(router.user.post.match$)
      })

      it('has path', () => {
         expect(router.user.post.path).to.equal('/user/:userId/post/:postId')
      })

      it('pushes url to history when navigated to', () => {
         history = createHistorySpy()
         router = createRouter(history)

         router.user.post.push({ userId: '1', postId: '2' })

         expect(history.push).to.have.been.calledWith('/user/1/post/2')
      })

      xit('matches nested route when navigated to', () => {
         const params = { userId: 'userId', postId: 'postId' }

         router.user.post.push(params)

         expectToMatch(router.user, params)
         expectToMatch(router.user.post, params)

         //  expect(userMatches).to.deep.equal([undefined, { params }])
         //  expect(postMatches).to.deep.equal([undefined, { params }])
      })

      xit('matches nested route when history pushes path', () => {
         const params = { userId: 'userId', postId: 'postId' }
         history.push(`/user/${params.userId}/post/${params.postId}`)
         expectToMatch(router.user, params)
         expectToMatch(router.user.post, params)

         //  expect(userMatches).to.deep.equal([undefined, { params }])
         //  expect(postMatches).to.deep.equal([undefined, { params }])
      })
   })

   xit('when changing params of route with path it matches new params')
})
