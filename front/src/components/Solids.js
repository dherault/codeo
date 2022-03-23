import { useEffect, useRef } from 'react'
import * as THREE from 'three'
// import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import { GUI } from 'dat.gui'

import tetrahedron from '../data/tetrahedron.json'
import elongatedSquareCupola from '../data/elongated square cupola.json'

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

    scene.add(createMesh(tetrahedron, { x: 0, y: 0, z: 0 }))
    scene.add(createMesh(elongatedSquareCupola, { x: 4, y: 0, z: 0 }))
  }

  function createMesh(data, position) {
    const face0 = data.faces[0]
    const triangle = new THREE.Triangle(
      new THREE.Vector3(...data.vertices[face0[0]]),
      new THREE.Vector3(...data.vertices[face0[1]]),
      new THREE.Vector3(...data.vertices[face0[2]]),
    )
    const normal = triangle.getNormal(new THREE.Vector3())

    const geometry = new THREE.PolyhedronBufferGeometry(data.vertices.flat(), data.faces.flat(), 1, 0)

    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 })

    const mesh = new THREE.Mesh(geometry, material)

    mesh.up.set(normal.x, normal.y, normal.z)
    mesh.position.set(position.x, position.y, position.z)
    mesh.lookAt(0, 1, 0)

    return mesh
  }

  function onWindowResize() {
    const { width, height } = element.getBoundingClientRect()

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
  }

  function drawGui() {
    // const gui = new GUI()
    // const meshFolder = gui.addFolder('Cube')
    // // meshFolder.add(mesh.rotation, 'x', 0, Math.PI * 2)
    // // meshFolder.add(mesh.rotation, 'y', 0, Math.PI * 2)
    // // meshFolder.add(mesh.rotation, 'z', 0, Math.PI * 2)
    // meshFolder.open()
    // const cameraFolder = gui.addFolder('Camera')
    // cameraFolder.add(camera.position, 'z', 0, 10)
    // cameraFolder.open()
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
