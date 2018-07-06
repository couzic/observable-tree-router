import { expect } from 'chai'

import { createMemoryRouter } from './createRouter'
import { route } from './route'
import { toArray } from './toArray'

const emptyMatch = { params: {} }

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

describe('createMemoryRouter', () => {
   describe('simple route', () => {
      const createRouterNoPath = () =>
         createMemoryRouter({
            home: route(),
            otherRoute: route()
         })
      let router: ReturnType<typeof createRouterNoPath>

      beforeEach(() => {
         router = createRouterNoPath()
      })

      it('initially does not match', () => {
         expectNotToMatch(router.home)
      })

      it('matches when navigated to', () => {
         router.home.push()
         expectToMatch(router.home)
      })

      it('does not match when route left', () => {
         const matches = toArray(router.home.match$)
         router.home.push()
         router.otherRoute.push()
         expectNotToMatch(router.home)
         expect(matches).to.deep.equal([undefined, emptyMatch, undefined])
      })
   })

   describe('single route with params', () => {
      const createParamsRouter = () =>
         createMemoryRouter({
            user: route({ params: ['userId'] })
         })
      let router: ReturnType<typeof createParamsRouter>

      beforeEach(() => {
         router = createParamsRouter()
      })

      it('matches params when navigated to', () => {
         const params = { userId: 'userId' }
         router.user.push(params)
         expectToMatch(router.user, params)
      })

      it('matches new params when params change', () => {
         const matches = toArray(router.user.match$)

         const params1 = { userId: '1' }
         router.user.push(params1)
         const params2 = { userId: '2' }
         router.user.push(params2)

         expectToMatch(router.user, params2)
         expect(matches).to.deep.equal([
            undefined,
            { params: params1 },
            { params: params2 }
         ])
      })
   })

   describe('parent and child routes', () => {
      const createChildRouter = () =>
         createMemoryRouter({
            parent: route({
               nested: {
                  child: route()
               }
            }),
            otherRoute: route()
         })
      let router: ReturnType<typeof createChildRouter>
      let parentMatches: any
      let childMatches: any

      beforeEach(() => {
         router = createChildRouter()
         parentMatches = toArray(router.parent.match$)
         childMatches = toArray(router.parent.child.match$)
      })

      it('matches both when navigating to child route', () => {
         router.parent.child.push()
         expectToMatch(router.parent)
         expectToMatch(router.parent.child)

         expect(parentMatches).to.deep.equal([undefined, emptyMatch])
         expect(childMatches).to.deep.equal([undefined, emptyMatch])
      })

      it('matches parent only when navigated to', () => {
         router.parent.push()
         expectToMatch(router.parent)
         expectNotToMatch(router.parent.child)

         expect(parentMatches).to.deep.equal([undefined, emptyMatch])
         expect(childMatches).to.deep.equal([undefined])
      })

      it('matches parent only when navigated to after child route', () => {
         router.parent.child.push()
         router.parent.push()
         expectToMatch(router.parent)
         expectNotToMatch(router.parent.child)

         expect(parentMatches).to.deep.equal([undefined, emptyMatch])
         expect(childMatches).to.deep.equal([undefined, emptyMatch, undefined])
      })

      it('matches neither when leave to other route', () => {
         router.parent.child.push()
         router.otherRoute.push()
         expectNotToMatch(router.parent)
         expectNotToMatch(router.parent.child)

         expect(parentMatches).to.deep.equal([undefined, emptyMatch, undefined])
         expect(childMatches).to.deep.equal([undefined, emptyMatch, undefined])
      })
   })

   describe('parent and child routes with params', () => {
      const createChildRouter = () =>
         createMemoryRouter({
            parent: route({
               params: ['parentParam'],
               nested: {
                  child: route({ params: ['childParam'] })
               }
            }),
            otherRoute: route()
         })
      let router: ReturnType<typeof createChildRouter>
      let parentMatches: any
      let childMatches: any

      beforeEach(() => {
         router = createChildRouter()
         parentMatches = toArray(router.parent.match$)
         childMatches = toArray(router.parent.child.match$)
      })

      it('matches params on both routes when navigating to child route', () => {
         const params = {
            parentParam: 'parentParam',
            childParam: 'childParam'
         }
         router.parent.child.push(params)
         expectToMatch(router.parent, params)
         expectToMatch(router.parent.child, params)
      })

      it('matches params on both routes when child route changes params', () => {
         const params1 = {
            parentParam: 'parentParam1',
            childParam: 'childParam1'
         }
         const params2 = {
            parentParam: 'parentParam2',
            childParam: 'childParam2'
         }
         router.parent.child.push(params1)
         router.parent.child.push(params2)
         expectToMatch(router.parent, params2)
         expectToMatch(router.parent.child, params2)

         const expectedMatches = [
            undefined,
            { params: params1 },
            { params: params2 }
         ]
         expect(parentMatches).to.deep.equal(expectedMatches)
         expect(childMatches).to.deep.equal(expectedMatches)
      })
   })

   describe('grandparent route', () => {
      const createGrandparentRouter = () =>
         createMemoryRouter({
            grandparent: route({
               nested: {
                  parent: route({
                     nested: {
                        child: route()
                     }
                  })
               }
            }),
            otherRoute: route()
         })
      let router: ReturnType<typeof createGrandparentRouter>
      let grandparentMatches: any
      let parentMatches: any
      let childMatches: any
      let otherRouteMatches: any

      beforeEach(() => {
         router = createGrandparentRouter()
         grandparentMatches = toArray(router.grandparent.match$)
         parentMatches = toArray(router.grandparent.parent.match$)
         childMatches = toArray(router.grandparent.parent.child.match$)
         otherRouteMatches = toArray(router.otherRoute.match$)
      })

      it('matches grandparent when navigating to child route', () => {
         router.grandparent.parent.child.push()
         expectToMatch(router.grandparent)

         expect(grandparentMatches).to.deep.equal([undefined, emptyMatch])
      })

      it('unmatches other route when navigating to child route', () => {
         router.otherRoute.push()
         router.grandparent.parent.child.push()

         expectToMatch(router.grandparent)
         expectToMatch(router.grandparent.parent)
         expectToMatch(router.grandparent.parent.child)
         expectNotToMatch(router.otherRoute)

         const expectedMatches = [undefined, emptyMatch]
         expect(grandparentMatches).to.deep.equal(expectedMatches)
         expect(parentMatches).to.deep.equal(expectedMatches)
         expect(childMatches).to.deep.equal(expectedMatches)
         expect(otherRouteMatches).to.deep.equal([
            undefined,
            emptyMatch,
            undefined
         ])
      })
   })
})
