import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Ruler, FileText, CheckCircle } from "lucide-react";

interface UnitsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUnitsSelect: (units: string) => void;
  fileName: string;
  fileSize: string;
}

const UnitsDialog: React.FC<UnitsDialogProps> = ({
  isOpen,
  onOpenChange,
  onUnitsSelect,
  fileName,
  fileSize
}) => {
  const [selectedUnits, setSelectedUnits] = useState<string>('mm');

  const handleConfirmImport = () => {
    onUnitsSelect(selectedUnits);
    onOpenChange(false);
  };

  const unitOptions = [
    {
      value: 'mm',
      label: 'Millimeters (mm)',
      description: 'Most common for 3D printing and small parts',
      icon: '📏'
    },
    {
      value: 'cm',
      label: 'Centimeters (cm)',
      description: 'Medium-sized objects and assemblies',
      icon: '📐'
    },
    {
      value: 'inch',
      label: 'Inches (in)',
      description: 'Imperial measurements, traditional manufacturing',
      icon: '📏'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto shadow-xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Import Model Units
          </DialogTitle>
          <DialogDescription>
            Define the units of the imported file. This affects all measurements and scaling.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {/* File Information */}
          <div className="space-y-1">
            <p className="font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">{fileSize}</p>
          </div>

          {/* Units Selection - list style like reference */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Model Units
            </h3>
            <div className="border rounded-md overflow-hidden">
              {['mm','cm','inch'].map((u, idx) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setSelectedUnits(u)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-accent/40 ${
                    selectedUnits === u ? 'bg-accent/60' : ''
                  } ${idx !== 2 ? 'border-b' : ''}`}
                >
                  {u}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              For 3MF and STEP, units are taken from the file automatically.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleConfirmImport}>Import</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnitsDialog;
