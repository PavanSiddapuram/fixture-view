import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Square,
  Grid3X3,
  Layers,
  CheckCircle,
  X,
  Circle,
  Triangle,
  Hexagon
} from "lucide-react";

interface BaseplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBaseplateSelect: (type: string, option: string) => void;
  currentBaseplate?: { id: string; type: string } | null;
  onRemoveBaseplate?: (basePlateId: string) => void;
}

const BaseplateDialog: React.FC<BaseplateDialogProps> = ({
  isOpen,
  onOpenChange,
  onBaseplateSelect,
  currentBaseplate,
  onRemoveBaseplate
}) => {
  const [selected3DType, setSelected3DType] = useState<string>('');
  const [selectedStandardType, setSelectedStandardType] = useState<string>('');

  const handle3DSelect = (value: string) => {
    setSelected3DType(value);
    onBaseplateSelect('3d-printed', value);
  };

  const handleStandardSelect = (value: string) => {
    setSelectedStandardType(value);
    onBaseplateSelect('standard', value);
  };

  const handleClose = () => {
    setSelected3DType('');
    setSelectedStandardType('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Square className="w-5 h-5" />
            Choose Base Plates
          </DialogTitle>
          <DialogDescription>
            Select the type of baseplate for your fixture design
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Current Baseplate Section */}
          {currentBaseplate && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Current Baseplate
                </CardTitle>
                <p className="text-sm text-green-600">
                  Currently active in 3D scene
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-green-200 text-green-800">
                      {currentBaseplate.type}
                    </Badge>
                    <span className="font-medium text-green-900">ID: {currentBaseplate.id}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveBaseplate?.(currentBaseplate.id)}
                    className="w-full border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Current Baseplate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3D-Printed Baseplates Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                3D-Printed Baseplates
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Custom printed baseplates optimized for additive manufacturing
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Type:</label>
                <Select value={selected3DType} onValueChange={handle3DSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose 3D-printed baseplate type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangular">
                      <div className="flex items-center gap-2">
                        <Square className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Rectangular</div>
                          <div className="text-xs text-muted-foreground">Flat rectangular baseplate</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="convex-hull">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Convex Hull</div>
                          <div className="text-xs text-muted-foreground">Hull-shaped baseplate around part</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="cylindrical">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Cylindrical</div>
                          <div className="text-xs text-muted-foreground">Round baseplate for cylindrical parts</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="v-block">
                      <div className="flex items-center gap-2">
                        <Triangle className="w-4 h-4" />
                        <div>
                          <div className="font-medium">V-Block</div>
                          <div className="text-xs text-muted-foreground">V-shaped support for round parts</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="hexagonal">
                      <div className="flex items-center gap-2">
                        <Hexagon className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Hexagonal</div>
                          <div className="text-xs text-muted-foreground">Six-sided baseplate design</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selected3DType && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Selected: {selected3DType}</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    {selected3DType === 'rectangular' && (
                      <>
                        <p>• Flat rectangular baseplate</p>
                        <p>• Standard grid pattern</p>
                        <p>• Optimized for 3D printing</p>
                      </>
                    )}
                    {selected3DType === 'convex-hull' && (
                      <>
                        <p>• Hull-shaped around your part</p>
                        <p>• Minimal material usage</p>
                        <p>• Conformal to part geometry</p>
                      </>
                    )}
                    {selected3DType === 'cylindrical' && (
                      <>
                        <p>• Round baseplate design</p>
                        <p>• Perfect for cylindrical parts</p>
                        <p>• Circular mounting pattern</p>
                      </>
                    )}
                    {selected3DType === 'v-block' && (
                      <>
                        <p>• V-shaped support design</p>
                        <p>• Ideal for round workpieces</p>
                        <p>• Self-centering support</p>
                      </>
                    )}
                    {selected3DType === 'hexagonal' && (
                      <>
                        <p>• Six-sided baseplate design</p>
                        <p>• Efficient material usage</p>
                        <p>• Unique mounting options</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Standard Components Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-green-600" />
                Standard Components
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Traditional baseplate components and materials
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Type:</label>
                <Select value={selectedStandardType} onValueChange={handleStandardSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose standard component type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perforated-panel">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Perforated Panel</div>
                          <div className="text-xs text-muted-foreground">Grid of mounting holes</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="metal-wooden-plate">
                      <div className="flex items-center gap-2">
                        <Square className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Metal/Wooden Plate</div>
                          <div className="text-xs text-muted-foreground">Solid plate material</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedStandardType && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">Selected: {selectedStandardType}</span>
                  </div>
                  <div className="text-sm text-green-700">
                    {selectedStandardType === 'perforated-panel' && (
                      <>
                        <p>• Standard hole grid pattern</p>
                        <p>• Multiple hole sizes available</p>
                        <p>• Industry standard spacing</p>
                      </>
                    )}
                    {selectedStandardType === 'metal-wooden-plate' && (
                      <>
                        <p>• Solid plate construction</p>
                        <p>• Material: Steel, Aluminum, Wood</p>
                        <p>• Custom sizes available</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator className="my-4" />

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {currentBaseplate && (
              <Badge variant="secondary" className="px-3 py-1 bg-green-100 text-green-800">
                Current: {currentBaseplate.type}
              </Badge>
            )}
            {(selected3DType || selectedStandardType) && !currentBaseplate && (
              <Badge variant="secondary" className="px-3 py-1">
                {selected3DType && `3D: ${selected3DType}`}
                {selected3DType && selectedStandardType && ' + '}
                {selectedStandardType && `Standard: ${selectedStandardType}`}
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>

            {/* Remove current base plate */}
            {currentBaseplate && (
              <Button
                variant="destructive"
                onClick={() => {
                  onRemoveBaseplate?.(currentBaseplate.id);
                  handleClose();
                }}
                className="min-w-[140px]"
              >
                <X className="w-4 h-4 mr-2" />
                Remove Baseplate
              </Button>
            )}

            {/* Apply new base plate selection */}
            {((selected3DType || selectedStandardType) && !currentBaseplate) && (
              <Button
                onClick={handleClose}
                disabled={!selected3DType && !selectedStandardType}
                className="min-w-[100px]"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply
              </Button>
            )}

            {/* Replace current base plate */}
            {((selected3DType || selectedStandardType) && currentBaseplate) && (
              <Button
                onClick={() => {
                  if (currentBaseplate) {
                    onRemoveBaseplate?.(currentBaseplate.id);
                  }
                  handleClose();
                }}
                className="min-w-[140px] bg-orange-600 hover:bg-orange-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Replace Baseplate
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BaseplateDialog;
