import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'urql'

import handleGraphCanvas from '../domain/handleGraphCanvas'

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
    const { stop, updateTree } = handleGraphCanvas(canvasRef.current)

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

export default Nodes
