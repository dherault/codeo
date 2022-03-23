import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'dat.gui'

function Solids() {
  const containerRef = useRef()

  useEffect(() => runCanvas(containerRef.current), [])

  return (
    <div
      ref={containerRef}
      className="w100 h100"
    />
  )
}

function runCanvas(element) {
  if (element.children.length) return

  let camera
  let scene
  let renderer
  let controls
  let directionalLight
  let stopped = false

  const state = {
    isSelectingFaces: false,
  }

  init()
  drawGui()
  animate()

  function init() {
    const { width, height } = element.getBoundingClientRect()

    camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000)
    camera.position.set(0, 2, 10)

    scene = new THREE.Scene()

    const light = new THREE.AmbientLight(0x404040) // soft white light
    scene.add(light)
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.75)
    scene.add(directionalLight)

    const gridHelper = new THREE.GridHelper(16, 16, '#bbb', '#bbb')
    scene.add(gridHelper)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setClearColor(0x000000, 0)
    // renderer.shadowMap.enabled = true
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    element.appendChild(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement)

    window.addEventListener('resize', onWindowResize)

    loadMesh('/solids/tetrahedron.obj', { x: 0, y: 0, z: 0 })
    loadMesh('/solids/elongated square cupola.obj', { x: 4, y: 0, z: 0 })
  }

  function loadMesh(url, position) {
    const loader = new OBJLoader()

    loader.load(url, mesh => {
      mesh.position.set(position.x, position.y, position.z)
      mesh.lookAt(0, 1, 0)

      scene.add(mesh)
    })
  }

  function onWindowResize() {
    const { width, height } = element.getBoundingClientRect()

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
  }

  function drawGui() {
    const gui = new GUI()
    gui.add(state, 'isSelectingFaces').onChange(value => state.isSelectingFaces = value)
  }

  function animate() {
    if (stopped) return

    controls.update()
    renderer.render(scene, camera)
    directionalLight.position.copy(camera.position)

    requestAnimationFrame(animate)
  }

  return () => stopped = true
}

export default Solids
