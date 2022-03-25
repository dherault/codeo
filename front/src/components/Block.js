import './Block.css'

function Block({ label, active, onClick = null }) {
  return (
    <div
      onClick={onClick}
      className={`y2 no-select cursor-pointer block ${active ? 'block-active' : ''}`}
    >
      <div className="block-pin block-pin-top" />
      <div className="x5">
        <div className="block-pin block-pin-left" />
        <div
          className="block-body x5 p-2"
        >
          {label}
        </div>
        <div
          className="block-pin block-pin-right z-index-1000"
        />
      </div>
      <div
        className="block-pin block-pin-bottom z-index-1000"
      />
    </div>
  )
}

export default Block
