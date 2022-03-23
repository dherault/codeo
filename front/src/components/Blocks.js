import './Blocks.css'

import { useRef, useState } from 'react'

import Block from './Block'

const allBlocks = {
  '.': [0],
  0: [0],
  1: [0],
  2: [0],
  var1: [0],
  var2: [0],
  var3: [0],
  var4: [0],
  repeat: [2],
  wait: [1, 2],
  waitUntil: [1],
  if: [2, 3],
  then: [2, 3],
  else: [2, 3],
  set: [2],
  def: [2],
  return: [1],
  '+': [2],
  '-': [2],
  '*': [2],
  '%': [2],
  '/': [2],
  '>': [2],
  '<': [2],
  '=': [2],
  '!': [1],
  '(': [1],
  ')': [1],
  OR: [2],
  AND: [2],
  log: [1],
}
const blockSize = 64
const snapThreshold = blockSize / 8

function Blocks() {
  const canvasRef = useRef()
  const [selectedBlockIds, setSelectedBlockIds] = useState([])
  const [movingBlockMetadata, setMovingBlockMetadata] = useState(null)
  const [blocks, setBlocks] = useState({})

  function addBlock(name) {
    const id = Math.random()

    setBlocks({
      ...blocks,
      [id]: {
        id,
        name,
        position: { x: 0, y: 0 },
      },
    })
  }

  function handleBlockClick(block) {
    // setSelectedBlockIds([block.id])
  }

  function handleBlockMouseDown(event, block) {

    console.log('block', block)
    setMovingBlockMetadata({
      id: block.id,
      offsetX: block.position.x - event.clientX,
      offsetY: block.position.y - event.clientY,
    })

    console.log('block.id', block.id)
  }

  function handleMouseDown(event) {
    //
  }

  function handleMouseUp() {
    setMovingBlockMetadata(null)
  }

  function handleMouseMove(event) {
    if (!movingBlockMetadata) return

    const { clientX, clientY } = event
    const position = snapPosition({
      x: clientX + movingBlockMetadata.offsetX,
      y: clientY + movingBlockMetadata.offsetY,
    }, movingBlockMetadata.id)

    setBlocks({
      ...blocks,
      [movingBlockMetadata.id]: {
        ...blocks[movingBlockMetadata.id],
        position,
      },
    })
  }

  function snapPosition({ x, y }, excludeBlockId) {
    const snappableBlocks = Object.values(blocks).filter(({ id }) => id !== excludeBlockId)

    const potentialSnapMetadata = [
      { dx: blockSize, dy: 0 },
      { dx: 0, dy: blockSize },
      { dx: -blockSize, dy: 0 },
      { dx: 0, dy: -blockSize },
    ]
    .map(({ dx, dy }) => snappableBlocks
      .filter(({ position }) => Math.abs(position.x + dx - x) <= snapThreshold && Math.abs(position.y + dy - y) <= snapThreshold)
      .map(({ position }) => ({
        centerX: position.x + blockSize / 2,
        centerY: position.y + blockSize / 2,
        x: position.x + dx,
        y: position.y + dy,
      }))
    )
    .flat()

    if (!potentialSnapMetadata.length) return { x, y }

    const center = { x: x + blockSize / 2, y: y + blockSize / 2 }
    const closest = potentialSnapMetadata.reduce((closest, snapPosition) => {
      const distance = Math.sqrt((center.x - snapPosition.centerX) ** 2 + (center.y - snapPosition.centerY) ** 2)

      return distance < closest.distance ? { distance, snapPosition } : closest
    }, { distance: Infinity, snapCenter: null })

    return {
      x: closest.snapPosition.x,
      y: closest.snapPosition.y,
    }
  }

  return (
    <div className="x4s">
      <div className="px-2 flex-shrink">
        {Object.keys(allBlocks).map(name => (
          <div
            key={name}
            className="mb-2 x1"
            onClick={() => addBlock(name)}
          >
            <Block label={name} />
          </div>
        ))}
      </div>
      <div
        ref={canvasRef}
        className="flex-grow blocks-canvas position-relative"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {Object.values(blocks).map(block => (
          <div
            key={block.id}
            onClick={() => handleBlockClick(block)}
            onMouseDown={event => handleBlockMouseDown(event, block)}
            className="position-absolute x5"
            style={{
              top: block.position.y,
              left: block.position.x,
            }}
          >
            <Block
              active={selectedBlockIds.includes(block.id)}
              label={block.name}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Blocks
