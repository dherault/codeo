import getCanvasDpr from './getCanvasDpr'
import { createId, processTree } from './processTree'
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
    ███████╗████████╗ █████╗ ████████╗███████╗
    ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██╔════╝
    ███████╗   ██║   ███████║   ██║   █████╗
    ╚════██║   ██║   ██╔══██║   ██║   ██╔══╝
    ███████║   ██║   ██║  ██║   ██║   ███████╗
    ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚══════╝
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
    buttons: {
      back: normalizeRect({
        y: 16,
        x: 16,
        width: 128,
        height: 64,
        color: 'white',
        backgroundColor: 'royalblue',
        label: 'Back',
        fontSize: 16 * dpr,
      }),
      recomputeLayout: normalizeRect({
        x: 16,
        bottom: 16,
        width: 256,
        height: 64,
        color: 'white',
        backgroundColor: 'royalblue',
        label: 'Recompute layout',
        fontSize: 12 * dpr,
      }),
    },
  }

  const currentNodeIdArray = nodeHierarchy.length ? nodeHierarchy[nodeHierarchy.length - 1].split('_') : null

  const state = {
    rawViewBox: {
      minX: 0,
      maxX: width,
      minY: 0,
      maxY: height,
    },
    globalTree: null,
    currentNodeId: currentNodeIdArray ? parseInt(currentNodeIdArray[currentNodeIdArray.length - 1]) : null,
    draggedNodeId: null,
    dragDistance: false,
    isPanning: false,
    nodes: {},
    edges: {},
    nodesArray: [],
    edgesArray: [],
    buttons: [
      { rect: drawConfiguration.buttons.back, handler: handleBackButtonClick, conditionFn: () => nodeHierarchy.length > 1 },
      { rect: drawConfiguration.buttons.recomputeLayout, handler: handleRecomputeLayoutClick, conditionFn: () => true },
    ],
  }

  /*
    ██████╗ ██████╗  █████╗ ██╗    ██╗
    ██╔══██╗██╔══██╗██╔══██╗██║    ██║
    ██║  ██║██████╔╝███████║██║ █╗ ██║
    ██║  ██║██╔══██╗██╔══██║██║███╗██║
    ██████╔╝██║  ██║██║  ██║╚███╔███╔╝
    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝
  */

  function draw() {
    _.fillStyle = drawConfiguration.backgroundColor
    _.fillRect(0, 0, width, height)

    state.nodesArray.forEach(drawNode)
    Object.entries(state.edges).forEach(([inId, outIds]) => outIds.forEach(outId => drawEdge(inId, outId)))

    state.buttons.forEach(({ conditionFn, rect }) => {
      if (conditionFn()) drawButton(rect)
    })
  }

  function drawNode(node) {
    const { x = 0, y = 0, label = '', inputs = [], outputs = [] } = node
    const { zoom, deltaX, deltaY } = getViewBox()

    const {
      radius,
      backgroundColor,
      color,
      labelFontSize,
      labelPaddingVertical,
      labelPaddingHorizontal,
      // ioSpacing,
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

    _.scale(zoom, zoom)
    _.translate(deltaX, deltaY)
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

    inputs.forEach(({ id, label }, index) => {
      let x = ioCircleHorizontalPadding + ioCircleRadius
      const y = heightCursor + index * ioHeight

      _.beginPath()
      _.arc(x, y, ioCircleRadius, 0, 2 * Math.PI)
      _.closePath()
      _.lineWidth = ioCircleStrokeWidth
      _.strokeStyle = ioCircleColor
      _.stroke()
      if (state.edgesArray.includes(id)) {
        _.fillStyle = ioCircleColor
        _.fill()
      }

      x += ioCircleRadius + ioCircleHorizontalPadding + ioLabelPadding

      _.fillStyle = color
      _.font = `${ioLabelFontSize}px ${drawConfiguration.font}`
      _.textAlign = 'left'
      _.textBaseline = 'middle'
      _.fillText(label, x, y)
    })

    outputs.forEach(({ id, label }, index) => {
      let x = width - (ioCircleHorizontalPadding + ioCircleRadius)
      const y = heightCursor + index * ioHeight

      _.beginPath()
      _.arc(x, y, ioCircleRadius, 0, 2 * Math.PI)
      _.closePath()
      _.strokeStyle = ioCircleColor
      _.lineWidth = ioCircleStrokeWidth
      _.strokeStyle = ioCircleColor
      _.stroke()
      if (state.edgesArray.includes(id)) {
        _.fillStyle = ioCircleColor
        _.fill()
      }

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
    const { zoom, deltaX, deltaY } = getViewBox()
    const { strokeWidth, strokeColor } = drawConfiguration.edge
    const { x: inX, y: inY } = findEdgeExtremityPosition(state.nodesArray, inId, drawConfiguration.node)
    const { x: outX, y: outY } = findEdgeExtremityPosition(state.nodesArray, outId, drawConfiguration.node)

    _.scale(zoom, zoom)
    _.translate(deltaX, deltaY)
    _.beginPath()
    _.moveTo(inX, inY)
    _.bezierCurveTo((inX + outX) / 2, inY, (inX + outX) / 2, outY, outX, outY)
    _.lineWidth = strokeWidth
    _.strokeStyle = strokeColor
    _.stroke()
    _.setTransform(1, 0, 0, 1, 0, 0)
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
    ██╗   ██╗██████╗ ██████╗  █████╗ ████████╗███████╗
    ██║   ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
    ██║   ██║██████╔╝██║  ██║███████║   ██║   █████╗
    ██║   ██║██╔═══╝ ██║  ██║██╔══██║   ██║   ██╔══╝
    ╚██████╔╝██║     ██████╔╝██║  ██║   ██║   ███████╗
     ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
  */

  async function updateState(globalTree) {
    const graph = parseTree(getChildTree(globalTree, state.currentNodeId), width, height)
    let { nodes } = graph
    const { edges } = graph
    const { nodes: restoredNodes, rawViewBox: restoredRawViewBox } = restoreGraph() || {}

    if (restoredNodes) {
      Object.values(restoredNodes).forEach(node => {
        nodes[node.id].x = node.x
        nodes[node.id].y = node.y
      })
      state.rawViewBox = restoredRawViewBox
    }
    else {
      const { nodes: layoutNodes, rawViewBox } = await positionGraph(nodes, edges, width, height)

      nodes = layoutNodes
      state.rawViewBox = rawViewBox
    }

    state.globalTree = globalTree
    state.nodes = nodes
    state.edges = edges
    state.nodesArray = Object.values(nodes)
    state.edgesArray = [...new Set(Object.entries(edges).flat(2))]

    persistGraph()
  }

  function goToNode(nodeId) {
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
    ██████╗ ███████╗██████╗ ███████╗██╗███████╗████████╗ █████╗ ███╗   ██╗ ██████╗███████╗
    ██╔══██╗██╔════╝██╔══██╗██╔════╝██║██╔════╝╚══██╔══╝██╔══██╗████╗  ██║██╔════╝██╔════╝
    ██████╔╝█████╗  ██████╔╝███████╗██║███████╗   ██║   ███████║██╔██╗ ██║██║     █████╗
    ██╔═══╝ ██╔══╝  ██╔══██╗╚════██║██║╚════██║   ██║   ██╔══██║██║╚██╗██║██║     ██╔══╝
    ██║     ███████╗██║  ██║███████║██║███████║   ██║   ██║  ██║██║ ╚████║╚██████╗███████╗
    ╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
  */

  const localStorageKey = `graph-${nodeHierarchy.join('/')}`

  function persistGraph() {
    const { nodes, rawViewBox } = state

    localStorage.setItem(localStorageKey, JSON.stringify({ nodes, rawViewBox }))
  }

  function restoreGraph() {
    const restoredJson = localStorage.getItem(localStorageKey)

    if (restoredJson) {
      try {
        return JSON.parse(restoredJson)
      }
      catch (error) {
        console.log('Error while parsing graph from localStorage', error)

        return null
      }
    }

    return null
  }

  function clearPersistance() {
    localStorage.removeItem(localStorageKey)
  }

  /*
    ███████╗██╗   ██╗███████╗███╗   ██╗████████╗███████╗
    ██╔════╝██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
    █████╗  ██║   ██║█████╗  ██╔██╗ ██║   ██║   ███████╗
    ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ╚════██║
    ███████╗ ╚████╔╝ ███████╗██║ ╚████║   ██║   ███████║
    ╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
  */

  function handleMouseDown(event) {
    const { zoom, deltaX, deltaY } = getViewBox()
    const x = (event.clientX - rect.left) * dpr / zoom - deltaX
    const y = (event.clientY - rect.top) * dpr / zoom - deltaY

    const clickedButton = state.buttons.find(({ rect }) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height)

    if (clickedButton) return

    const clikedNode = Object
      .values(state.nodes)
      .find(node => x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height)

    if (clikedNode) {
      state.draggedNodeId = clikedNode.id
      state.dragDistance = 0

      return
    }

    state.isPanning = true
  }

  function handleMouseUp(event) {
    state.isPanning = false

    if (state.draggedNodeId && state.dragDistance > 4) {
      state.draggedNodeId = null
      canvas.style.cursor = 'grab'

      persistGraph()

      return
    }

    let x = (event.clientX - rect.left) * dpr
    let y = (event.clientY - rect.top) * dpr

    const clickedButton = state.buttons.find(({ rect }) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height)

    if (
      clickedButton
      && typeof clickedButton.handler === 'function'
      && (typeof clickedButton.conditionFn === 'function' ? clickedButton.conditionFn(state) : true)
    ) {
      return clickedButton.handler()
    }

    const { zoom, deltaX, deltaY } = getViewBox()

    x = x / zoom - deltaX
    y = y / zoom - deltaY

    const clickedNode = state.nodesArray.find(node => x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height)

    if (clickedNode && clickedNode.type === 'FunctionDeclaration') {
      goToNode(clickedNode.id)
    }
  }

  function handleMouseEnter(event) {
    if (event.buttons !== 1) {
      state.draggedNodeId = null
      state.isPanning = false
    }
  }

  function handleMouseMove(event) {
    if (state.isPanning) {
      const { zoom } = getViewBox()

      state.rawViewBox.dX += event.movementX * dpr / zoom
      state.rawViewBox.dY += event.movementY * dpr / zoom

      return
    }

    if (state.draggedNodeId) {
      const { zoom } = getViewBox()
      const draggedNode = state.nodes[state.draggedNodeId]

      draggedNode.x += event.movementX * dpr / zoom
      draggedNode.y += event.movementY * dpr / zoom
      state.dragDistance += (Math.abs(event.movementX) + Math.abs(event.movementY)) * dpr
      canvas.style.cursor = 'grabbing'

      return
    }

    const { zoom, deltaX, deltaY } = getViewBox()
    const x = (event.clientX - rect.left) * dpr / zoom - deltaX
    const y = (event.clientY - rect.top) * dpr / zoom - deltaY

    const hoveredNode = Object
      .values(state.nodes)
      .find(node => x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height)

    canvas.style.cursor = hoveredNode ? 'grab' : 'pointer'
  }

  function handleWheel(event) {
    const { zoom, deltaX, deltaY } = getViewBox()
    const x = (event.clientX - rect.left) * dpr / zoom - deltaX
    const y = (event.clientY - rect.top) * dpr / zoom - deltaY

    console.log('event', event)
  }

  function handleBackButtonClick() {
    goToNode(nodeHierarchy[nodeHierarchy.length - 2])
  }

  function handleRecomputeLayoutClick() {
    clearPersistance()
    updateState(state.globalTree)
  }

  function registerEvents() {
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseenter', handleMouseEnter)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('wheel', handleWheel)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseenter', handleMouseEnter)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }

  /*
    ██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗ ███████╗
    ██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
    ███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝███████╗
    ██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗╚════██║
    ██║  ██║███████╗███████╗██║     ███████╗██║  ██║███████║
    ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝
  */

  function normalizeRect({ top, left, right, bottom, width: rectWidth, height: rectHeight, ...props }) {
    const _top = typeof top === 'undefined' ? height - bottom - rectHeight : top
    const _left = typeof left === 'undefined' ? width - right - rectWidth : left
    const _width = typeof width === 'undefined' ? right - _left : rectWidth
    const _height = typeof height === 'undefined' ? bottom - _top : rectHeight

    return {
      y: _top,
      x: _left,
      width: _width,
      height: _height,
      ...props,
    }
  }

  function getViewBox() {
    const { minX, maxX, minY, maxY, dX, dY, zoomRatio } = state.rawViewBox
    const zoom = Math.max(0.2, Math.min(1, zoomRatio * width / (maxX - minX), zoomRatio * height / (maxY - minY)))

    return {
      zoom,
      deltaX: ((width - (maxX - minX)) / 2 - minX) / zoom + dX,
      deltaY: ((height - (maxY - minY)) / 2 - minY) / zoom + dY,
    }
  }

  /*
    ██╗      ██████╗  ██████╗ ██████╗
    ██║     ██╔═══██╗██╔═══██╗██╔══██╗
    ██║     ██║   ██║██║   ██║██████╔╝
    ██║     ██║   ██║██║   ██║██╔═══╝
    ███████╗╚██████╔╝╚██████╔╝██║
    ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝
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
    updateTree: globalTree => nodeHierarchy.length ? updateState(globalTree) : goToNode(createId(globalTree.kind, globalTree.id)),
  }
}

function parseTree(tree) {
  const nodes = {}
  const edges = {}

  processTree(tree, nodes, edges, true)

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

function findEdgeExtremityPosition(nodesArray, id, nodeDrawConfiguration) {
  for (const node of nodesArray) {
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

  console.log('nodes', nodesArray)

  throw new Error(`Edge extremity not found: ${id}`)
}

export default handleGraphCanvas
