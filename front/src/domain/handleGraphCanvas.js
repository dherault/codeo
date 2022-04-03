import getCanvasDpr from './getCanvasDpr'
import processTree from './processTree'
import positionGraph from './positionGraph'

function handleGraphCanvas(canvas, nodeHierarchy, updateNodeHierarchy) {
  const _ = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  const dpr = getCanvasDpr(_)
  let stopped = false

  canvas.style.width = '100%'
  canvas.style.height = '100%'
  const width = canvas.width = dpr * canvas.offsetWidth
  const height = canvas.height = dpr * canvas.offsetHeight

  _.scale(dpr, dpr)

  /*
    CONFIG AND STATE
  */

  const drawConfiguration = {
    backgroundColor: '#222',
    font: "'Fira Mono', monospace",
    node: {
      radius: 4 * dpr,
      backgroundColor: 'royalblue',
      color: 'white',
      labelFontSize: 16 * dpr,
      labelPaddingVertical: 4 * dpr,
      labelPaddingHorizontal: 8 * dpr,
      ioSpacing: 16 * dpr,
      ioVerticalPadding: 6 * dpr,
      ioCircleRadius: 6 * dpr,
      ioCircleStrokeWidth: 2 * dpr,
      ioCircleColor: '#FFCC4A',
      ioCircleHorizontalPadding: 8 * dpr,
      ioLabelFontSize: 12 * dpr,
      ioLabelPadding: 0 * dpr,
    },
    edge: {
      strokeWidth: 2 * dpr,
      strokeColor: '#FFCC4A',
    },
    backButton: normalizeRect({
      y: 16,
      x: 16,
      width: 128,
      height: 64,
      color: 'white',
      backgroundColor: 'royalblue',
      label: 'Back',
      fontSize: 16 * dpr,
    }),
  }

  const state = {
    globalTree: null,
    currentNodeId: parseInt(nodeHierarchy[nodeHierarchy.length - 1]),
    nodes: {},
    edges: {},
    registeredClickHandlers: [
      { rect: drawConfiguration.backButton, handler: handleBackButtonClick, condition: state => state.currentNodeHierarchy.length > 1 },
    ],
  }

  window.state = state

  /*
    DRAW
  */

  function draw() {
    _.fillStyle = drawConfiguration.backgroundColor
    _.fillRect(0, 0, width, height)

    Object.values(state.nodes).forEach(drawNode)
    Object.entries(state.edges).forEach(([inId, outIds]) => outIds.forEach(outId => drawEdge(inId, outId)))

    if (nodeHierarchy.length > 1) drawBackButton()
  }

  function drawNode(node) {
    const { x = 0, y = 0, label = '', inputs = [], outputs = [] } = node
    const {
      radius,
      backgroundColor,
      color,
      labelFontSize,
      labelPaddingVertical,
      labelPaddingHorizontal,
      ioSpacing,
      ioVerticalPadding,
      ioCircleRadius,
      ioCircleStrokeWidth,
      ioCircleColor,
      ioCircleHorizontalPadding,
      ioLabelFontSize,
      ioLabelPadding,
    } = drawConfiguration.node

    const ioHeight = 2 * ioVerticalPadding + Math.max(ioCircleRadius, ioLabelFontSize)
    const width = Math.max(label.length * labelFontSize + 2 * labelPaddingHorizontal, 300) // TODO
    const height = 2 * labelPaddingVertical + labelFontSize + Math.max(inputs.length * ioHeight, outputs.length * ioHeight)

    // ! Oh
    node.width = width
    node.height = height

    let heightCursor = 0

    _.translate(x, y)
    _.beginPath()
    _.moveTo(width, height)
    _.arcTo(0, height, 0, 0, radius)
    _.arcTo(0, 0, width, 0, radius)
    _.arcTo(width, 0, width, height, radius)
    _.arcTo(width, height, 0, height, radius)
    _.closePath()
    _.fillStyle = backgroundColor
    _.fill()
    _.fillStyle = color
    _.font = `${labelFontSize}px ${drawConfiguration.font}`
    _.textAlign = 'center'
    _.textBaseline = 'top'
    _.fillText(label, width / 2, labelPaddingVertical)

    heightCursor += 2 * labelPaddingVertical + 1.5 * labelFontSize

    inputs.forEach(({ label }, index) => {
      let x = ioCircleHorizontalPadding + ioCircleRadius
      const y = heightCursor + index * ioHeight

      _.beginPath()
      _.arc(x, y, ioCircleRadius, 0, 2 * Math.PI)
      _.closePath()
      _.strokeStyle = ioCircleColor
      _.lineWidth = ioCircleStrokeWidth
      _.stroke()

      x += ioCircleRadius + ioCircleHorizontalPadding + ioLabelPadding

      _.fillStyle = color
      _.font = `${ioLabelFontSize}px ${drawConfiguration.font}`
      _.textAlign = 'left'
      _.textBaseline = 'middle'
      _.fillText(label, x, y)
    })

    outputs.forEach(({ label }, index) => {
      let x = width - (ioCircleHorizontalPadding + ioCircleRadius)
      const y = heightCursor + index * ioHeight

      _.beginPath()
      _.arc(x, y, ioCircleRadius, 0, 2 * Math.PI)
      _.closePath()
      _.strokeStyle = ioCircleColor
      _.lineWidth = ioCircleStrokeWidth
      _.stroke()

      x -= ioCircleRadius + ioCircleHorizontalPadding + ioLabelPadding

      _.fillStyle = color
      _.font = `${ioLabelFontSize}px ${drawConfiguration.font}`
      _.textAlign = 'right'
      _.textBaseline = 'middle'
      _.fillText(label, x, y)
    })

    _.setTransform(1, 0, 0, 1, 0, 0)
  }

  function drawEdge(inId, outId) {
    const { strokeWidth, strokeColor } = drawConfiguration.edge
    const { x: inX, y: inY } = findEdgeExtremityPosition(state.nodes, inId, drawConfiguration.node)
    const { x: outX, y: outY } = findEdgeExtremityPosition(state.nodes, outId, drawConfiguration.node)

    _.beginPath()
    _.moveTo(inX, inY)
    _.lineTo(outX, outY)
    _.strokeStyle = strokeColor
    _.lineWidth = strokeWidth
    _.stroke()
  }

  function drawBackButton() {
    drawButton(drawConfiguration.backButton)
  }

  function drawButton({ x, y, width, height, color, backgroundColor, label, fontSize }) {

    _.fillStyle = backgroundColor
    _.fillRect(x, y, width, height)
    _.fillStyle = color
    _.font = `${fontSize}px ${drawConfiguration.font}`
    _.textAlign = 'center'
    _.textBaseline = 'middle'
    _.fillText(label, x + width / 2, y + height / 2)
  }

  /*
    UPDATE
  */

  function updateState(globalTree) {
    const { nodes, edges } = parseTree(getChildTree(globalTree, state.currentNodeId), width, height)

    state.globalTree = globalTree
    state.nodes = nodes
    state.edges = edges
  }

  function goToNode(nodeId = 1) {
    let nextNodeHierachy = nodeHierarchy.slice()
    const currentNodeIndex = nextNodeHierachy.indexOf(nodeId)

    if (currentNodeIndex === -1) {
      nextNodeHierachy.push(nodeId)
    }
    else {
      nextNodeHierachy = nextNodeHierachy.slice(0, currentNodeIndex + 1)
    }

    updateNodeHierarchy(nextNodeHierachy)
  }

  /*
    EVENTS
  */

  function handleMouseDown() {

  }

  function handleMouseMove() {

  }

  function handleClick(event) {
    const x = (event.clientX - rect.left) * dpr
    const y = (event.clientY - rect.top) * dpr

    // console.log('x, y', x, y)
    // console.log('x, y', state.nodes)

    const clickedButton = state.registeredClickHandlers.find(({ rect }) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height)

    if (
      clickedButton
      && typeof clickedButton.handler === 'function'
      && (typeof clickedButton.condition === 'function' ? clickedButton.condition(state) : true)
    ) {
      return clickedButton.handler()
    }

    const clickedNode = Object
      .values(state.nodes)
      .find(node => x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height)

    if (clickedNode && clickedNode.type === 'FunctionDeclaration') {
      goToNode(clickedNode.id)
    }
  }

  function handleBackButtonClick() {
    goToNode(state.globalTree, state.currentNodeHierarchy[state.currentNodeHierarchy.length - 2])
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

  /*
    LOOP
  */

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
    updateTree: globalTree => nodeHierarchy.length ? updateState(globalTree) : goToNode(globalTree.id),
  }
}

