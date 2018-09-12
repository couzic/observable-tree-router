import { createMemoryHistory, History } from 'history'

import { createBrowserRouter } from './createBrowserRouter'
import { route } from './route'

describe('createBrowserRouter', () => {
   let history: History

   beforeEach(() => {
      history = createMemoryHistory()
   })

   describe('acceptance test', () => {
      const createRouter = () =>
         createBrowserRouter(history, {
            stats: route({
               nested: {
                  globalTrend: route({
                     path: '/tendance-globale',
                     nested: {
                        withEpj: route({
                           path: '/:epjId',
                           params: ['epjId']
                        })
                     }
                  }),
                  byProduct: route({
                     path: 'par-produit',
                     nested: {
                        withEpj: route({
                           path: '/:epjId',
                           params: ['epjId']
                        })
                     }
                  })
               }
            }),
            dossierRoi: route({
               path: '/dossier-roi'
            }),
            pdf: route({
               nested: {
                  synthetique: route(),
                  complet: route()
               }
            })
         })
      let router: ReturnType<typeof createRouter>

      beforeEach(() => {
         router = createRouter()
      })
   })
})
