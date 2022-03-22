import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'urql'

import getCanvasDpr from '../utils/getCanvasDpr'

const NodesQuery = `
  query NodesQuery ($code: String!) {
    codeToAst(code: $code)
  }
`

function Nodes({ code, open }) {
  // console.log('code', code)
  const [updateTree, setUpdateTree] = useState(() => () => {})
  const canvasRef = useRef()
  const [queryResult] = useQuery({
    query: NodesQuery,
    variables: { code },
  })

  useEffect(() => {
    const { stop, updateTree } = handleCanvas(canvasRef.current)

    setUpdateTree(() => updateTree)

    return stop
  }, [open])

  useEffect(() => {
    if (queryResult.data) {
      updateTree(JSON.parse(queryResult.data.codeToAst))
    }
  }, [updateTree, queryResult])

  return (
    <canvas
      ref={canvasRef}
      className="flex-grow w100 h100"
    />
  )
}

function handleCanvas(canvas) {
  const _ = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  const dpr = getCanvasDpr(_)
  let stopped = false

  canvas.style.width = '100%'
  canvas.style.height = '100%'
  const width = canvas.width = dpr * canvas.offsetWidth
  const height = canvas.height = dpr * canvas.offsetHeight

  _.scale(dpr, dpr)

  const drawConfiguration = {
    backgroundColor: '#333',
    nodeRadius: 4 * dpr,
    nodeBackgroundColor: 'lightskyblue',
    nodeColor: 'white',
    nodeFont: 'monospace',
    nodeLabelFontSize: 16 * dpr,
    nodeLabelPaddingVertical: 4 * dpr,
    nodeLabelPaddingHorizontal: 8 * dpr,
    nodeIoSpacing: 16 * dpr,
    nodeIoVerticalPadding: 6 * dpr,
    nodeIoCircleRadius: 8 * dpr,
    nodeIoCircleStrokeWidth: 2 * dpr,
    nodeIoCircleColor: 'deepskyblue',
    nodeIoCircleHorizontalPadding: 8 * dpr,
    nodeIoLabelFontSize: 12 * dpr,
    nodeIoLabelPadding: 0 * dpr,
  }

  const state = {
    globalTree: null,
    currentNodeId: null,
    nodes: {},
    edges: {},
  }

  function draw() {
    _.fillStyle = drawConfiguration.backgroundColor
    _.fillRect(0, 0, width, height)

    Object.values(state.nodes).forEach(drawNode)
    Object.values(state.edges).forEach(drawEdge)
  }

  function drawNode(node) {
    const { x, y, label, inputs, outputs } = node
    const {
      nodeRadius,
      nodeBackgroundColor,
      nodeColor,
      nodeFont,
      nodeLabelFontSize,
      nodeLabelPaddingVertical,
      nodeLabelPaddingHorizontal,
      nodeIoSpacing,
      nodeIoVerticalPadding,
      nodeIoCircleRadius,
      nodeIoCircleStrokeWidth,
      nodeIoCircleColor,
      nodeIoCircleHorizontalPadding,
      nodeIoLabelFontSize,
      nodeIoLabelPadding,
    } = drawConfiguration

    const nodeIoHeight = 2 * nodeIoVerticalPadding + Math.max(nodeIoCircleRadius, nodeIoLabelFontSize)
    const width = Math.max(label.length * nodeLabelFontSize + 2 * nodeLabelPaddingHorizontal, 300) // TODO
    const height = 2 * nodeLabelPaddingVertical + nodeLabelFontSize + Math.max(inputs.length * nodeIoHeight, outputs.length * nodeIoHeight)

    // ! Oh
    node.width = width
    node.height = height

    let heightCursor = 0

    _.translate(x, y)
    _.beginPath()
    _.moveTo(width, height)
    _.arcTo(0, height, 0, 0, nodeRadius)
    _.arcTo(0, 0, width, 0, nodeRadius)
    _.arcTo(width, 0, width, height, nodeRadius)
    _.arcTo(width, height, 0, height, nodeRadius)
    _.closePath()
    _.fillStyle = nodeBackgroundColor
    _.fill()
    _.fillStyle = nodeColor
    _.font = `${nodeLabelFontSize}px ${nodeFont}`
    _.textAlign = 'center'
    _.textBaseline = 'top'
    _.fillText(label, width / 2, nodeLabelPaddingVertical)

    heightCursor += 2 * nodeLabelPaddingVertical + 1.5 * nodeLabelFontSize

    inputs.forEach(({ label }, index) => {
      let x = nodeIoCircleHorizontalPadding + nodeIoCircleRadius
      const y = heightCursor + index * nodeIoHeight

      _.beginPath()
      _.arc(x, y, nodeIoCircleRadius, 0, 2 * Math.PI)
      _.closePath()
      _.strokeStyle = nodeIoCircleColor
      _.lineWidth = nodeIoCircleStrokeWidth
      _.stroke()

      x += nodeIoCircleRadius + nodeIoCircleHorizontalPadding + nodeIoLabelPadding

      _.fillStyle = nodeColor
      _.font = `${nodeIoLabelFontSize}px ${nodeFont}`
      _.textAlign = 'left'
      _.textBaseline = 'middle'
      _.fillText(label, x, y)
    })

    outputs.forEach(({ label }, index) => {
      let x = width - (nodeIoCircleHorizontalPadding + nodeIoCircleRadius)
      const y = heightCursor + index * nodeIoHeight

      _.beginPath()
      _.arc(x, y, nodeIoCircleRadius, 0, 2 * Math.PI)
      _.closePath()
      _.strokeStyle = nodeIoCircleColor
      _.lineWidth = nodeIoCircleStrokeWidth
      _.stroke()

      x -= nodeIoCircleRadius + nodeIoCircleHorizontalPadding + nodeIoLabelPadding

      _.fillStyle = nodeColor
      _.font = `${nodeIoLabelFontSize}px ${nodeFont}`
      _.textAlign = 'right'
      _.textBaseline = 'middle'
      _.fillText(label, x, y)
    })

    _.setTransform(1, 0, 0, 1, 0, 0)
  }

  function drawEdge(edge) {

  }

  function updateGraph(globalTree, currentNodeId = 1) {
    const { nodes, edges } = parseTree(getChildTree(globalTree, currentNodeId), width, height)

    state.nodes = nodes
    state.edges = edges
    state.currentNodeId = currentNodeId
  }

  function handleMouseDown() {

  }

  function handleMouseMove() {

  }

  function handleClick(event) {
    const x = (event.clientX - rect.left) * dpr
    const y = (event.clientY - rect.top) * dpr

    console.log('x, y', x, y)
    console.log('x, y', state.nodes)

    const clickedNode = Object.values(state.nodes).find(node => x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height)

    if (clickedNode && clickedNode.type === 'FunctionDeclaration') {
      updateGraph(state.globalTree, clickedNode.id)
    }
  }

  function registerEvents() {
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }

  function step() {
    draw()

    if (stopped) return

    requestAnimationFrame(step)
  }

  const unregisterEvents = registerEvents()

  requestAnimationFrame(step)

  return {
    stop: () => {
      stopped = true
      unregisterEvents()
    },
    updateTree: globalTree => {
      state.globalTree = globalTree
      updateGraph(globalTree)
    },
  }
}

