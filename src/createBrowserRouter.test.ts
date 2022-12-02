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

            expect(history.push).to.have.been.calledWith({
               pathname: '/',
               search: ''
            })
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

         expect(history.push).to.have.been.calledWith({
            pathname: '/user/id',
            search: ''
         })
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

         expect(history.push).to.have.been.calledWith({
            pathname: '/user/1/post/2',
            search: ''
         })
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

   describe('given parent with two children, each with a grandchild', () => {
      const createRouter = () =>
         createBrowserRouter(history, {
            parent: route({
               nested: {
                  firstChild: route({
                     nested: {
                        firstGrandChild: route({
                           params: ['param']
                        })
                     }
                  }),
                  secondChild: route({
                     nested: {
                        secondGrandChild: route({
                           params: ['param']
                        })
                     }
                  })
               }
            })
         })
      type Router = ReturnType<typeof createRouter>
      let router: Router
      beforeEach(() => {
         router = createRouter()
      })
      describe('when navigated to second grandchild then first grandchild', () => {
         beforeEach(() => {
            router.parent.secondChild.secondGrandChild.push({ param: 'param' })
            router.parent.firstChild.firstGrandChild.push({ param: 'param' })
         })
         it('unmatches second grandchild', () => {
            expectToMatchExact(router.parent.firstChild.firstGrandChild)
            expectToMatch(router.parent.firstChild)
            expectNotToMatch(router.parent.secondChild.secondGrandChild)
            expectNotToMatch(router.parent.secondChild)
         })
      })
   })

   describe('given two overlapping sibling base routes', () => {
      const createRouter = () =>
         createBrowserRouter(history, {
            home: route({
               path: '/'
            }),
            second: route({
               path: '/second'
            })
         })
      type Router = ReturnType<typeof createRouter>
      let router: Router
      beforeEach(() => {
         router = createRouter()
      })
      it('initially matches home', () => {
         expect(router.home.isMatchingExact).to.be.true
      })
      describe('when navigating to sibling', () => {
         beforeEach(() => {
            router.second.push()
         })
         it('does not match home', () => {
            expect(router.home.isMatching).to.be.false
         })
      })
   })

   describe('given three routes A B and C', () => {
      const createRouter = () =>
         createBrowserRouter(history, {
            A: route({
               path: '/A'
            }),
            B: route({
               path: '/B'
            }),
            C: route({
               path: '/C'
            })
         })
      type Router = ReturnType<typeof createRouter>
      let router: Router
      beforeEach(() => {
         router = createRouter()
      })
      describe('when navigating to A, then B, then replacing with C, then going back', () => {
         beforeEach(() => {
            router.A.push()
            router.B.push()
            router.C.replace()
            history.back()
         })
         it('goes to A', () => {
            expect(router.A.isMatchingExact).to.be.true
         })
      })
   })

   describe('query params', () => {
      const createRouter = () =>
         createBrowserRouter(history, {
            home: route({
               path: '/'
            }),
            plain: route({ path: '/plain' }),
            rich: route({
               path: '/rich?multi',
               params: ['multi']
            })
         })
      type Router = ReturnType<typeof createRouter>
      let router: Router
      beforeEach(() => {
         router = createRouter()
      })
      it('initially matches home', () => {
         expect(router.home.isMatchingExact).to.be.true
      })
      describe('when navigating to sibling', () => {
         beforeEach(() => {
            router.rich.push({ multi: 'true' })
         })
         it('matches rich', () => {
            expect(router.rich.isMatchingExact).to.be.true
            console.log(router.currentState)
            console.log(history.location)
         })
         describe('when navigating to plain', () => {
            beforeEach(() => {
               router.plain.push()
            })
            it('matches plain', () => {
               expect(router.plain.isMatchingExact).to.be.true
               console.log(router.currentState)
               console.log(history.location)
            })
         })
      })
   })

   xit('when changing params of route with path it matches new params')
})
