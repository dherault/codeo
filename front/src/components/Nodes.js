import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from 'urql'

import handleGraphCanvas from '../domain/handleGraphCanvas'

const NodesQuery = `
  query NodesQuery ($code: String!) {
    codeToAst(code: $code)
  }
`

function Nodes({ code, open }) {
  const canvasRef = useRef()
  const [updateTree, setUpdateTree] = useState(() => () => {})
  const [queryResult] = useQuery({
    query: NodesQuery,
    variables: { code },
  })
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const nodeHierarchy = pathname.slice('/'.length).split('/').filter(x => !!x)
    const updateNodeHierarchy = nodeHierarchy => navigate(`/${nodeHierarchy.join('/')}`)
    const { stop, updateTree } = handleGraphCanvas(canvasRef.current, nodeHierarchy, updateNodeHierarchy)

    setUpdateTree(() => updateTree)

    return stop
  }, [open, pathname, navigate])

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