function parseTree(tree, width, height) {
  const nodes = {}
  const edges = {}

  processTree(tree, nodes, edges)
  positionNodes(nodes, edges, width, height)

  return { nodes, edges }
}

function processTree(tree, nodes, edges) {
  // console.log('tree', tree)
  switch (tree.kind) {
    case 'SourceFile': {
      tree.statements.forEach(childTree => processTree(childTree, nodes, edges))

      break
    }
    case 'FunctionDeclaration': {
      const { id, name, parameters } = tree

      const node = {
        id,
        label: name.escapedText,
        type: 'FunctionDeclaration',
        inputs: parameters.map(({ id, name }) => ({
          id,
          label: name.escapedText,
        })),
        outputs: [
          {
            id: `${id}-return`,
            label: 'return',
          },
        ],
      }

      nodes[id] = node

      break
    }
  }
}

function positionNodes(nodes, edges, width, height) {
  Object.values(nodes).forEach(node => {
    node.x = Math.random() * (width - 250)
    node.y = Math.random() * (height - 250)
  })
}

function getChildTree(tree, nodeId) {
  if (tree.id === nodeId) return tree

  for (let i = 0; i < (tree.statements || []).length; i++) {
    const childTree = getChildTree(tree.statements[i], nodeId)

    if (childTree) return childTree
  }

  return null
}

export default Nodes
