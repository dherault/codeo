import './Home.css'

import { useState } from 'react'
import { Button } from '@mui/material'
import Editor from '@monaco-editor/react'
import useKeys from 'react-piano-keys'

import Nodes from '../components/Nodes'
import Blocks from '../components/Blocks'
import Solids from '../components/Solids'

const defaultCode = `function sum(a, b) {
  return a + b
}

function multiply(a, b) {
  return a * b
}

function main() {
  console.log('Main')

  return sum(2, multiply(2, 3)) +  4
}`

function Home() {
  const [code, setCode] = useState(defaultCode)
  const [mode, setMode] = useState('nodes')

  useKeys(window, 'cmd+s', event => {
    event.preventDefault()
    console.log('Saved!')
  })

  return (
    <div>
      <nav className="x4 p-2">
        <Button
          variant="contained"
          onClick={() => setMode('editor')}
        >
          Editor
        </Button>
        <Button
          variant="contained"
          onClick={() => setMode('nodes')}
          className="ml-2"
        >
          Nodes
        </Button>
        <Button
          variant="contained"
          onClick={() => setMode('blocks')}
          className="ml-2"
        >
          Blocks
        </Button>
        <Button
          variant="contained"
          onClick={() => setMode('solids')}
          className="ml-2"
        >
          Solids
        </Button>
      </nav>
      <div className="position-relative">
        <Editor
          height="calc(100vh - 68.5px)"
          defaultLanguage="javascript"
          defaultValue={code}
          value={code}
          onChange={value => setCode(value)}
          theme="vs-dark"
        />
        <div
          className="position-absolute all-0 background-white y1"
          style={{
            display: mode === 'nodes' ? 'block' : 'none',
          }}
        >
          <Nodes
            code={code}
            open={mode === 'nodes'}
          />
        </div>
        <div
          className="position-absolute all-0 background-white y1"
          style={{
            display: mode === 'blocks' ? 'block' : 'none',
          }}
        >
          <Blocks />
        </div>
        <div
          className="position-absolute all-0 background-white y1"
          style={{
            display: mode === 'solids' ? 'block' : 'none',
          }}
        >
          <Solids />
        </div>
      </div>
    </div>
  )
}

export default Home
