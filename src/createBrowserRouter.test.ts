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
      listen: stub(),
      location: { pathname: '/' }
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
            home: { match: { exact: true } },
            otherRoute: { match: null }
         })
         expect(toArray(router.state$)).to.deep.equal([
            {
               home: { match: { exact: true } },
               otherRoute: { match: null }
            }
         ])
      })

      it('has path', () => {
         expect(router.home.path).to.equal('/')
         expect(router.otherRoute.path).to.equal('/other')
      })

      it('initially does match home', () => {
         expectToMatchExact(router.home)
      })

      describe('when navigated to', () => {
         beforeEach(() => {
            router.home.push()
         })
         it('matches', () => {
            expectToMatchExact(router.home)
            expectNotToMatch(router.otherRoute)
         })

         it('updates root state', () => {
            expect(router.currentState.home.match).to.deep.equal({
               exact: true
            })
            expect(router.currentState.otherRoute.match).to.equal(null)
         })

         it('pushes url to history', () => {
            history = createHistorySpy()
            router = createRouter(history)

            router.home.push()

            expect(history.push).to.have.been.calledWith('/')
         })
         describe('then navigated to other route', () => {
            it('unmatches first route', () => {
               router.otherRoute.push()
               expectNotToMatch(router.home)
               expectToMatchExact(router.otherRoute)
            })
         })
      })

      it('matches when history pushes path', () => {
         history.push(router.home.path)
         expectToMatchExact(router.home)
         expectNotToMatch(router.otherRoute)
      })

      it('matches other route when navigated to', () => {
         router.otherRoute.push()
         expectNotToMatch(router.home)
         expectToMatchExact(router.otherRoute)
      })

      it('unmatches other router when navigated to home', () => {
         router.otherRoute.push()
         router.home.push()
         expectNotToMatch(router.otherRoute)
         expectToMatchExact(router.home)
      })
   })

   describe('given route with default path', () => {
      const createRouter = (h = history) =>
         createBrowserRouter(h, {
            routeWithDefaultPath: route()
         })
      let router: ReturnType<typeof createRouter>

      beforeEach(() => {
         router = createRouter()
      })

      it('has correct path', () => {
         expect(router.routeWithDefaultPath.path).to.equal(
            '/routeWithDefaultPath'
         )
      })
   })

   describe('given nested route', () => {
      const createRouter = (h = history) =>
         createBrowserRouter(h, {
            parent: route({
               path: '/parent',
               nested: {
                  child: route({
                     path: '/child'
                  })
               }
            })
         })
      let router: ReturnType<typeof createRouter>

      beforeEach(() => {
         router = createRouter()
      })

      it('has initial root state', () => {
         expect(router.currentState).to.deep.equal({
            parent: {
               match: null,
               child: {
                  match: null
               }
            }
         })
      })

      describe('when parent is navigated to', () => {
         beforeEach(() => {
            router.parent.push()
         })

         it('matches parent', () => {
            expectToMatchExact(router.parent)
            expectNotToMatch(router.parent.child)
         })

         it('still has child in state', () => {
            expect(router.parent.currentState.child).to.deep.equal({
               match: null
            })
         })
      })

      describe('when child is navigated to', () => {
         beforeEach(() => {
            router.parent.child.push()
         })
         it('updates root state', () => {
            expect(router.currentState).to.deep.equal({
               parent: {
                  match: { exact: false },
                  child: { match: { exact: true } }
               }
            })
         })
         it('updates parent state', () => {
            expect(router.parent.currentState).to.deep.equal({
               match: { exact: false },
               child: { match: { exact: true } }
            })
         })
         it('matches both', () => {
            expectToMatch(router.parent)
            expectToMatchExact(router.parent.child)
         })
      })
   })

   describe('given route with params', () => {
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

      it('matches params when history pushes path', () => {
         history.push('/user/userId')
         expectToMatchExact(router.user, { userId: 'userId' })
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

      beforeEach(() => {
         router = createRouter()
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

      it('matches parent route params when navigated to nested route', () => {
         const userParams = { userId: 'userId' }
         const postParams = { ...userParams, postId: 'postId' }

         router.user.post.push(postParams)

         expectToMatch(router.user, userParams)
      })

      it('matches nested route when history pushes path', () => {
         const userParams = { userId: 'userId' }
         const postParams = { ...userParams, postId: 'postId' }
         history.push(`/user/${userParams.userId}/post/${postParams.postId}`)
         expectToMatch(router.user, userParams)
         expectToMatchExact(router.user.post, postParams)
      })
   })

   xit('when changing params of route with path it matches new params')
})
