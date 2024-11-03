import React, { useState, useEffect, useRef } from 'react';
import {  Pencil, Hand, Square, Eraser,Sun, Moon,ZoomIn,ZoomOut,Grid,Minus,RotateCcw,Scan,Download,Menu,X,Ruler,Settings,Keyborad, Heart, MoreHorizontal
} from 'lucide-react';
import { Pencil1Icon , EraserIcon, CursorArrowIcon, HamburgerMenuIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import MenuComponent from './menu';
import ToolToggleGroup from './toolbar';



const isLocalStorageAvailable = () => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

const safeGetItem = (key, defaultValue) => {
  if (!isLocalStorageAvailable()) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
    return defaultValue;
  }
};

const safeSetItem = (key, value) => {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing ${key} to localStorage:`, e);
  }
};


const DrawingBoard = ({ tool,
  setTool,
  elements,
  pencilSize,
  setPencilSize,
  scale,
  setScale,
  onZoom,
  action,
  selectedElement,
  panOffset,
  scaleOffset,handlePointerDown,
  handlePointerMove,handlePointerUp,
  handleBlur,captureDrawnArea
}) => {
  const textAreaRef = React.useRef(null);
  const backgroundCanvasRef = React.useRef(null);
  const drawingCanvasRef = React.useRef(null);
  const [backgroundType, setBackgroundType] = React.useState('none');
  const [gridSize, setGridSize] = React.useState(45);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showDownloadButton, setShowDownloadButton] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);
  const [pencilColor, setPencilColor] = React.useState('#ffffff');
  const getDefaultColor = () => darkMode ? '#ffffff' : '#000000';

  // Set isClient to true on mount
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    if (!isClient) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const savedMode = localStorage.getItem('drawingBoardDarkMode');
      if (!isLocalStorageAvailable() || localStorage.getItem('drawingBoardDarkMode') === null) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isClient]);

  React.useEffect(() => {
    if (!isClient) return;
    safeSetItem('drawingBoardDarkMode', darkMode);
    drawElements();
  }, [darkMode, isClient]);

  const drawBackground = React.useCallback(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
    ctx.fillRect(0, 0, width, height);

    const offsetX = (panOffset.x * scale - scaleOffset.x) % (gridSize * scale);
    const offsetY = (panOffset.y * scale - scaleOffset.y) % (gridSize * scale);
    const gridColor = darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)';

    if (backgroundType === 'grid') {
      const majorGridSize = gridSize * 5;
      const majorGridColor = darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;

      for (let x = offsetX; x < width; x += gridSize * scale) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }

      for (let y = offsetY; y < height; y += gridSize * scale) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }

      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = majorGridColor;
      ctx.lineWidth = 1.5;

      const majorOffsetX = offsetX - (offsetX % (majorGridSize * scale));
      const majorOffsetY = offsetY - (offsetY % (majorGridSize * scale));
      for (let x = majorOffsetX; x < width; x += majorGridSize * scale) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }

      for (let y = majorOffsetY; y < height; y += majorGridSize * scale) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (backgroundType === 'dots') {
      ctx.fillStyle = gridColor;
      const dotSize = 2;
      
      for (let x = offsetX; x < width; x += gridSize * scale) {
        for (let y = offsetY; y < height; y += gridSize * scale) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [backgroundType, gridSize, scale, panOffset, scaleOffset, darkMode]);

  const drawElements = React.useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(panOffset.x * scale - scaleOffset.x, panOffset.y * scale - scaleOffset.y);
    ctx.scale(scale, scale);


    elements.forEach(element => {
      if (element.type === 'pencil') {
        ctx.beginPath();
        ctx.strokeStyle = element.color || pencilColor || getDefaultColor();
        ctx.lineWidth = element.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        element.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      } else if (element.type === 'line') {
        ctx.beginPath();
        ctx.strokeStyle = element.color || pencilColor || getDefaultColor();
        ctx.lineWidth = 2;
        ctx.moveTo(element.x1, element.y1);
        ctx.lineTo(element.x2, element.y2);
        ctx.stroke();
      } else if (element.type === 'rectangle') {
        ctx.strokeStyle = element.color || pencilColor || getDefaultColor();
        ctx.lineWidth = 2;
        ctx.strokeRect(
          element.x1,
          element.y1,
          element.x2 - element.x1,
          element.y2 - element.y1
        );
      } else if (element.type === 'text') {
        ctx.font = '24px sans-serif';
        ctx.fillStyle = element.color || pencilColor || getDefaultColor();
        ctx.fillText(element.text, element.x1, element.y1);
      }
    });

    ctx.restore();
  }, [elements, scale, panOffset, scaleOffset, darkMode, pencilColor]);
  const isValidHexColor = (color) => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  };
  const handleColorChange = (value) => {
    // Allow partial input while typing
    if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
      setPencilColor(value);
    }
  };
  const handleColorBlur = () => {
    // Validate and format the color on blur
    if (!isValidHexColor(pencilColor)) {
      setPencilColor(getDefaultColor());
    }
  };
  React.useEffect(() => {
    if (!isClient) return;
    
    const handleResize = () => {
      if (backgroundCanvasRef.current && drawingCanvasRef.current) {
        backgroundCanvasRef.current.width = window.innerWidth;
        backgroundCanvasRef.current.height = window.innerHeight;
        drawingCanvasRef.current.width = window.innerWidth;
        drawingCanvasRef.current.height = window.innerHeight;
        drawBackground();
        drawElements();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient, drawBackground, drawElements]);

  React.useEffect(() => {
    drawBackground();
    drawElements();
  }, [drawBackground, drawElements]);

  const toggleBackground = () => {
    setBackgroundType(prev => {
      if (prev === 'none') return 'grid';
      if (prev === 'grid') return 'dots';
      return 'none';
    });
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleDetectAndShowDownload = () => {
    handleDetectRegions();
    setShowDownloadButton(true);
    setIsMenuOpen(false);
  };


  const [selectedTool, setSelectedTool] = useState(null);

  // Rest of your component's JSX remains the same...
  return (
    <div className={`relative w-full h-screen overflow-x-hidden overflow-y-hidden`}>
      {/* Corner Menu Button */}
      <MenuComponent/>
      
      <div className="fixed left-1/2 top-4 -translate-x-1/2 flex flex-col items-start z-10 bg-background">
        <ToolToggleGroup setSelectedTool={setSelectedTool} />
        {/* Chỉ hiển thị phần Pen section nếu công cụ được chọn là 'pen' */}
        {selectedTool === 'pen' && (
          <div className="flex items-center gap-1 rounded-lg shadow-lg p-1 z-10 border mt-2 z-10">
            <Button className="h-8 w-8 rounded" title="New Tool 1" variant="ghost">
              <Square className="h-4 w-4" />
            </Button>
            <Button className="h-8 w-8 rounded" title="New Tool 2" variant="ghost">
              <Heart className="h-4 w-4" />
            </Button>
            <Button className="h-8 w-8 rounded" title="New Tool 3" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      {/* Zoom Controls - Bottom Left */}
      <div className="fixed bottom-4 left-4 flex items-center gap-1 rounded-lg shadow-lg p-1 z-10 border">
          
          <Button className="h-8 w-8 rounded" title="Zoom Out" variant="ghost" onClick={() => onZoom(-0.1)}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <button className="text-xs min-w-[3rem] text-center" onClick={() => setScale(1)}>
      {Math.round(scale * 100)}%
      </button>
      <Button variant="ghost" className="h-8 w-8 rounded" title="Zoom In" onClick={() => onZoom(0.1)}>
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
      {showDownloadButton && (
        <button
          onClick={() => {
            handleDownloadRegions();
            setShowDownloadButton(false);
          }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Download size={20} color="#ffffff" />
          Download Detected Regions
        </button>
      )}
      {/* Canvas Container */}
      <div className="absolute inset-0">
        <canvas
          ref={backgroundCanvasRef}
          className="absolute inset-0 z-0"
        />
        <canvas
          id="canvas"
          ref={drawingCanvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{touchAction: 'none'}}
          className="absolute inset-0 z-1"
        />
      </div>
      
      {/* Text Area for Writing */}
      {action === "writing" && (
        <textarea
          ref={textAreaRef}
          onBlur={handleBlur}
          style={{
            position: "fixed",
            top: (selectedElement.y1 - 2) * scale + panOffset.y * scale - scaleOffset.y,
            left: selectedElement.x1 * scale + panOffset.x * scale - scaleOffset.x,
            font: `${24 * scale}px sans-serif`,
            margin: 0,
            padding: 0,
            border: 0,
            outline: 0,
            resize: "auto",
            overflow: "hidden",
            whiteSpace: "pre",
            background: "transparent",
            color: darkMode ? 'white' : 'black',
            zIndex: 2,
          }}
        />
      )}
      
    </div>
  );
};

export default DrawingBoard;
