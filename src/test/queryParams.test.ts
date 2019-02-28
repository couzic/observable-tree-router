import { expect } from 'chai'
import { createMemoryHistory } from 'history'

import { createBrowserRouter } from '../createBrowserRouter'
import { route } from '../route'

describe('Route with query params', () => {
   const createRouter = () =>
      createBrowserRouter(createMemoryHistory(), {
         a: route({
            path: '/a?code',
            params: ['code']
         })
      })
   let router: ReturnType<typeof createRouter>
   beforeEach(() => {
      router = createRouter()
   })
   describe('when matches route', () => {
      const code = 'toto'
      beforeEach(() => {
         router.a.push({ code })
      })
      it('matches path', () => {
         expect(router.a.isMatchingExact).to.be.true
         expect(router.a.currentState.match!.params.code).to.equal(code)
      })
   })
})
