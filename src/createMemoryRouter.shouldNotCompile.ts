import { createMemoryRouter } from './createMemoryRouter'

// Null config @shouldNotCompile
createMemoryRouter(null)

// Undefined config @shouldNotCompile
createMemoryRouter(undefined)

// Null route @shouldNotCompile
createMemoryRouter({
   r1: null
})

// Undefined route @shouldNotCompile
createMemoryRouter({
   r1: undefined
})

// Invalid route @shouldNotCompile
createMemoryRouter({
   r1: {}
})