function parseTree(tree, width, height) {
  const nodes = {}
  const edges = {}

  processTree(tree, nodes, edges, true)
  positionGraph(nodes, edges, width, height)

  return { nodes, edges }
}

function getChildTree(tree, nodeId) {
  if (tree.id === nodeId) return tree

  for (let i = 0; i < (tree.statements || []).length; i++) {
    const childTree = getChildTree(tree.statements[i], nodeId)

    if (childTree) return childTree
  }

  return null
}

function normalizeRect({ top, left, right, bottom, width, height, ...props }) {
  const _top = typeof top === 'undefined' ? bottom - height : top
  const _left = typeof left === 'undefined' ? right - width : left
  const _width = typeof width === 'undefined' ? right - _left : width
  const _height = typeof height === 'undefined' ? bottom - _top : height

  return {
    y: _top,
    x: _left,
    width: _width,
    height: _height,
    ...props,
  }
}

function findEdgeExtremityPosition(nodes, id, nodeDrawConfiguration) {
  for (const node of Object.values(nodes)) {
    const { inputs = [], outputs = [] } = node

    const foundInputIndex = inputs.findIndex(input => input.id === id)

    if (foundInputIndex !== -1) {
      return {
        x: node.x + nodeDrawConfiguration.ioCircleHorizontalPadding + nodeDrawConfiguration.ioCircleRadius,
        y: node.y + 2 * nodeDrawConfiguration.labelPaddingVertical + 1.5 * nodeDrawConfiguration.labelFontSize + foundInputIndex * (2 * nodeDrawConfiguration.ioVerticalPadding + Math.max(nodeDrawConfiguration.ioCircleRadius, nodeDrawConfiguration.ioLabelFontSize)),
      }
    }

    const foundOutputIndex = outputs.findIndex(output => output.id === id)

    if (foundOutputIndex !== -1) {
      return {
        x: node.x + node.width - nodeDrawConfiguration.ioCircleHorizontalPadding - nodeDrawConfiguration.ioCircleRadius,
        y: node.y + 2 * nodeDrawConfiguration.labelPaddingVertical + 1.5 * nodeDrawConfiguration.labelFontSize + foundOutputIndex * (2 * nodeDrawConfiguration.ioVerticalPadding + Math.max(nodeDrawConfiguration.ioCircleRadius, nodeDrawConfiguration.ioLabelFontSize)),
      }
    }
  }

  console.log('nodes', Object.values(nodes))
  console.log('typeof id', typeof id)

  throw new Error(`Edge extremity not found: ${id}`)
}

export default handleGraphCanvas
