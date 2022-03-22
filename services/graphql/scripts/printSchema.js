#!/usr/bin/env node
const fs = require('fs')

const { getIntrospectedSchema, minifyIntrospectionQuery } = require('@urql/introspection')
const { getIntrospectionQuery } = require('graphql')
const fetch = require('node-fetch')

fetch('http://localhost:5001', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variables: {},
    query: getIntrospectionQuery({ descriptions: false }),
  }),
})
  .then(result => result.json())
  .then(({ data }) => {
    const minified = minifyIntrospectionQuery(getIntrospectedSchema(data))
    fs.writeFileSync('../../front/src/graphql-schema.json', JSON.stringify(minified, null, 2))
  })
