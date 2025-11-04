import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SupportsPanelProps {
  open: boolean;
  onClose: () => void;
}

const SupportsPanel: React.FC<SupportsPanelProps> = ({ open, onClose }) => {
  const [type, setType] = React.useState<'rectangular' | 'cylindrical' | 'conical' | 'custom'>('cylindrical');

  if (!open) return null;

  const startPlacement = () => {
    window.dispatchEvent(new CustomEvent('supports-start-placement', {
      detail: {
        type,
        params: {}
      }
    }));
  };

  return (
    <div className="absolute left-16 top-16 z-40">
      <Card className="w-80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Create Supports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Tabs value={type} onValueChange={(v) => setType(v as any)}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="rectangular">Rect</TabsTrigger>
              <TabsTrigger value="cylindrical">Cyl</TabsTrigger>
              <TabsTrigger value="conical">Cone</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>

          <p className="text-xs text-muted-foreground">Click center → drag to size → click/drag up to set height. No manual input.</p>

          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1" onClick={startPlacement}>Select</Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('supports-start-placement', {
                  detail: { type, params: {} }
                }));
              }}
            >
              Restart
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.dispatchEvent(new Event('supports-cancel-placement'))}
            >
              Cancel
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupportsPanel;

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SupportsPanelProps {
  open: boolean;
  onClose: () => void;
}

const SupportsPanel: React.FC<SupportsPanelProps> = ({ open, onClose }) => {
  const [type, setType] = React.useState<'rectangular' | 'cylindrical' | 'conical' | 'custom'>('cylindrical');

  if (!open) return null;

  const startPlacement = () => {
    window.dispatchEvent(new CustomEvent('supports-start-placement', {
      detail: {
        type,
        params: {}
      }
    }));
  };

  return (
    <div className="absolute left-16 top-16 z-40">
      <Card className="w-80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Create Supports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Tabs value={type} onValueChange={(v) => setType(v as any)}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="rectangular">Rect</TabsTrigger>
              <TabsTrigger value="cylindrical">Cyl</TabsTrigger>
              <TabsTrigger value="conical">Cone</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>

          <p className="text-xs text-muted-foreground">Click center → drag to size → click/drag up to set height. No manual input.</p>

          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1" onClick={startPlacement}>Select</Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('supports-start-placement', {
                  detail: { type, params: {} }
                }));
              }}
            >
              Restart
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.dispatchEvent(new Event('supports-cancel-placement'))}
            >
              Cancel
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupportsPanel;

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface SupportsPanelProps {
  open: boolean;
  onClose: () => void;
}

const numberInput = (
  value: number,
  setValue: (v: number) => void,
  label: string,
  min = 0,
  step = 0.1
) => (
  <div className="space-y-1">
    <label className="text-xs text-muted-foreground">{label}</label>
    <input
      type="number"
      value={value}
      min={min}
      step={step}
      onChange={(e) => setValue(Number(e.target.value) || 0)}
      className="w-full h-8 px-2 text-xs border rounded"
    />
  </div>
);

const SupportsPanel: React.FC<SupportsPanelProps> = ({ open, onClose }) => {
  const [type, setType] = React.useState<'rectangular' | 'cylindrical' | 'conical' | 'custom'>('cylindrical');

  // Simple param states per type
  const [radius, setRadius] = React.useState(10);
  const [height, setHeight] = React.useState(10);
  const [width, setWidth] = React.useState(20);
  const [depth, setDepth] = React.useState(20);
  const [cornerRadius, setCornerRadius] = React.useState(2);
  const [baseRadius, setBaseRadius] = React.useState(12);
  const [topRadius, setTopRadius] = React.useState(0);

  if (!open) return null;

  const startPlacement = () => {
    window.dispatchEvent(new CustomEvent('supports-start-placement', {
      detail: {
        type,
        params:
          type === 'cylindrical' ? { radius, height } :
          type === 'rectangular' ? { width, depth, height, cornerRadius } :
          type === 'conical' ? { baseRadius, topRadius, height } :
          { height }
      }
    }));
  };

  return (
    <div className="absolute left-16 top-16 z-40">
      <Card className="w-80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Create Supports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Tabs value={type} onValueChange={(v) => setType(v as any)}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="rectangular">Rect</TabsTrigger>
              <TabsTrigger value="cylindrical">Cyl</TabsTrigger>
              <TabsTrigger value="conical">Cone</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="rectangular" className="space-y-2 mt-2">
              {numberInput(width, setWidth, 'Width (mm)', 1)}
              {numberInput(depth, setDepth, 'Depth (mm)', 1)}
              {numberInput(height, setHeight, 'Height (mm)', 1)}
              {numberInput(cornerRadius, setCornerRadius, 'Corner Radius (mm)', 0)}
            </TabsContent>
            <TabsContent value="cylindrical" className="space-y-2 mt-2">
              {numberInput(radius, setRadius, 'Radius (mm)', 1)}
              {numberInput(height, setHeight, 'Height (mm)', 1)}
            </TabsContent>
            <TabsContent value="conical" className="space-y-2 mt-2">
              {numberInput(baseRadius, setBaseRadius, 'Base Radius (mm)', 1)}
              {numberInput(topRadius, setTopRadius, 'Top Radius (mm)', 0)}
              {numberInput(height, setHeight, 'Height (mm)', 1)}
            </TabsContent>
            <TabsContent value="custom" className="space-y-2 mt-2">
              <p className="text-xs text-muted-foreground">Sketch-to-extrude coming next. Use Cylindrical/Rectangular for now.</p>
              {numberInput(height, setHeight, 'Height (mm)', 1)}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1" onClick={startPlacement}>Select</Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('supports-start-placement', {
                  detail: {
                    type,
                    params:
                      type === 'cylindrical' ? { radius, height } :
                      type === 'rectangular' ? { width, depth, height, cornerRadius } :
                      type === 'conical' ? { baseRadius, topRadius, height } :
                      { height }
                  }
                }));
              }}
            >
              Restart
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.dispatchEvent(new Event('supports-cancel-placement'))}
            >
              Cancel
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
