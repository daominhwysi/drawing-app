// ToolToggleGroup.js
'use client';
import { useState, useEffect } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Redo, Pen, Eraser, Type, Text, Shapes } from "lucide-react";
import { CursorArrowIcon } from '@radix-ui/react-icons';

const ToolToggleGroup = ({ setSelectedTool, tool, setTool }) => {
  // Map từ tool sang giá trị hiển thị của toggle group
  const getToggleValue = (currentTool) => {
    switch (currentTool) {
      case 'selection':
        return 'cursor';
      case 'pencil':
        return 'pen';
      default:
        return currentTool;
    }
  };

  // Sử dụng tool từ props làm giá trị mặc định
  const [selectedValue, setSelectedValue] = useState(() => getToggleValue(tool));

  // Cập nhật selectedValue khi tool thay đổi từ bên ngoài
  useEffect(() => {
    setSelectedValue(getToggleValue(tool));
  }, [tool]);

  const handleToolChange = (value) => {
    if (!value) return;
    
    setSelectedValue(value);
    setSelectedTool?.(value);

    // Map từ toggle value sang tool value
    switch (value) {
      case 'cursor':
        setTool('selection');
        break;
      case 'pen':
        setTool('pencil');
        break;
      case 'eraser':
        setTool('eraser');
        break;
      case 'type':
      case 'text':
        setTool('text');
        break;
      default:
        setTool(value);
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-lg shadow-lg p-1 z-10">
      <div className="flex items-center gap-1 rounded-lg border p-1 shadow-sm max-w-full flex-wrap">
        <ToggleGroup 
          type="single" 
          value={selectedValue}
          onValueChange={handleToolChange}
        >
          <Button 
            value="redo" 
            className="w-9 h-9" 
            variant="ghost"
            onClick={() => {
              console.log('Redo clicked');
            }}
          >
            <Redo className="h-4 w-4 -scale-x-100" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <ToggleGroupItem value="cursor" aria-label="Toggle cursor">
            <CursorArrowIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="pen" aria-label="Toggle pen">
            <Pen className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="eraser" aria-label="Toggle eraser">
            <Eraser className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="type" aria-label="Toggle type">
            <Type className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="text" aria-label="Toggle text">
            <Text className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="shapes" aria-label="Toggle shapes">
            <Shapes className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};

export default ToolToggleGroup;