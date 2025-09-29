import React, { useState } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Box,
  Circle,
  Triangle,
  Wrench,
  Square,
  Grid3X3,
  Settings
} from 'lucide-react';
import { ComponentLibrary, FixtureComponent } from '@/lib/fixtureComponents';

interface ComponentLibraryPanelProps {
  onComponentSelect?: (component: FixtureComponent) => void;
  onComponentDrag?: (component: FixtureComponent) => void;
  className?: string;
}

const ComponentLibraryPanel: React.FC<ComponentLibraryPanelProps> = ({
  onComponentSelect,
  onComponentDrag,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('supports');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Mock component library - in real app, this would come from the fixtureComponents
  const mockComponents: ComponentLibrary = {
    supports: [
      {
        id: 'rectangular-block',
        name: 'Rectangular Block',
        category: 'support',
        geometry: new THREE.BoxGeometry(),
        material: new THREE.MeshStandardMaterial(),
        parameters: { width: 20, height: 10, depth: 20 }
      },
      {
        id: 'cylindrical-support',
        name: 'Cylindrical Support',
        category: 'support',
        geometry: new THREE.BoxGeometry(),
        material: new THREE.MeshStandardMaterial(),
        parameters: { radius: 8, height: 15 }
      },
      {
        id: 'v-block',
        name: 'V-Block Support',
        category: 'support',
        geometry: new THREE.BoxGeometry(),
        material: new THREE.MeshStandardMaterial(),
        parameters: { width: 30, height: 15, angle: 90 }
      }
    ],
    clamps: [
      {
        id: 'c-clamp',
        name: 'C-Clamp',
        category: 'clamp',
        geometry: new THREE.BoxGeometry(),
        material: new THREE.MeshStandardMaterial(),
        parameters: { jawWidth: 25, throatDepth: 20, height: 30 }
      },
      {
        id: 'toggle-clamp',
        name: 'Toggle Clamp',
        category: 'clamp',
        geometry: new THREE.BoxGeometry(),
        material: new THREE.MeshStandardMaterial(),
        parameters: { baseWidth: 40, height: 25, armLength: 35 }
      }
    ],
    baseplates: [
      {
        id: 'perforated-plate',
        name: 'Perforated Baseplate',
        category: 'baseplate',
        geometry: new THREE.BoxGeometry(),
        material: new THREE.MeshStandardMaterial(),
        parameters: { width: 200, depth: 150, height: 5, holeDiameter: 8, holeSpacing: 25 }
      },
      {
        id: 'solid-plate',
        name: 'Solid Baseplate',
        category: 'baseplate',
        geometry: new THREE.BoxGeometry(),
        material: new THREE.MeshStandardMaterial(),
        parameters: { width: 200, depth: 150, height: 5 }
      }
    ],
    fasteners: [
      {
        id: 'socket-head-screw',
        name: 'Socket Head Screw',
        category: 'fastener',
        geometry: new THREE.BoxGeometry(),
        material: new THREE.MeshStandardMaterial(),
        parameters: { diameter: 6, length: 20, headDiameter: 10, headHeight: 6 }
      },
      {
        id: 'washer',
        name: 'Washer',
        category: 'fastener',
        geometry: new THREE.BoxGeometry(),
        material: new THREE.MeshStandardMaterial(),
        parameters: { outerDiameter: 10, innerDiameter: 6, thickness: 2 }
      }
    ]
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'support': return <Box className="w-4 h-4" />;
      case 'clamp': return <Wrench className="w-4 h-4" />;
      case 'baseplate': return <Square className="w-4 h-4" />;
      case 'fastener': return <Settings className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getCategoryComponents = (category: string): FixtureComponent[] => {
    const categoryKey = category as keyof ComponentLibrary;
    const components = mockComponents[categoryKey] || [];
    return components.filter(component =>
      component.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleComponentDrag = (component: FixtureComponent, e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    onComponentDrag?.(component);
  };

  const ComponentCard: React.FC<{ component: FixtureComponent }> = ({ component }) => (
    <Card
      className="cursor-move hover:shadow-md transition-shadow duration-200"
      draggable
      onDragStart={(e) => handleComponentDrag(component, e)}
      onClick={() => onComponentSelect?.(component)}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
            {getCategoryIcon(component.category)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{component.name}</h4>
            <Badge variant="secondary" className="text-xs mt-1">
              {component.category}
            </Badge>
            <div className="mt-2 text-xs text-muted-foreground">
              {Object.entries(component.parameters || {}).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span>{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`w-80 border-l border-border/50 tech-glass flex flex-col ${className}`}>
      <div className="p-4 border-b border-border/50">
        <h2 className="font-tech font-semibold text-lg mb-1">Component Library</h2>
        <p className="text-xs text-muted-foreground font-tech">
          Drag and drop fixture elements
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
          <TabsTrigger value="supports" className="text-xs">
            <Box className="w-3 h-3 mr-1" />
            Supports
          </TabsTrigger>
          <TabsTrigger value="clamps" className="text-xs">
            <Wrench className="w-3 h-3 mr-1" />
            Clamps
          </TabsTrigger>
          <TabsTrigger value="baseplates" className="text-xs">
            <Square className="w-3 h-3 mr-1" />
            Plates
          </TabsTrigger>
          <TabsTrigger value="fasteners" className="text-xs">
            <Settings className="w-3 h-3 mr-1" />
            Parts
          </TabsTrigger>
        </TabsList>

        <div className="p-4 flex-1">
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border/50 rounded-md bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {getCategoryComponents(selectedCategory).map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </ScrollArea>
        </div>

        <TabsContent value="supports" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {getCategoryComponents('supports').map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="clamps" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {getCategoryComponents('clamps').map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="baseplates" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {getCategoryComponents('baseplates').map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="fasteners" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {getCategoryComponents('fasteners').map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComponentLibraryPanel;
