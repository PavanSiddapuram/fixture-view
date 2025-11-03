import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Upload,
  Grid3X3,
  Boxes,
  GitMerge,
  Wrench,
  Tag,
  Drill,
  Scissors,
  DownloadCloud
} from "lucide-react";

interface VerticalToolbarProps {
  onToolSelect?: (tool: string) => void;
  className?: string;
  activeTool?: string;
}

const VerticalToolbar: React.FC<VerticalToolbarProps> = ({
  onToolSelect,
  className = '',
  activeTool
}) => {
  const tools = [
    { id: 'import', icon: Upload, label: 'Import', tooltip: 'Import Workpieces / Models' },
    { id: 'baseplates', icon: Grid3X3, label: 'Baseplates', tooltip: 'Choose From Different Baseplates' },
    { id: 'supports', icon: Boxes, label: 'Supports', tooltip: 'Create Supports by Extruding a Sketch' },
    { id: 'cavity', icon: GitMerge, label: 'Cavity', tooltip: 'Subtract Workpieces From Fixture Geometry' },
    { id: 'clamps', icon: Wrench, label: 'Clamps', tooltip: 'Clamp Workpieces with Standard Components' },
    { id: 'labels', icon: Tag, label: 'Labels', tooltip: 'Set Labels (e.g., Version Numbers)' },
    { id: 'drill', icon: Drill, label: 'Drill/Cutouts', tooltip: 'Drill Holes or Remove Material' },
    { id: 'optimize', icon: Scissors, label: 'Optimize', tooltip: 'Save Material and Print Faster' },
    { id: 'export', icon: DownloadCloud, label: 'Export', tooltip: 'Export Fixture for 3D Printing' }
  ];

  const handleToolClick = (toolId: string) => {
    onToolSelect?.(toolId);
  };

  return (
    <div className={`vertical-toolbar ${className}`}>
      <div className="flex flex-col gap-2 p-2">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Button
              key={tool.id}
              variant="ghost"
              size="sm"
              onClick={() => handleToolClick(tool.id)}
              aria-label={tool.label}
              aria-pressed={activeTool === tool.id}
              className={`w-10 h-10 p-0 tech-transition justify-center rounded-md focus-visible:ring-2 focus-visible:ring-primary ${
                activeTool === tool.id ? 'bg-primary/15 text-primary border border-primary/20' : 'hover:bg-primary/10 hover:text-primary'
              }`}
              title={tool.tooltip}
            >
              <IconComponent className="w-5 h-5" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default VerticalToolbar;