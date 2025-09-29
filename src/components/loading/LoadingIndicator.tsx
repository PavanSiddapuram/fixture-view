import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  FileText,
  Settings,
  Wrench,
  GitMerge,
  Scale,
  Download,
  Upload,
  Cpu
} from "lucide-react";

interface LoadingIndicatorProps {
  type: 'file-processing' | 'cad-operation' | 'boolean-operation' | 'stl-editing' | 'export' | 'import' | 'kernel';
  message?: string;
  progress?: number;
  details?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type,
  message,
  progress,
  details
}) => {
  const getIcon = () => {
    switch (type) {
      case 'file-processing':
        return <Upload className="w-8 h-8" />;
      case 'cad-operation':
        return <Settings className="w-8 h-8" />;
      case 'boolean-operation':
        return <GitMerge className="w-8 h-8" />;
      case 'stl-editing':
        return <Scale className="w-8 h-8" />;
      case 'export':
        return <Download className="w-8 h-8" />;
      case 'import':
        return <FileText className="w-8 h-8" />;
      case 'kernel':
        return <Cpu className="w-8 h-8" />;
      default:
        return <Loader2 className="w-8 h-8" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'file-processing':
        return 'Processing 3D model...';
      case 'cad-operation':
        return 'Executing CAD operation...';
      case 'boolean-operation':
        return 'Performing boolean operation...';
      case 'stl-editing':
        return 'Applying STL transformations...';
      case 'export':
        return 'Preparing export...';
      case 'import':
        return 'Loading model file...';
      case 'kernel':
        return 'Initializing CAD kernel...';
      default:
        return 'Processing...';
    }
  };

  return (
    <Card className="w-80 mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Rotating Icon */}
          <div className="relative">
            <div className="animate-spin text-primary">
              {getIcon()}
            </div>
            <div className="absolute inset-0 animate-ping text-primary/30">
              {getIcon()}
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <p className="font-medium text-sm">
              {message || getDefaultMessage()}
            </p>

            {details && (
              <p className="text-xs text-muted-foreground">
                {details}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="w-full space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Animated Dots */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingIndicator;
