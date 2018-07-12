import { expect } from 'chai'
import { last } from 'ramda'
import { merge } from 'rxjs'
import { mapTo } from 'rxjs/operators'
import { createMemoryRouter } from './createMemoryRouter'
import { route } from './route'
import { toArray } from './toArray'

const expectToHaveState = (router: any, state: any) => {
   expect(router.currentState).to.deep.equal(state)
   expect(toArray(router.state$)).to.deep.equal([state])
}

const expectNotToMatch = (router: any) => {
   expect(router.currentState.match).to.equal(null)
   expect((last(toArray(router.state$)) as any).match).to.equal(null)
   expect(toArray(router.match$)).to.deep.equal([null])
}

const expectToMatch = (router: any, params: any = undefined) => {
   const expectedMatch = params ? { exact: false, params } : { exact: false }
   expect(router.currentState.match).to.deep.equal(expectedMatch)
   expect(router.currentState.match.params).to.deep.equal(params)
   expect(toArray(router.match$)).to.deep.equal([expectedMatch])
}

const expectToMatchExact = (router: any, params: any = undefined) => {
   const expectedMatch = params ? { exact: true, params } : { exact: true }
   expect(router.currentState.match).to.deep.equal(expectedMatch)
   expect(router.currentState.match.params).to.deep.equal(params)
   expect(toArray(router.match$)).to.deep.equal([expectedMatch])
}

