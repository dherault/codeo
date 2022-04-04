export function createId(kind, id) {
  return `${kind}_${id}`
}

export function processTree(tree, nodes, edges, isRoot, identifiers = []) {
  const { id, kind, pos: cursor } = tree
  const _id = createId(kind, id) // enforce a string id
  // console.log(_id, tree)

  switch (kind) {
    case 'SourceFile': {
      tree.statements.forEach(childTree => processTree(childTree, nodes, edges, false, identifiers))

      return _id
    }
    case 'Identifier': {
      const { escapedText } = tree
      const identifier = findRight(identifiers, identifier => identifier.label === escapedText)

      if (identifier) return identifier.id

      // console.log(`Identifier "${escapedText}" not found in local scope, creating outer variable`)

      const nodeId = createId(kind, escapedText)
      const identifierId = createId(`${kind}Value`, escapedText)

      identifiers.push({
        id: identifierId,
        label: escapedText,
      })

      nodes[nodeId] = {
        id: nodeId,
        kind: 'OuterScopeIdentifier',
        cursor,
        label: escapedText,
        outputs: [
          {
            id: identifierId,
            cursor,
            label: 'value',
          },
        ],
      }

      return identifierId
    }
    case 'FunctionDeclaration': {
      const { name, parameters = [], body = { statements: [] } } = tree

      if (isRoot) {
        nodes[_id] = {
          id: _id,
          cursor,
          label: 'arguments',
          type: `${kind}Arguments`,
          outputs: parameters.map(({ id, name, pos: cursor }) => {
            const identifier = {
              id: createId(name.escapedText, id),
              label: name.escapedText,
              cursor,
            }

            identifiers.push(identifier)

            return identifier
          }),
        }

        body.statements.forEach(childTree => processTree(childTree, nodes, edges, false, identifiers))

        return _id
      }

      const returnId = createId('return', _id)

      nodes[_id] = {
        id: _id,
        cursor,
        label: name.escapedText,
        type: kind,
        inputs: parameters.map(({ id, name, pos: cursor }) => ({
          id: createId(name.escapedText, id),
          label: name.escapedText,
          cursor,
        })),
        outputs: [
          {
            id: returnId,
            cursor,
            label: 'return',
          },
        ],
      }

      return returnId
    }
    case 'ExpressionStatement':
    case 'ReturnStatement': {
      const { expression } = tree
      const returnId = createId('return', _id)

      nodes[_id] = {
        id: _id,
        cursor,
        label: 'return',
        type: kind,
        inputs: [
          {
            id: returnId,
            cursor,
            label: 'return',
          },
        ],
      }

      if (expression) {
        const expressionId = processTree(expression, nodes, edges, false, identifiers)
        createEdge(edges, returnId, expressionId)
      }

      return returnId
    }
    case 'CallExpression': {
      const { arguments: args, expression } = tree
      const returnId = createId('return', _id)

      nodes[_id] = {
        id: _id,
        cursor,
        label: 'call',
        type: kind,
        inputs: args.map((argument, i) => {
          const id = createId(`argument_${i}`, _id)
          const argumentId = processTree(argument, nodes, edges, false, identifiers)

          createEdge(edges, argumentId, id)

          return {
            id,
            cursor,
            label: `arg ${i}`,
          }
        }),
        outputs: [
          {
            id: returnId,
            cursor,
            label: 'callee',
          },
        ],
      }

      if (expression) {
        const expressionId = processTree(expression, nodes, edges, false, identifiers)

        createEdge(edges, returnId, expressionId)
      }

      return returnId
    }
    case 'BinaryExpression': {
      const { left, operatorToken, right } = tree
      const leftId = createId('left', _id)
      const rightId = createId('right', _id)
      const returnId = createId('return', _id)

      nodes[_id] = {
        id: _id,
        cursor,
        label: operatorToken.kind,
        type: kind,
        inputs: [
          {
            id: leftId,
            cursor: left.pos,
            label: 'left',
          },
          {
            id: rightId,
            cursor: right.pos,
            label: 'right',
          },
        ],
        outputs: [
          {
            id: returnId,
            cursor,
            label: 'output',
          },
        ],
      }

      if (left) {
        const leftMemberId = processTree(left, nodes, edges, false, identifiers)

        createEdge(edges, leftId, leftMemberId)
      }
      if (right) {
        const rightMemberId = processTree(right, nodes, edges, false, identifiers)

        createEdge(edges, rightId, rightMemberId)
      }

      return returnId
    }
    case 'PropertyAccessExpression': {
      const { expression, name } = tree
      const dotId = createId('dot', _id)
      const valueId = createId('value', _id)

      nodes[_id] = {
        id: _id,
        cursor,
        label: name.escapedText,
        type: kind,
        inputs: [
          {
            id: dotId,
            cursor: expression.pos,
            label: 'dot',
          },
        ],
        outputs: [
          {
            id: valueId,
            cursor,
            label: 'value',
          },
        ],
      }

      if (expression) {
        const expressionId = processTree(expression, nodes, edges, false, identifiers)

        createEdge(edges, expressionId, dotId)
      }

      return valueId
    }
    // Merge with StringLiteral?
    case 'FirstLiteralToken': {
      const { text } = tree
      const valueId = createId('value', _id)

      nodes[_id] = {
        id: _id,
        cursor,
        label: text,
        type: kind,
        outputs: [
          {
            id: valueId,
            cursor,
            label: 'value',
          },
        ],
      }

      return valueId
    }
    case 'StringLiteral': {
      const { text } = tree
      const valueId = createId('value', _id)

      nodes[_id] = {
        id: _id,
        cursor,
        label: text,
        type: kind,
        outputs: [
          {
            id: valueId,
            cursor,
            label: 'value',
          },
        ],
      }

      return valueId
    }
  }

  throw new Error(`Unhandled tree kind: ${kind}`)
}

function createEdge(edges, inId, outId) {
  edges[inId] = edges[inId] || []
  edges[inId].push(outId)
}

function findRight(array, fn) {
  for (let i = array.length - 1; i >= 0; i--) {
    const item = array[i]

    if (fn(item)) return item
  }

  return null
}
