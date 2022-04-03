function createId(id, kind) {
  return `${id}__${kind}`
}

function processTree(tree, nodes, edges, isRoot, identifiers = []) {
  const { id, kind } = tree
  const _id = createId(id, kind) // enforce a string id
  // console.log('tree', tree)

  switch (kind) {
    case 'SourceFile': {
      tree.statements.forEach(childTree => processTree(childTree, nodes, edges, false, identifiers))

      return _id
    }
    case 'Identifier': {
      const { escapedText } = tree
      const identifier = findRight(identifiers, identifier => identifier.label === escapedText)

      if (!identifier) throw new Error(`Identifier not found: ${escapedText}`)

      return identifier.id
    }
    case 'FunctionDeclaration': {
      const { name, parameters = [], body = { statements: [] } } = tree

      if (isRoot) {
        nodes[_id] = {
          id: _id,
          label: 'arguments',
          type: 'FunctionDeclarationArguments',
          outputs: parameters.map(({ id, name }) => {
            const identifier = {
              id: createId(id, name),
              label: name.escapedText,
            }

            identifiers.push(identifier)

            return identifier
          }),
        }

        body.statements.forEach(childTree => processTree(childTree, nodes, edges, false, identifiers))

        return _id
      }

      const returnId = createId(id, 'return')

      nodes[id] = {
        id,
        label: name.escapedText,
        type: 'FunctionDeclaration',
        inputs: parameters.map(({ id, name }) => ({
          id,
          label: name.escapedText,
        })),
        outputs: [
          {
            id: returnId,
            label: 'return',
          },
        ],
      }

      return returnId
    }
    case 'ReturnStatement': {
      const { expression } = tree
      const returnId = createId(id, 'return')

      nodes[id] = {
        id,
        label: 'return',
        type: 'ReturnStatement',
        inputs: [
          {
            id: returnId,
            label: 'return',
          },
        ],
      }

      if (expression) {
        const expressionReturnId = processTree(expression, nodes, edges, false, identifiers)
        createEdge(edges, expressionReturnId, returnId)
      }

      return returnId
    }
    case 'BinaryExpression': {
      const { left, operatorToken, right } = tree
      const leftId = createId(id, 'left')
      const rightId = createId(id, 'right')
      const returnId = createId(id, 'return')

      nodes[id] = {
        id,
        label: operatorToken.kind,
        type: 'BinaryExpression',
        inputs: [
          {
            id: leftId,
            label: 'left',
          },
          {
            id: rightId,
            label: 'right',
          },
        ],
        outputs: [
          {
            id: returnId,
            label: 'output',
          },
        ],
      }

      if (left) {
        const _leftId = processTree(left, nodes, edges, false, identifiers)
        createEdge(edges, _leftId, leftId)
      }
      if (right) {
        const _rightId = processTree(right, nodes, edges, false, identifiers)
        createEdge(edges, _rightId, rightId)
      }

      return returnId
    }
  }
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

export default processTree
