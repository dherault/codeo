import './Home.css'

import { useState } from 'react'
import { Button } from '@mui/material'
import Editor from '@monaco-editor/react'

import Nodes from '../components/Nodes'

const defaultCode = `function sum(a, b) {
  return a + b
}`

function Home() {
  const [code, setCode] = useState(defaultCode)
  const [mode, setMode] = useState('nodes')

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
      </div>
    </div>
  )
}

export default Home
