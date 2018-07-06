import { route } from './route'

const r0 = route()
const r1 = route({ params: ['p1'] })
const r2 = route({
   path: 'p',
   params: ['p1', 'p2']
})
const r3 = route({ path: 'p' })
const r4 = route({
   params: ['p1'],
   nested: { n1: route() }
})

// Null config @shouldNotCompile
route(null)

// Undefined config @shouldNotCompile
route(undefined)

// Empty config @shouldNotCompile
route({})

// Config with invalid field @shouldNotCompile
route({ invalid: '' })

// Config with undefined path @shouldNotCompile
route({ path: undefined, params: [''] })

// Config with undefined param @shouldNotCompile
route({ path: '', params: [undefined] })

// Invalid nested route @shouldNotCompile
route({
   nested: {
      n1: ''
   }
})

// Invalid nested route @shouldNotCompile
route({
   nested: {
      n1: {}
   }
})

// Invalid nested route @shouldNotCompile
route({
   nested: {
      n1: { params: '' }
   }
})

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Config with empty params @shouldNotButDoesCompile
// Empty nested config @shouldNotButDoesCompile
route({ path: '', params: [] })
route({ path: '', nested: {} })
route({ params: [] })
route({ nested: {} })
