import { expect } from 'chai'
import { createMemoryHistory } from 'history'
import { merge } from 'rxjs'
import { mapTo, skip } from 'rxjs/operators'

import { createBrowserRouter } from './createBrowserRouter'
import { createMemoryRouter } from './createMemoryRouter'
import { route } from './route'
import {
   expectNotToMatch,
   expectToHaveState,
   expectToMatch,
   expectToMatchExact
} from './testUtils'
import { toArray } from './toArray'

testCreateRouter(createMemoryRouter as any)

const createMemoryHistoryBrowserRouter: typeof createMemoryRouter = config =>
   createBrowserRouter(createMemoryHistory(), config)
testCreateRouter(createMemoryHistoryBrowserRouter, 'createBrowserRouter')

function testCreateRouter(sut: typeof createMemoryRouter, name?: string) {
   describe(name || sut.name, () => {
      let r
      beforeEach(() => {
         r = sut({
            home: route(),
            epj: route({
               params: ['id'],
               nested: { profile: route() }
            })
         })
         r.epj.profile.push({
            id: '123'
         })
      })

      describe('given route and other route', () => {
         const createRouter = () =>
            sut({
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
            const orders = toArray(
               merge(
                  router.home.state$.pipe(mapTo(1)),
                  router.home.match$.pipe(mapTo(2)),
                  router.state$.pipe(mapTo(3)),
                  router.otherRoute.state$.pipe(mapTo(4)),
                  router.otherRoute.match$.pipe(mapTo(5))
               ).pipe(skip(5))
            )
            router.home.push()
            expect(orders).to.deep.equal([3, 1, 2])
            router.otherRoute.push()
            expect(orders).to.deep.equal([3, 1, 2, 1, 2, 3, 4, 5])
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

            describe('when navigated to again', () => {
               beforeEach(() => {
                  router.home.push()
               })
               it('ignores call', () => {
                  expect(homeMatches).to.deep.equal([null, { exact: true }])
                  expect(homeStates).to.deep.equal([
                     { match: null },
                     { match: { exact: true } }
                  ])
               })
            })

            describe('when navigated to other route', () => {
               beforeEach(() => {
                  router.otherRoute.push()
               })
               it('unmatches route', () => {
                  expectNotToMatch(router.home)
                  expect(homeMatches).to.deep.equal([
                     null,
                     { exact: true },
                     null
                  ])
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
                  expect(homeMatches).to.deep.equal([
                     null,
                     { exact: true },
                     null
                  ])
               })
               it('updates other route state', () => {
                  expect(otherRouteStates).to.deep.equal([
                     { match: null },
                     { match: { exact: true } }
                  ])
               })
               it('updates other route match', () => {
                  expect(otherRouteMatches).to.deep.equal([
                     null,
                     { exact: true }
                  ])
               })
            })
         })
      })

      describe('given single route with params', () => {
         const createParamsRouter = () =>
            sut({
               user: route({
                  path: '/user/:userId',
                  params: ['userId']
               })
            })
         let router: ReturnType<typeof createParamsRouter>
         let states: any
         let matches: any

         beforeEach(() => {
            router = createParamsRouter()
            states = toArray(router.user.state$)
            matches = toArray(router.user.match$)
         })

         describe('when navigated to', () => {
            const pushedParams = {
               userId: 'userId'
            }
            beforeEach(() => {
               router.user.push(pushedParams)
            })

            it('matches params when navigated to', () => {
               expectToMatchExact(router.user, pushedParams)
            })

            describe('when navigated to again', () => {
               beforeEach(() => {
                  router.user.push(pushedParams)
               })
               it('ignores call', () => {
                  expect(states).to.have.length(2)
                  expect(matches).to.have.length(2)
               })
            })
         })

         it('matches new params when params change', () => {
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

      describe('given parent and child routes', () => {
         const createChildRouter = () =>
            sut({
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

         describe('when navigating to child then parent', () => {
            beforeEach(() => {
               router.parent.child.push()
               router.parent.push()
            })
            it('matches parent', () => {
               expectToMatchExact(router.parent)
               expect(parentStates).to.deep.equal([
                  { match: null, child: { match: null } },
                  {
                     match: { exact: false },
                     child: { match: { exact: true } }
                  },
                  { match: { exact: true }, child: { match: null } }
               ])
               expect(parentMatches).to.deep.equal([
                  null,
                  { exact: false },
                  { exact: true }
               ])
            })
            it('does not match child', () => {
               expectNotToMatch(router.parent.child)
               expect(childStates).to.deep.equal([
                  { match: null },
                  { match: { exact: true } },
                  { match: null }
               ])
               expect(childMatches).to.deep.equal([null, { exact: true }, null])
            })
            it('keeps other route in root state', () => {
               expect(router.currentState.otherRoute).to.exist
            })
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

         it('matches child when navigated to after parent', () => {
            router.parent.push()
            router.parent.child.push()

            expect(parentStates).to.deep.equal([
               { match: null, child: { match: null } },
               { match: { exact: true }, child: { match: null } },
               { match: { exact: false }, child: { match: { exact: true } } }
            ])
            expect(parentMatches).to.deep.equal([
               null,
               { exact: true },
               { exact: false }
            ])

            expect(childStates).to.deep.equal([
               { match: null },
               { match: { exact: true } }
            ])
            expect(childMatches).to.deep.equal([null, { exact: true }])
         })

         it('matches parent when navigated to after child', () => {
            router.parent.child.push()
            router.parent.push()

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
         })
      })

      describe('given parent with two child routes', () => {
         const createChildRouter = () =>
            sut({
               parent: route({
                  nested: {
                     firstChild: route(),
                     secondChild: route()
                  }
               })
            })
         let router: ReturnType<typeof createChildRouter>
         let parentStates: any
         let parentMatches: any
         let firstChildStates: any
         let firstChildMatches: any

         beforeEach(() => {
            router = createChildRouter()
            parentStates = toArray(router.parent.state$)
            parentMatches = toArray(router.parent.match$)
            firstChildStates = toArray(router.parent.firstChild.state$)
            firstChildMatches = toArray(router.parent.firstChild.match$)
         })

         describe('when navigating from first child to second child', () => {
            beforeEach(() => {
               router.parent.firstChild.push()
               router.parent.secondChild.push()
            })
            it('parent route does not emit new match', () => {
               expect(parentMatches).to.have.length(2)
               expect(parentMatches).to.deep.equal([null, { exact: false }])
            })
            it('updates parent router state', () => {
               expect(parentStates).to.have.length(3)
               expect(
                  parentStates.map((_: any) => _.firstChild.match)
               ).to.deep.equal([null, { exact: true }, null])
               expect(
                  parentStates.map((_: any) => _.secondChild.match)
               ).to.deep.equal([null, null, { exact: true }])
            })
            it('parent route state keeps same match reference', () => {
               expect(parentStates[1].match).to.equal(parentStates[2].match)
            })
            it('unmatches first child', () => {
               expect(firstChildStates).to.have.length(3)
               expect(firstChildMatches).to.deep.equal([
                  null,
                  { exact: true },
                  null
               ])
            })
         })
      })

      describe('given parent and child routes with params', () => {
         const createChildRouter = () =>
            sut({
               parent: route({
                  path: '/parent/:parentParam',
                  params: ['parentParam'],
                  nested: {
                     child: route({
                        path: '/child/:childParam',
                        params: ['childParam']
                     })
                  }
               }),
               otherRoute: route()
            })
         let router: ReturnType<typeof createChildRouter>
         let parentStates: any
         let parentMatches: any
         let childMatches: any

         beforeEach(() => {
            router = createChildRouter()
            parentStates = toArray(router.parent.state$)
            parentMatches = toArray(router.parent.match$)
            childMatches = toArray(router.parent.child.match$)
         })

         it('has correct state when parent pushed twice with different params', () => {
            router.parent.push({ parentParam: 'parentParam1' })
            router.parent.push({ parentParam: 'parentParam2' })
            expect(router.parent.currentState).to.deep.equal({
               match: { exact: true, params: { parentParam: 'parentParam2' } },
               child: { match: null }
            })
         })

         it('matches params on both routes when navigating to child route', () => {
            const parentParams = {
               parentParam: 'parentParam'
            }
            const childParams = {
               ...parentParams,
               childParam: 'childParam'
            }
            router.parent.child.push(childParams)
            expectToMatch(router.parent, parentParams)
            expectToMatchExact(router.parent.child, childParams)
         })

         describe('when child route changes both parent and child params', () => {
            const parentParams1 = {
               parentParam: 'parentParam1'
            }
            const childParams1 = {
               ...parentParams1,
               childParam: 'childParam1'
            }
            const parentParams2 = {
               parentParam: 'parentParam2'
            }
            const childParams2 = {
               ...parentParams2,
               childParam: 'childParam2'
            }
            beforeEach(() => {
               router.parent.child.push(childParams1)
               router.parent.child.push(childParams2)
            })
            it('matches params on child route', () => {
               expectToMatchExact(router.parent.child, childParams2)
               expect(childMatches).to.deep.equal([
                  null,
                  { exact: true, params: childParams1 },
                  { exact: true, params: childParams2 }
               ])
            })
            it('matches params on parent route', () => {
               expectToMatch(router.parent, parentParams2)
               expect(parentMatches).to.deep.equal([
                  null,
                  { exact: false, params: parentParams1 },
                  { exact: false, params: parentParams2 }
               ])
            })
            it('updates root state', () => {
               expect(router.currentState.parent.child.match).to.deep.equal({
                  exact: true,
                  params: childParams2
               })
            })
         })

         describe('when child route changes child params only', () => {
            const parentParams = {
               parentParam: 'parentParam'
            }
            const childParams1 = {
               ...parentParams,
               childParam: 'childParam1'
            }
            const childParams2 = {
               ...parentParams,
               childParam: 'childParam2'
            }
            beforeEach(() => {
               router.parent.child.push(childParams1)
               router.parent.child.push(childParams2)
            })
            it('updates router state', () => {
               expect(router.currentState.parent.child.match).to.deep.equal({
                  exact: true,
                  params: childParams2
               })
            })
            it('parent router does not emit new match', () => {
               expect(parentMatches).to.have.length(2)
            })
            it('parent router state keeps same match reference', () => {
               expect(parentStates[1].match).to.equal(parentStates[2].match)
            })
         })
      })

      describe('grandparent route', () => {
         const createGrandparentRouter = () =>
            sut({
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
         let otherRouteMatches: any

         beforeEach(() => {
            router = createGrandparentRouter()
            grandparentStates = toArray(router.grandparent.state$)
            grandparentMatches = toArray(router.grandparent.match$)
            parentStates = toArray(router.grandparent.parent.state$)
            parentMatches = toArray(router.grandparent.parent.match$)
            childStates = toArray(router.grandparent.parent.child.state$)
            childMatches = toArray(router.grandparent.parent.child.match$)
            otherRouteMatches = toArray(router.otherRoute.match$)
         })

         it('matches grandparent when navigating to parent route', () => {
            router.grandparent.parent.push()
            expectToMatch(router.grandparent)

            expect(grandparentStates).to.deep.equal([
               { match: null, parent: { match: null, child: { match: null } } },
               {
                  match: { exact: false },
                  parent: { match: { exact: true }, child: { match: null } }
               }
            ])
            expect(parentStates).to.deep.equal([
               { match: null, child: { match: null } },
               { match: { exact: true }, child: { match: null } }
            ])
            expect(childStates).to.deep.equal([{ match: null }])
         })

         it('matches grandparent when navigating to child route', () => {
            router.grandparent.parent.child.push()
            expectToMatch(router.grandparent)

            expect(grandparentMatches).to.deep.equal([null, { exact: false }])
         })

         it('unmatches other route when navigating to child route', () => {
            router.otherRoute.push()
            router.grandparent.parent.child.push()

            expectToMatch(router.grandparent)
            expectToMatch(router.grandparent.parent)
            expectToMatchExact(router.grandparent.parent.child)
            expectNotToMatch(router.otherRoute)

            const expectedMatches = [null, { exact: false }]
            expect(grandparentMatches).to.deep.equal(expectedMatches)
            expect(parentMatches).to.deep.equal(expectedMatches)
            expect(childMatches).to.deep.equal([null, { exact: true }])
            expect(otherRouteMatches).to.deep.equal([
               null,
               { exact: true },
               null
            ])
         })

         describe('when navigating to child route after parent', () => {
            beforeEach(() => {
               router.grandparent.parent.push()
               router.grandparent.parent.child.push()
            })
            it('updates grandparent state', () => {
               expect(router.grandparent.currentState.parent).to.deep.equal({
                  match: { exact: false },
                  child: { match: { exact: true } }
               })
            })
            it('updates route state', () => {
               expect(router.currentState.grandparent.parent).to.deep.equal({
                  match: { exact: false },
                  child: { match: { exact: true } }
               })
            })
         })
      })

      describe('grandparent route with params', () => {
         const createGrandparentRouter = () =>
            sut({
               grandparent: route({
                  path: '/grandparent/:param',
                  params: ['param'],
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

         beforeEach(() => {
            router = createGrandparentRouter()
         })

         it('updates grandparent state when navigating to child route after parent', () => {
            router.grandparent.parent.push({ param: 'param' })
            router.grandparent.parent.child.push({ param: 'param' })
            expect(router.grandparent.currentState.parent).to.deep.equal({
               match: { exact: false, params: { param: 'param' } },
               child: { match: { exact: true, params: { param: 'param' } } }
            })
         })

         it('grandparent emits match when navigating from child to parent while changing param values', () => {
            router.grandparent.parent.child.push({ param: 'param1' })
            router.grandparent.parent.push({ param: 'param2' })
            router.grandparent.match$.subscribe(match =>
               expect(match).to.deep.equal({
                  exact: false,
                  params: { param: 'param2' }
               })
            )
         })
      })

      describe('great grandparent route', () => {
         const createGrandparentRouter = () =>
            sut({
               greatGreatGrandparent: route({
                  nested: {
                     greatGrandparent: route({
                        nested: {
                           grandparent: route({
                              nested: {
                                 parent: route({
                                    nested: {
                                       child: route()
                                    }
                                 })
                              }
                           })
                        }
                     })
                  }
               })
            })
         let router: ReturnType<typeof createGrandparentRouter>

         beforeEach(() => {
            router = createGrandparentRouter()
         })

         it('updates great great grandparent state when navigating from parent to child', () => {
            router.greatGreatGrandparent.greatGrandparent.grandparent.parent.push()
            router.greatGreatGrandparent.greatGrandparent.grandparent.parent.child.push()
            expect(
               router.greatGreatGrandparent.currentState.greatGrandparent
                  .grandparent.parent
            ).to.deep.equal({
               match: { exact: false },
               child: { match: { exact: true } }
            })
         })
      })

      describe('grandparent route with two grandchildren', () => {
         const createGrandparentRouter = () =>
            sut({
               grandparent: route({
                  nested: {
                     parent: route({
                        nested: {
                           child: route(),
                           otherChild: route()
                        }
                     })
                  }
               })
            })
         let router: ReturnType<typeof createGrandparentRouter>

         beforeEach(() => {
            router = createGrandparentRouter()
         })

         describe('when navigating to child then to other child', () => {
            beforeEach(() => {
               router.grandparent.parent.child.push()
               router.grandparent.parent.otherChild.push()
            })
            it('updates grandparent state', () => {
               expect(router.grandparent.currentState.parent).to.deep.equal({
                  match: { exact: false },
                  child: { match: null },
                  otherChild: { match: { exact: true } }
               })
            })
            it('updates root state', () => {
               expect(router.currentState.grandparent.parent).to.deep.equal({
                  match: { exact: false },
                  child: { match: null },
                  otherChild: { match: { exact: true } }
               })
            })
         })
      })

      describe('grandparent route with params and two grandchildren', () => {
         const createGrandparentRouter = () =>
            sut({
               grandparent: route({
                  path: '/grandparent/:param',
                  params: ['param'],
                  nested: {
                     parent: route({
                        nested: {
                           child: route(),
                           otherChild: route()
                        }
                     })
                  }
               })
            })
         let router: ReturnType<typeof createGrandparentRouter>
         let parentMatches: any

         beforeEach(() => {
            router = createGrandparentRouter()
            parentMatches = toArray(router.grandparent.parent.match$)
         })

         describe('when navigating to child then to other child with same params', () => {
            const params = { param: 'param' }
            beforeEach(() => {
               router.grandparent.parent.child.push(params)
               router.grandparent.parent.otherChild.push(params)
            })
            it('updates parent state', () => {
               expect(router.grandparent.parent.currentState).to.deep.equal({
                  match: { exact: false, params },
                  child: { match: null },
                  otherChild: { match: { exact: true, params } }
               })
            })
            it('updates grandparent state', () => {
               expect(router.grandparent.currentState.parent).to.deep.equal({
                  match: { exact: false, params },
                  child: { match: null },
                  otherChild: { match: { exact: true, params } }
               })
            })
         })

         describe('when navigating to child then to other child with different params', () => {
            const params = { param: 'param' }
            const otherParams = { param: 'otherParam' }
            beforeEach(() => {
               router.grandparent.parent.child.push(params)
               router.grandparent.parent.otherChild.push(otherParams)
            })
            it('updates parent state', () => {
               expect(router.grandparent.parent.currentState).to.deep.equal({
                  match: { exact: false, params: otherParams },
                  child: { match: null },
                  otherChild: { match: { exact: true, params: otherParams } }
               })
            })
            it('parent router emits new match', () => {
               expect(parentMatches).to.deep.equal([
                  null,
                  { exact: false, params },
                  { exact: false, params: otherParams }
               ])
            })
            it('updates grandparent state', () => {
               expect(router.grandparent.currentState.parent).to.deep.equal({
                  match: { exact: false, params: otherParams },
                  child: { match: null },
                  otherChild: { match: { exact: true, params: otherParams } }
               })
            })
         })
      })
   })
}