describe('createMemoryRouter', () => {
   describe('with simple route', () => {
      const createRouter = () =>
         createMemoryRouter({
            home: route(),
            otherRoute: route()
         })
      let router: ReturnType<typeof createRouter>
      let states: any
      let homeStates: any
      let homeMatches: any
      let otherRouteStates: any
      let otherRouteMatches: any

      beforeEach(() => {
         router = createRouter()
         states = toArray(router.state$)
         homeStates = toArray(router.home.state$)
         homeMatches = toArray(router.home.match$)
         otherRouteStates = toArray(router.otherRoute.state$)
         otherRouteMatches = toArray(router.otherRoute.match$)
      })

      it('initially does not match route', () => {
         expectNotToMatch(router.home)
      })

      it('has initial router state', () => {
         expectToHaveState(router, {
            home: { match: null },
            otherRoute: { match: null }
         })
      })

      it('has initial route state', () => {
         expectToHaveState(router.home, {
            match: null
         })
      })
      it('updates states and matches in correct order', () => {
         const order$ = merge(
            router.home.state$.pipe(mapTo(1)),
            router.home.match$.pipe(mapTo(2)),
            router.state$.pipe(mapTo(3)),
            router.otherRoute.state$.pipe(mapTo(4)),
            router.otherRoute.match$.pipe(mapTo(5))
         )
         expect(toArray(order$)).to.deep.equal([1, 2, 3, 4, 5])
      })

      describe('when navigated to', () => {
         beforeEach(() => {
            router.home.push()
         })
         it('matches route', () => {
            expectToMatchExact(router.home)
            expect(homeMatches).to.deep.equal([null, { exact: true }])
         })
         it('updates router state', () => {
            expect(states).to.deep.equal([
               {
                  home: { match: null },
                  otherRoute: { match: null }
               },
               {
                  home: { match: { exact: true } },
                  otherRoute: { match: null }
               }
            ])
         })
         it('updates route state', () => {
            expect(homeStates).to.deep.equal([
               { match: null },
               { match: { exact: true } }
            ])
         })

         describe('when navigated to other route', () => {
            beforeEach(() => {
               router.otherRoute.push()
            })
            it('unmatches route', () => {
               expectNotToMatch(router.home)
               expect(homeMatches).to.deep.equal([null, { exact: true }, null])
            })
            it('matches other route', () => {
               expectToMatchExact(router.otherRoute)
            })
            it('updates router state', () => {
               expect(states).to.deep.equal([
                  {
                     home: { match: null },
                     otherRoute: { match: null }
                  },
                  {
                     home: { match: { exact: true } },
                     otherRoute: { match: null }
                  },
                  {
                     home: { match: null },
                     otherRoute: { match: { exact: true } }
                  }
               ])
            })
            it('updates route state', () => {
               expect(homeStates).to.deep.equal([
                  { match: null },
                  { match: { exact: true } },
                  { match: null }
               ])
            })
            it('updates route match', () => {
               expect(homeMatches).to.deep.equal([null, { exact: true }, null])
            })
            it('updates other route state', () => {
               expect(otherRouteStates).to.deep.equal([
                  { match: null },
                  { match: { exact: true } }
               ])
            })
            it('updates other route match', () => {
               expect(otherRouteMatches).to.deep.equal([null, { exact: true }])
            })
         })
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
         expectToMatchExact(router.user, params)
      })

      it('matches new params when params change', () => {
         const matches = toArray(router.user.match$)

         const params1 = { userId: '1' }
         router.user.push(params1)
         const params2 = { userId: '2' }
         router.user.push(params2)

         expectToMatchExact(router.user, params2)
         expect(matches).to.deep.equal([
            null,
            { exact: true, params: params1 },
            { exact: true, params: params2 }
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
      let parentStates: any
      let parentMatches: any
      let childStates: any
      let childMatches: any

      beforeEach(() => {
         router = createChildRouter()
         parentStates = toArray(router.parent.state$)
         parentMatches = toArray(router.parent.match$)
         childStates = toArray(router.parent.child.state$)
         childMatches = toArray(router.parent.child.match$)
      })

      it('matches both when navigating to child route', () => {
         router.parent.child.push()
         expectToMatch(router.parent)
         expectToMatchExact(router.parent.child)

         expect(parentMatches).to.deep.equal([null, { exact: false }])
         expect(childMatches).to.deep.equal([null, { exact: true }])
      })

      it('matches parent only when navigated to', () => {
         router.parent.push()
         expectToMatchExact(router.parent)
         expectNotToMatch(router.parent.child)

         expect(parentStates).to.deep.equal([
            { match: null, child: { match: null } },
            { match: { exact: true }, child: { match: null } }
         ])
         expect(parentMatches).to.deep.equal([null, { exact: true }])
         expect(childStates).to.deep.equal([{ match: null }])
         expect(childMatches).to.deep.equal([null])
      })

      it('matches parent only when navigated to after child route', () => {
         router.parent.child.push()
         router.parent.push()
         expectToMatchExact(router.parent)
         expectNotToMatch(router.parent.child)

         expect(parentStates).to.deep.equal([
            { match: null, child: { match: null } },
            { match: { exact: false }, child: { match: { exact: true } } },
            { match: { exact: true }, child: { match: null } }
         ])
         expect(parentMatches).to.deep.equal([
            null,
            { exact: false },
            { exact: true }
         ])
         expect(childStates).to.deep.equal([
            { match: null },
            { match: { exact: true } },
            { match: null }
         ])
         expect(childMatches).to.deep.equal([null, { exact: true }, null])
      })

      it('matches neither when navigated to other route', () => {
         router.parent.child.push()
         router.otherRoute.push()
         expectNotToMatch(router.parent)
         expectNotToMatch(router.parent.child)

         expect(parentStates).to.deep.equal([
            { match: null, child: { match: null } },
            { match: { exact: false }, child: { match: { exact: true } } },
            { match: null, child: { match: null } }
         ])
         expect(parentMatches).to.deep.equal([null, { exact: false }, null])
         expect(childStates).to.deep.equal([
            { match: null },
            { match: { exact: true } },
            { match: null }
         ])
         expect(childMatches).to.deep.equal([null, { exact: true }, null])
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

      xit('matches params on both routes when navigating to child route', () => {
         const params = {
            parentParam: 'parentParam',
            childParam: 'childParam'
         }
         router.parent.child.push(params)
         expectToMatch(router.parent, params)
         expectToMatchExact(router.parent.child, params)
      })

      xit('matches params on both routes when child route changes params', () => {
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
      let grandparentStates: any
      let grandparentMatches: any
      let parentStates: any
      let parentMatches: any
      let childStates: any
      let childMatches: any
      let otherRouteStates: any
      let otherRouteMatches: any

      beforeEach(() => {
         router = createGrandparentRouter()
         grandparentStates = toArray(router.grandparent.state$)
         grandparentMatches = toArray(router.grandparent.match$)
         parentStates = toArray(router.grandparent.parent.state$)
         parentMatches = toArray(router.grandparent.parent.match$)
         childStates = toArray(router.grandparent.parent.child.state$)
         childMatches = toArray(router.grandparent.parent.child.match$)
         otherRouteStates = toArray(router.otherRoute.state$)
         otherRouteMatches = toArray(router.otherRoute.match$)
      })

      xit('matches grandparent when navigating to parent route', () => {
         router.grandparent.parent.push()
         //  expectToMatch(router.grandparent)

         //  expect(grandparentMatches).to.deep.equal([undefined, { exact: false }])
      })

      xit('matches grandparent when navigating to child route', () => {
         router.grandparent.parent.child.push()
         expectToMatch(router.grandparent)

         expect(grandparentMatches).to.deep.equal([undefined, { exact: false }])
      })

      xit('unmatches other route when navigating to child route', () => {
         router.otherRoute.push()
         router.grandparent.parent.child.push()

         expectToMatch(router.grandparent)
         expectToMatch(router.grandparent.parent)
         expectToMatch(router.grandparent.parent.child)
         expectNotToMatch(router.otherRoute)

         const expectedMatches = [undefined, { exact: false }]
         expect(grandparentMatches).to.deep.equal(expectedMatches)
         expect(parentMatches).to.deep.equal(expectedMatches)
         expect(childMatches).to.deep.equal(expectedMatches)
         expect(otherRouteMatches).to.deep.equal([
            undefined,
            { exact: false },
            undefined
         ])
      })
   })
})
