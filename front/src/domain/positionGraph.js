function positionGraph(nodes, edges, width, height) {
  Object.values(nodes).forEach(node => {
    node.x = Math.random() * (width - 250)
    node.y = Math.random() * (height - 250)
  })
}

export default positionGraph
