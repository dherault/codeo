import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose'

cytoscape.use(fcose)

async function positionGraph(nodes, edges, width, height) {
  const nodeWithEdgeIds = new Set()

  Object.entries(edges).forEach(([inId, outIds]) => {
    nodeWithEdgeIds.add(inId)
    outIds.forEach(outId => {
      nodeWithEdgeIds.add(outId)
    })
  })

  const sortedNodeIds = Object.values(nodes)
    .map(({ inputs = [], outputs = [] }) => [...inputs.map(x => x.id), ...outputs.map(x => x.id)])
    .flat()
    .sort((a, b) => a.cursor - b.cursor)

  const cy = cytoscape({
    headless: true,
    styleEnabled: false,
    animate: false,
    elements: [
      ...Object.values(nodes).map(node => [
        ...(node.inputs || []).map(input => ({
          data: {
            group: 'nodes',
            id: input.id,
            nodeId: node.id,
            width: node.width / 2,
            height: node.height / node.inputs.length,
          },
        })),
        ...(node.outputs || []).map(output => ({
          data: {
            group: 'nodes',
            id: output.id,
            nodeId: node.id,
            width: node.width / 2,
            height: node.height / node.outputs.length,
          },
        })),
      ]).flat(),
      ...Object.entries(edges).map(([inId, outIds]) => outIds.map(outId => ({
        data: {
          group: 'edges',
          id: hashEdgeId(inId, outId),
          source: inId,
          target: outId,
        },
      }))).flat(),
    ],
    style: [
      {
        selector: 'node',
        style: {
          shape: 'rectangle',
          width: 'data(width)',
          height: 'data(height)',
        },
      },
    ],
    userPanningEnabled: false,
    userZoomingEnabled: false,
  })

  // cy.elements().forEach(element => console.log(element.data()))

  const promise = new Promise(resolve => {
    cy.one('layoutstop', () => {
      const n = {}

      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity

      cy.nodes().forEach((node, id) => {
        const data = node.data()
        const { x, y } = node.position()

        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y

        const foundNode = nodes[data.nodeId]

        n[foundNode.id] = {
          ...foundNode,
          x,
          y,
        }
      })

      const deltaX = maxX - minX
      const deltaY = maxY - minY
      const deltaLeft = (width - deltaX) / 2
      const deltaTop = (height - deltaY) / 2

      Object.values(n).forEach(node => {
        node.x += deltaLeft - minX / 2
        node.y += deltaTop - minY / 2
      })

      resolve({ nodes: n, edges })
    })
  })

  cy.layout({
    name: 'fcose',
    boundingBox: {
      x1: 0,
      y1: 0,
      w: width,
      h: height,
    },
    fit: true,
    animate: null,
    quality: 'default',
    randomize: true,
    // padding: 512,
    // nodeRepulsion: () => 1000,
    // idealEdgeLength: () => 1024,
    relativePlacementConstraint: [
      ...Object.values(nodes).map(({ inputs = [], outputs = [] }) => ([
        ...((inputs.length && outputs.length) ? [{ left: inputs[0].id, right: outputs[0].id, gap: 100 }] : []),
        ...inputs.filter((_, i) => i > 0).map((input, i) => ({ top: inputs[i].id, bottom: input.id, gap: 25 })),
        ...outputs.filter((_, i) => i > 0).map((output, i) => ({ top: outputs[i].id, bottom: output.id, gap: 25 })),
      ])),
      ...sortedNodeIds.filter((_, i) => i > 0).map((nodeId, i) => ({
        top: sortedNodeIds[i],
        bottom: nodeId,
        gap: 256,
      })),
      ...Object.entries(edges).map(([inId, outIds]) => outIds.map(outId => ({ left: outId, right: inId, gap: 512 }))),
    ].flat(),
  }).run()

  return promise
}

function hashEdgeId(inId, outId) {
  return `${inId}---@---${outId}`
}

function unhashEdge(hash) {
  const [inId, outId] = hash.split('---@---')

  return [inId, outId]
}

export default positionGraph
