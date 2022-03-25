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
  let raycaster
  let gridHelper
  let arrowHelper
  let stopped = false

  const mouse = new THREE.Vector2()
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
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    scene.add(directionalLight)

    gridHelper = new THREE.GridHelper(16, 16, '#bbb', '#bbb')
    scene.add(gridHelper)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setClearColor(0x000000, 0)
    // renderer.shadowMap.enabled = true
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    element.appendChild(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement)

    raycaster = new THREE.Raycaster()

    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(1, 2, 0), new THREE.Vector3(0, 0, 0), 4, 0xffff00)
    scene.add(arrowHelper)

    window.addEventListener('resize', onWindowResize)
    element.addEventListener('click', onClick, false)

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

  function onClick(event) {
    // if (!state.isSelectingFaces) return

    event.preventDefault()

    const { width, height, top, left } = element.getBoundingClientRect()

    mouse.x = (event.clientX - left) / width * 2 - 1
    mouse.y = -(event.clientY - top) / height * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(scene.children)

    intersects.forEach(intersection => {
      const { object, face, point } = intersection

      if (object.type !== 'Mesh') return

      // console.log('face', face)
      // console.log('object', object)

      const n = face.normal.clone()

      n.transformDirection(object.matrixWorld)

      object.up = n
      object.updateMatrix()

      arrowHelper.setDirection(n)

      const position = object.getWorldPosition(new THREE.Vector3())
      const lookAt = (new THREE.Vector3(0, 1, 0)).add(position)
      // lookAt.transformDirection(object.matrixWorld)
        // object.up.set(lookAt.x, lookAt.y, lookAt.z)

      object.lookAt(lookAt)

      // console.log('object.rotation', object.rotation)
    })
    // if (intersects.length > 0) {
    //   const intersection = intersects[0]

    //   // object.geometry.faces[faceIndex].color.set(0xff0000)
    //   // object.geometry.colorsNeedUpdate = true
    // }
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
