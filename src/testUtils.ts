import { expect } from 'chai'
import { last } from 'ramda'

import { toArray } from './toArray'

export const expectToHaveState = (router: any, state: any) => {
   expect(router.currentState).to.deep.equal(state)
   expect(toArray(router.state$)).to.deep.equal([state])
}

export const expectNotToMatch = (router: any) => {
   expect(router.isMatching).to.be.false
   expect(router.currentState.match).to.equal(null)
   expect((last(toArray(router.state$)) as any).match).to.equal(null)
   expect(toArray(router.match$)).to.deep.equal([null])
}

export const expectToMatch = (router: any, params: any = undefined) => {
   expect(router.isMatchingChild).to.be.true
   const expectedMatch = params ? { exact: false, params } : { exact: false }
   expect(router.currentState.match).to.deep.equal(expectedMatch)
   expect(router.currentState.match.params).to.deep.equal(params)
   expect(toArray(router.match$)).to.deep.equal([expectedMatch])
}

export const expectToMatchExact = (router: any, params: any = undefined) => {
   expect(router.isMatchingExact).to.be.true
   const expectedMatch = params ? { exact: true, params } : { exact: true }
   expect(router.currentState.match).to.deep.equal(expectedMatch)
   expect(router.currentState.match.params).to.deep.equal(params)
   expect(toArray(router.match$)).to.deep.equal([expectedMatch])
}
