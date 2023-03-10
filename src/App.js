import React, { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";
import './styles.css'

const App = () => {
  const [moveableComponents, setMoveableComponents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [images, setimages] = useState([])

  useEffect(() => {
    /* Fetching the images from the API and setting them in the state. */
    fetch('https://jsonplaceholder.typicode.com/photos')
      .then(res => res.json())
      .then(data => setimages(data))
  }, [])

  const deleteItem = (id) => {
    /* Filtering the array of components and removing the component with the id that was passed as a
    parameter. */
    setMoveableComponents(moveableComponents.filter(item => item.id !== id));
  }

  const addMoveable = () => {
    // Create a new moveable component and add it to the array
    const COLORS = ["red", "blue", "yellow", "green", "purple"];
    const FITS = ["cover", "fill", "contain", "none", "scale-down"]

    /* Adding a new component to the array of components. */
    setMoveableComponents([
      ...moveableComponents,
      {
        id: Math.floor(Math.random() * Date.now()),
        top: 0,
        left: 0,
        width: 100,
        height: 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        updateEnd: true,
        objectFit: FITS[Math.floor(Math.random() * FITS.length)],
        src: images[Math.floor(Math.random() * images.length)].url,
      },
    ]);
  };

  const updateMoveable = (id, newComponent, updateEnd = false) => {
    /* Updating the state of the component. */
    const updatedMoveables = moveableComponents.map((moveable, i) => {
      if (moveable.id === id) {
        return { id, ...newComponent, updateEnd };
      }
      return moveable;
    });
    setMoveableComponents(updatedMoveables);
  };

  const handleResizeStart = (index, e) => {
    console.log("e", e.direction);
    // Check if the resize is coming from the left handle
    const [handlePosX, handlePosY] = e.direction;
    // 0 => center
    // -1 => top or left
    // 1 => bottom or right

    // -1, -1
    // -1, 0
    // -1, 1
    if (handlePosX === -1) {
      console.log("width", moveableComponents, e);
      // Save the initial left and width values of the moveable component
      const initialLeft = e.left;
      const initialWidth = e.width;

      // Set up the onResize event handler to update the left value based on the change in width
    }
  };

  return (
    <main style={{ backgroundColor: '#E9E9E9', height: "100vh", width: "100vw", display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <button onClick={addMoveable}>Add Moveable +</button>
      <div
        id="parent"
        style={{
          position: "relative",
          background: "#282929",
          height: "80vh",
          width: "80vw",
        }}
      >
        {moveableComponents.map((item, index) => (
          <Component
            {...item}
            key={index}
            updateMoveable={updateMoveable}
            handleResizeStart={handleResizeStart}
            setSelected={setSelected}
            isSelected={selected === item.id}
            deleteItem={deleteItem}
          />
        ))}
      </div>
    </main>
  );
};

export default App;

const Component = ({
  updateMoveable,
  top,
  left,
  width,
  height,
  index,
  color,
  id,
  setSelected,
  isSelected = false,
  updateEnd,
  src,
  objectFit,
  deleteItem
}) => {

  const ref = useRef();

  const [nodoReferencia, setNodoReferencia] = useState({
    top,
    left,
    width,
    height,
    index,
    color,
    src,
    id,
  });
  const [frame, setFrame] = React.useState({
    translate: [0, 0],
  });

  let parent = document.getElementById("parent");
  let parentBounds = parent?.getBoundingClientRect();

  const onDrag = async (e) => {

    console.log('DRAG_TOP', top)
    console.log('HEIGHT', height)
    // console.log('PARENT', parentBounds)
    console.log(e.top >= parentBounds.height - height)

    /* Preventing the component from going out of the parent container. */
    updateMoveable(id, {
      top: e.top >= parentBounds.height - height || e.top <= 0 ? top : e.top,
      left: e.left <= 0 || e.left >= parentBounds.width - width ? left : e.left,
      width,
      height,
      src,
      objectFit
    }, true);
  }

  const onResize = async (e) => {

    console.log(e)
    // ACTUALIZAR ALTO Y ANCHO
    let newWidth = e.width;
    let newHeight = e.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    /* Preventing the component from going out of the parent container. */
    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    updateMoveable(id, {
      top,
      left,
      width: newWidth,
      height: newHeight,
      src,
      objectFit
    }, true);

    // ACTUALIZAR NODO REFERENCIA
    const beforeTranslate = e.drag.beforeTranslate;
    ref.current.style.width = `${e.width}px`;
    ref.current.style.height = `${e.height}px`;

    let translateX = beforeTranslate[0];
    let translateY = beforeTranslate[1];

    console.log(e.drag)

    frame.translate = beforeTranslate;

    ref.target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px)`;

    setNodoReferencia({
      ...nodoReferencia,
      translateX,
      translateY,
      top: top + translateY < 0 ? 0 : top + translateY,
      left: left + translateX < 0 ? 0 : left + translateX,
    });
  };

  const onResizeEnd = async (e) => {
    let newWidth = e.lastEvent?.width;
    let newHeight = e.lastEvent?.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    const { lastEvent } = e;
    const { drag } = lastEvent;
    const { beforeTranslate } = drag;

    const absoluteTop = top;
    const absoluteLeft = left;

    updateMoveable(
      id,
      {
        top: absoluteTop,
        left: absoluteLeft,
        width: newWidth,
        height: newHeight,
        src,
        objectFit
      },
      true
    );
  };

  return (
    <>
      <div
        ref={ref}
        className="draggable"
        id={"component-" + id}
        style={{
          position: "absolute",
          top: top,
          left: left,
          width: width,
          height: height,
          background: ` url(${src})`,
          backgroundSize: objectFit
        }}
        onClick={() => setSelected(id)}
      >
        <div style={{ position: 'relative' }}>
          <span onClick={() => deleteItem(id)} style={{ position: 'absolute', top: 2, right: 2, cursor: 'pointer' }}>
            Eliminar
          </span>
        </div>
      </div>

      <Moveable
        target={isSelected && ref.current}
        resizable
        draggable
        onDrag={onDrag}
        onResizeStart={e => {
          e.setOrigin(["%", "%"]);
          e.dragStart && e.dragStart.set(frame.translate);
        }}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        keepRatio={false}
        throttleResize={1}
        renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
        edge={false}
        zoom={1}
        origin={false}
        padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
      />
    </>
  );
};
