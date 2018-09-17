import { expect } from 'chai'

import { equalParams } from './equalParams'

describe('equalParams', () => {
   it('compares empty params', () => {
      expect(equalParams([], {}, {})).to.equal(true)
   })

   it('compares equal param', () => {
      expect(equalParams(['key'], { key: 'key' }, { key: 'key' })).to.equal(
         true
      )
   })

   it('compares with different param value', () => {
      expect(
         equalParams(['key'], { key: 'key' }, { key: 'different' })
      ).to.equal(false)
   })
})
