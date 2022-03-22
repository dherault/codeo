import { useEffect, useRef, useState } from 'react'

import getCanvasDpr from '../utils/getCanvasDpr'

function Nodes({ code, open }) {
  const [updateTree, setUpdateTree] = useState(() => () => {})
  const canvasRef = useRef()

  useEffect(() => {
    const { stop, updateTree } = handleCanvas(canvasRef.current)

    setUpdateTree(updateTree)

    return stop
  }, [open])

  useEffect(() => {
    updateTree([])
  }, [updateTree, code])

  return (
    <canvas
      ref={canvasRef}
      className="flex-grow"
    />
  )
}

function handleCanvas(canvas) {
  const _ = canvas.getContext('2d')
  const { width, height } = canvas.getBoundingClientRect()

  const dpr = getCanvasDpr(_)
  let stopped = false

  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight

  _.scale(dpr, dpr)

  const state = {}

  function draw() {
    _.fillStyle = '#eee'
    _.fillRect(0, 0, width, height)
  }

  function step() {
    draw()

    if (stopped) return

    requestAnimationFrame(step)
  }

  requestAnimationFrame(step)

  return {
    stop: () => stopped = true,
  }
}

export default Nodes
