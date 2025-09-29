import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Upload,
  Hammer,
  Scissors,
  Wrench,
  Tag,
  Ruler,
  Settings,
  Eye,
  Grid3X3,
  Square, // Baseplate icon
  Scale, // STL Editor
  GitMerge, // Boolean Operations
  Move, // Clamp Creation
} from "lucide-react";

interface VerticalToolbarProps {
  onToolSelect?: (tool: string) => void;
  className?: string;
}

const VerticalToolbar: React.FC<VerticalToolbarProps> = ({
  onToolSelect,
  className = ''
}) => {
  const tools = [
    { id: 'import', icon: Upload, label: 'Import', tooltip: 'Import 3D Model' },
    { id: 'support', icon: Square, label: 'Baseplate', tooltip: 'Choose Base Plates' },
    { id: 'edit', icon: Scale, label: 'STL Edit', tooltip: 'Edit STL Model' },
    { id: 'boolean', icon: GitMerge, label: 'Boolean', tooltip: 'Boolean Operations' },
    { id: 'clamp', icon: Move, label: 'Clamp', tooltip: 'Add Clamp' },
    { id: 'cavity', icon: Scissors, label: 'Cavity', tooltip: 'Create Cavity' },
    { id: 'labels', icon: Tag, label: 'Labels', tooltip: 'Set Labels' },
    { id: 'measure', icon: Ruler, label: 'Measure', tooltip: 'Measurements' },
    { id: 'view', icon: Eye, label: 'View', tooltip: 'View Controls' },
    { id: 'grid', icon: Grid3X3, label: 'Grid', tooltip: 'Toggle Grid' },
    { id: 'settings', icon: Settings, label: 'Settings', tooltip: 'Settings' },
  ];

  const handleToolClick = (toolId: string) => {
    onToolSelect?.(toolId);
  };

  return (
    <div className={`vertical-toolbar ${className}`}>
      <div className="flex flex-col gap-1 p-2">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Button
              key={tool.id}
              variant="ghost"
              size="sm"
              onClick={() => handleToolClick(tool.id)}
              className="w-10 h-10 p-0 tech-transition hover:bg-primary/10 hover:text-primary justify-center"
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