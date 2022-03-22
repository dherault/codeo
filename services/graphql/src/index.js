const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const cors = require('cors')

const schema = require('./schema')
const resolvers = require('./resolvers')

const isProduction = process.env.NODE_ENV === 'production'

const app = express()
const port = process.env.PORT || 5001

// Set CORS options
app.use(cors({
  origin: isProduction ? 'https://codeo.love' : '*',
}))

app.use('/', graphqlHTTP({
  schema,
  rootValue: resolvers,
  graphiql: true,
}))

app.listen(port)

console.log('Running GraphQL server')
