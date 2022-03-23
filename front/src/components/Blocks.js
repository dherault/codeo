import './Blocks.css'

import { useRef, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

import Block from './Block'

const allBlocks = {
  0: [
    {
      type: 'number',
      poly: true,
    },
  ],
  1: [
    {
      type: 'number',
      poly: true,
    },
  ],
  2: [
    {
      type: 'number',
      poly: true,
    },
  ],
  12: [
    {
      type: 'number',
      poly: true,
    },
  ],
  var1: [
    {
      type: 'any',
      poly: true,
    },
  ],
  var2: [
    {
      type: 'any',
      poly: true,
    },
  ],
  var3: [
    {
      type: 'any',
      poly: true,
    },
  ],
  var4: [
    {
      type: 'any',
      poly: true,
    },
  ],
  var5: [
    {
      type: 'any',
      poly: true,
    },
  ],
  repeat: [
    {
      type: 'block',
    },
  ],
  wait: [
    {
      type: 'number',
    },
  ],
  waitUntil: [
    {
      type: 'bool',
    },
  ],
  if: [
    {
      type: 'cond',
    },
    {
      type: 'block',
    },
  ],
  else: [
    {
      type: 'block',
    },
  ],
  ':=': [
    {
      type: 'any',
      before: true,
    },
    {
      type: 'any',
    },
  ],
  def: [
    {
      type: 'string',
    },
    {
      type: 'any',
      multiple: true,
    },
  ],
  return: [
    {
      type: 'any',
    },
  ],
  '+': [
    {
      type: 'number',
      before: true,
    },
    {
      type: 'number',
    },
  ],
  '-': [
    {
      type: 'number',
      before: true,
    },
    {
      type: 'number',
    },
  ],
  '*': [
    {
      type: 'number',
      before: true,
    },
    {
      type: 'number',
    },
  ],
  '%': [
    {
      type: 'number',
      before: true,
    },
    {
      type: 'number',
    },
  ],
  '/': [
    {
      type: 'number',
      before: true,
    },
    {
      type: 'number',
    },
  ],
  '>': [
    {
      type: 'number',
      before: true,
    },
    {
      type: 'number',
    },
  ],
  '<': [
    {
      type: 'number',
      before: true,
    },
    {
      type: 'number',
    },
  ],
  '=': [
    {
      type: 'number',
      before: true,
    },
    {
      type: 'number',
    },
  ],
  '!': [
    {
      type: 'any',
    },
  ],
  '(': [
    {
      type: 'any',
    },
  ],
  ')': [
    {
      type: 'any',
    },
  ],
  OR: [
    {
      type: 'any',
      before: true,
    },
    {
      type: 'any',
    },
  ],
  AND: [
    {
      type: 'any',
      before: true,
    },
    {
      type: 'any',
    },
  ],
  log: [
    {
      type: 'any',
      multiple: true,
    },
  ],
}

const defaultBlocks = { 0.043985342706571284: { id: 0.043985342706571284, name: ':=', position: { x: 627, y: 218.5 } }, 0.1616928425659918: { id: 0.1616928425659918, name: 'var1', position: { x: 691, y: 218.5 } }, 0.4641735949301844: { id: 0.4641735949301844, name: '0', position: { x: 755, y: 218.5 } }, 0.4741428079176202: { id: 0.4741428079176202, name: 'repeat', position: { x: 627, y: 282.5 } }, 0.7950606067832429: { id: 0.7950606067832429, name: 'wait', position: { x: 691, y: 282.5 } }, 0.9576366282118303: { id: 0.9576366282118303, name: '1', position: { x: 755, y: 282.5 } }, 0.17621875726405478: { id: 0.17621875726405478, name: 'if', position: { x: 691, y: 346.5 } }, 0.65259653291284: { id: 0.65259653291284, name: 'var1', position: { x: 755, y: 346.5 } }, 0.6348973701330722: { id: 0.6348973701330722, name: '%', position: { x: 819, y: 346.5 } }, 0.5399981213947833: { id: 0.5399981213947833, name: '2', position: { x: 883, y: 346.5 } }, 0.10986294814595499: { id: 0.10986294814595499, name: '=', position: { x: 947, y: 346.5 } }, 0.032340719549405206: { id: 0.032340719549405206, name: '0', position: { x: 1011, y: 346.5 } }, 0.3866079406001828: { id: 0.3866079406001828, name: 'log', position: { x: 755, y: 410.5 } }, 0.3266437319709814: { id: 0.3266437319709814, name: 'var1', position: { x: 819, y: 410.5 } } }
const blockSize = 64
const snapThreshold = blockSize / 8

function Blocks() {
  const canvasRef = useRef()
  const [blocks, setBlocks] = useState({})
  const [selectedBlockIds, setSelectedBlockIds] = useState([])
  const [movingBlockMetadata, setMovingBlockMetadata] = useState(null)
  const [newBlockPosition, setNewBlockPosition] = useState(null)
  const [selection, setSelection] = useState(null)

  function addNewBlock(name) {
    const id = Math.random()

    setBlocks({
      ...blocks,
      [id]: {
        id,
        name,
        position: newBlockPosition,
      },
    })
    setNewBlockPosition(null)
  }

  function handleExport() {
    navigator.clipboard.writeText(JSON.stringify(blocks))

    console.log('Data copied to clipboard!')
  }

  function handleImport() {
    setBlocks(defaultBlocks)
    setSelectedBlockIds([])
    setMovingBlockMetadata(null)
    setNewBlockPosition(null)
    setSelection(null)
  }

  function handleReset() {
    setBlocks({})
    setSelectedBlockIds([])
    setMovingBlockMetadata(null)
    setNewBlockPosition(null)
    setSelection(null)
  }

  function handleClick(event) {
    console.log('event.target', event.target === event.currentTarget)
    if (event.currentTarget !== canvasRef.current) return

    if (computeSelectionDiagonal(selection) < 1 && !selectedBlockIds.length) {
      setNewBlockPosition(getEventPosition(event))
    }
    else {
      // setSelectedBlockIds([])
    }
    setSelection(null)
  }

  function handleMouseDown(event) {
    const position = getEventPosition(event)

    if (!Object.values(blocks).find(block => isPointInBlock(position, block))) {
      setSelection({ start: position, end: position })
    }
  }

  function handleMouseUp(event) {
    // event.stopPropagation()
    setMovingBlockMetadata(null)
  }

  function handleMouseMove(event) {
    if (selection) {
      const nextSelection = {
        ...selection,
        end: getEventPosition(event),
      }

      setSelection(nextSelection)

      const { start, end } = nextSelection

      setSelectedBlockIds(
        Object.values(blocks).reduce(
          (nextBlockIds, block) => {
            const isInSelection = block.position.x >= start.x && block.position.x <= end.x && block.position.y >= start.y && block.position.y <= end.y

            return isInSelection ? [...nextBlockIds, block.id] : nextBlockIds
          },
          []
        )
      )

      return
    }

    if (!movingBlockMetadata) return

    const { clientX, clientY } = event
    const position = snapPosition({
      x: clientX + movingBlockMetadata.offsetX,
      y: clientY + movingBlockMetadata.offsetY,
    }, movingBlockMetadata.id)

    if (isCloseToClear(position)) {
      const nextBlocks = { ...blocks }

      delete nextBlocks[movingBlockMetadata.id]

      setBlocks(nextBlocks)
      setMovingBlockMetadata(null)
    }
    else {
      setBlocks({
        ...blocks,
        [movingBlockMetadata.id]: {
          ...blocks[movingBlockMetadata.id],
          position,
        },
      })
    }
  }

  function handleBlockClick(event, block) {
    event.stopPropagation()
  }

  function handleBlockMouseDown(event, block) {
    setMovingBlockMetadata({
      id: block.id,
      offsetX: block.position.x - event.clientX,
      offsetY: block.position.y - event.clientY,
    })
  }

  function handleBlockMouseUp(event, block) {
    event.stopPropagation()
    setMovingBlockMetadata(null)
  }

  function handleNewBlockModalClose() {
    setNewBlockPosition(null)
  }

  function getEventPosition(event) {
    const { left, top } = canvasRef.current.getBoundingClientRect()

    return {
      x: event.clientX - left,
      y: event.clientY - top,
    }
  }

  function isPointInBlock({ x, y }, block) {
    return x >= block.position.x && x <= block.position.x + blockSize && y >= block.position.y && y <= block.position.y + blockSize
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

  function isCloseToClear({ x, y }) {
    const { width } = canvasRef.current.getBoundingClientRect()

    return x > width - 96 && y < 32
  }

  function computeSelectionDiagonal(selection) {
    if (!selection) return 0

    const { start, end } = selection

    return Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2)
  }

  return (
    <div className="x4s h100 position-relative">
      <div
        ref={canvasRef}
        className="flex-grow blocks-canvas position-relative"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      >
        {Object.values(blocks).map(block => (
          <div
            key={block.id}
            onClick={event => handleBlockClick(event, block)}
            onMouseDown={event => handleBlockMouseDown(event, block)}
            onMouseUp={event => handleBlockMouseUp(event, block)}
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
        {!!movingBlockMetadata && (
          <div className="position-absolute top-0 right-0 p-1 x5">
            <CloseIcon />
          </div>
        )}
        {!!selection && (
          <div
            className="position-absolute blocks-selection"
            style={{ top: selection.start.y, left: selection.start.x, width: selection.end.x - selection.start.x, height: selection.end.y - selection.start.y }}
          />
        )}
      </div>
      <div className="position-absolute top-0 left-0 p-2">
        <Button
          variant="contained"
          onClick={handleExport}
        >
          Export
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          className="ml-2"
        >
          Import
        </Button>
        <Button
          variant="contained"
          onClick={handleReset}
          className="ml-2"
        >
          Reset
        </Button>
      </div>
      <Dialog
        open={!!newBlockPosition}
        onClose={handleNewBlockModalClose}
        maxWidth="md"
      >
        <DialogTitle>Add a new block</DialogTitle>
        <DialogContent className="x11">
          {Object.keys(allBlocks).map(blockName => (
            <div
              className="mb-2 mr-2 x5"
              key={blockName}
            >
              <Block
                label={blockName}
                onClick={() => addNewBlock(blockName)}
              />
            </div>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewBlockModalClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default Blocks
