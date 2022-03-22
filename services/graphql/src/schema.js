const { buildSchema } = require('graphql')

const schema = buildSchema(`
  type Query {
    codeToAst(code: String): String
  }
`)

module.exports = schema
