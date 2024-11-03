'use client'
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs/bundled/rough.esm";
import DrawingBoard from './DrawingBoard';
import {
  createElement,
  drawElement,
} from './element-utils';
import { createPointerHandlers } from './handlePointer';
import { createMouseHandlers } from './handleMouse';

const useHistory = initialState => {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([initialState]);

  const setState = (action, overwrite = false) => {
    const newState = typeof action === "function" ? action(history[index]) : action;
    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      const updatedState = [...history].slice(0, index + 1);
      setHistory([...updatedState, newState]);
      setIndex(prevState => prevState + 1);
    }
  };

  const undo = () => index > 0 && setIndex(prevState => prevState - 1);
  const redo = () => index < history.length - 1 && setIndex(prevState => prevState + 1);

  return [history[index], setState, undo, redo];
};

const usePressedKeys = () => {
  const [pressedKeys, setPressedKeys] = useState(new Set());

  useEffect(() => {
    const handleKeyDown = event => {
      setPressedKeys(prevKeys => new Set(prevKeys).add(event.key));
    };

    const handleKeyUp = event => {
      setPressedKeys(prevKeys => {
        const updatedKeys = new Set(prevKeys);
        updatedKeys.delete(event.key);
        return updatedKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return pressedKeys;
};

const App = () => {
  const [elements, setElements, undo, redo] = useHistory([]);
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("rectangle");
  const [selectedElement, setSelectedElement] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPanMousePosition, setStartPanMousePosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [scaleOffset, setScaleOffset] = useState({ x: 0, y: 0 });
  const [captureArea, setCaptureArea] = useState(null);
  const [drawingRegions, setDrawingRegions] = useState([]);
  const textAreaRef = useRef();
  
  const pressedKeys = usePressedKeys();
  const [pencilSize, setPencilSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const handleDetectRegions = () => {
    const canvas = document.getElementById("canvas");
    if (!canvas) return;
    
    const newRegions = detectRegions(canvas, elements, panOffset, scale, scaleOffset);
    setDrawingRegions(newRegions);
  
    // Notify user
    if (newRegions.length > 0) {
      console.log(`Phát hiện ${newRegions.length} vùng vẽ!`);
      alert(`Đã phát hiện ${newRegions.length} vùng vẽ!`);
    } else {
      alert("Không phát hiện được vùng vẽ nào!");
    }
  };
  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    const roughCanvas = rough.canvas(canvas);
   
    // Clear canvas for redrawing
    context.clearRect(0, 0, canvas.width, canvas.height);
  
    // Calculate scaled dimensions
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    const scaleOffsetX = (scaledWidth - canvas.width) / 2;
    const scaleOffsetY = (scaledHeight - canvas.height) / 2;
    setScaleOffset({ x: scaleOffsetX, y: scaleOffsetY });
  
    context.save();
    context.translate(panOffset.x * scale - scaleOffsetX, panOffset.y * scale - scaleOffsetY);
    context.scale(scale, scale);
  
    // Draw elements
    elements.forEach(element => {
      if (action === "writing" && selectedElement?.id === element.id) return;
      drawElement(roughCanvas, context, element);
    });
  
    // Call drawBoundingBoxes to render detected regions
    
    context.restore();
  }, [elements, action, selectedElement, panOffset, scale, drawingRegions]);
  

  useEffect(() => {
    const undoRedoFunction = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    document.addEventListener("keydown", undoRedoFunction);
    return () => {
      document.removeEventListener("keydown", undoRedoFunction);
    };
  }, [undo, redo]);
  useEffect(() => {
    const panOrZoomFunction = event => {
      if (pressedKeys.has("Meta") || pressedKeys.has("Control")) {
        event.preventDefault();
        if (event.deltaY < 0) {
          onZoom(0.1);
        } else {
          onZoom(-0.1);
        }
      } else {
        setPanOffset(prevState => ({
          x: prevState.x - event.deltaX,
          y: prevState.y - event.deltaY,
        }));
      }
    };
    const preventZoom = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '=' || e.key === '+')) {
        e.preventDefault();
        if (e.key === '-') {
          onZoom(-0.1);
        } else if (e.key === '=' || e.key === '+') {
          onZoom(0.1);
        }
      }
    };
    document.addEventListener("wheel", panOrZoomFunction, { passive: false });
    document.addEventListener('keydown', preventZoom);
    return () => {
      document.removeEventListener("wheel", panOrZoomFunction);
      document.removeEventListener('keydown', preventZoom);
    };
  }, [pressedKeys]);  
  const onZoom = delta => {
    setScale(prevState => Math.min(Math.max(prevState + delta, 0.1), 2));
  };
  const handleDownloadRegions = () => {
    const canvas = document.getElementById("canvas");
    if (!canvas || drawingRegions.length === 0) {
      alert("Không có vùng vẽ nào để tải xuống!");
      return;
    }
    
    downloadAllRegions(canvas, drawingRegions, elements, scale, panOffset, scaleOffset);
    alert(`Đã tải xuống ${drawingRegions.length} vùng vẽ!`);
  };
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = createPointerHandlers({
    action,
    setAction,
    tool,
    setTool,
    elements,
    setElements,
    selectedElement,
    setSelectedElement,
    panOffset,
    setPanOffset,
    scale,
    scaleOffset,
    startPanMousePosition,
    setStartPanMousePosition,
    pressedKeys,
    pencilSize,
    setCaptureArea,
    isDrawing,
    setIsDrawing
  });
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleBlur
  } = createMouseHandlers({
    action,
    setAction,
    tool,
    setTool,
    elements,
    setElements,
    selectedElement,
    setSelectedElement,
    panOffset,
    setPanOffset,
    scale,
    scaleOffset,
    startPanMousePosition,
    setStartPanMousePosition,
    pressedKeys,
    pencilSize,
    setCaptureArea,
    isDrawing,
    setIsDrawing
  });

  return (
    
    <DrawingBoard
      tool={tool}
      setTool={setTool}
      elements={elements}
      pencilSize={pencilSize}
      setPencilSize={setPencilSize}
      scale={scale}
      setScale={setScale}
      onZoom={onZoom}
      undo={undo}
      redo={redo}
      action={action}
      selectedElement={selectedElement}
      panOffset={panOffset}
      scaleOffset={scaleOffset}
      handlePointerDown={handlePointerDown}
      handlePointerMove={handlePointerMove}
      handlePointerUp={handlePointerUp}
      handleMouseDown={handleMouseDown}
      handleMouseUp={handleMouseUp}
      handleMouseMove={handleMouseMove}
      handleBlur={handleBlur}
    />
  );
};

export default App;