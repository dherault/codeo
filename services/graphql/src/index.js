const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const cors = require('cors')

const schema = require('./schema')

const isProduction = process.env.NODE_ENV === 'production'

// The root provides a resolver function for each API endpoint
const root = {
  hello: () => 'Hello world!',
}

const app = express()
const port = process.env.PORT || 5001

// Set CORS options
app.use(cors({
  origin: isProduction ? 'https://codeo.love' : '*',
}))

app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true,
}))

app.listen(port)

console.log('Running GraphQL server')
