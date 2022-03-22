import { createClient, dedupExchange } from 'urql'
import { cacheExchange } from '@urql/exchange-graphcache'
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch'
import { devtoolsExchange } from '@urql/devtools'

import schema from './graphql-schema.json'

const client = createClient({
  url: process.env.NODE_ENV === 'production' ? 'https://graphql.codeo.love' : 'http://localhost:5001',
  // fetchOptions: () => ({
  //   headers: {
  //     'Content-Type': 'application/graphql',
  //     'X-Shopify-Storefront-Access-Token': 'd8eaa61ffad11aecb5541b416f228ee9',
  //   },
  // }),
  exchanges: [devtoolsExchange, dedupExchange, cacheExchange({ schema }), multipartFetchExchange],
})

export default client
