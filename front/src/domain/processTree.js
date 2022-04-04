export function createId(kind, id) {
  return `${kind}_${id}`
}

export function processTree(tree, nodes, edges, isRoot, identifiers = []) {
  const { id, kind, pos: cursor } = tree
  const _id = createId(kind, id) // enforce a string id
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
          cursor,
          label: 'arguments',
          type: 'FunctionDeclarationArguments',
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

      const returnId = createId('return', id)

      nodes[_id] = {
        id: _id,
        cursor,
        label: name.escapedText,
        type: 'FunctionDeclaration',
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
    case 'ReturnStatement': {
      const { expression } = tree
      const returnId = createId('return', id)

      nodes[_id] = {
        id: _id,
        cursor,
        label: 'return',
        type: 'ReturnStatement',
        inputs: [
          {
            id: returnId,
            cursor,
            label: 'return',
          },
        ],
      }

      if (expression) {
        const expressionReturnId = processTree(expression, nodes, edges, false, identifiers)
        createEdge(edges, returnId, expressionReturnId)
      }

      return returnId
    }
    case 'BinaryExpression': {
      const { left, operatorToken, right } = tree
      const leftId = createId('left', id)
      const rightId = createId('right', id)
      const returnId = createId('return', id)

      nodes[_id] = {
        id: _id,
        cursor,
        label: operatorToken.kind,
        type: 'BinaryExpression',
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
        const _leftId = processTree(left, nodes, edges, false, identifiers)
        createEdge(edges, leftId, _leftId)
      }
      if (right) {
        const _rightId = processTree(right, nodes, edges, false, identifiers)
        createEdge(edges, rightId, _rightId)
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
