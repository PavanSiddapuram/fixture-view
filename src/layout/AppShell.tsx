import { forwardRef, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import ViewCube from "@/components/ViewCube";
import VerticalToolbar from "@/components/VerticalToolbar";
import { 
  Cpu, 
  Upload, 
  RotateCcw, 
  Box,
  View,
  Layers,
  Settings,
  User,
  LogOut,
  Activity,
  Zap,
  Square,
  Circle,
  Move3D
} from "lucide-react";

export interface AppShellHandle {
  openFilePicker: () => void;
  resetView: () => void;
  setViewOrientation: (orientation: string) => void;
}

interface AppShellProps {
  children: ReactNode;
  onLogout: () => void;
  isProcessing?: boolean;
  fileStats?: {
    name?: string;
    triangles?: number;
    size?: string;
  };
}

const AppShell = forwardRef<AppShellHandle, AppShellProps>(
  ({ children, onLogout, isProcessing = false, fileStats }, ref) => {
    const handleOpenFilePicker = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.stl,.obj,.ply';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // This will be handled by the FileImport component
          const event = new CustomEvent('filepicker-selected', { detail: file });
          window.dispatchEvent(event);
        }
      };
      input.click();
    };

    const handleResetView = () => {
      const event = new CustomEvent('viewer-reset');
      window.dispatchEvent(event);
    };

    const handleSetOrientation = (orientation: string) => {
      const event = new CustomEvent('viewer-orientation', { detail: orientation });
      window.dispatchEvent(event);
    };

    // Expose methods via ref
    if (ref && typeof ref === 'object') {
      ref.current = {
        openFilePicker: handleOpenFilePicker,
        resetView: handleResetView,
        setViewOrientation: handleSetOrientation,
      };
    }

    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border/50 tech-glass flex items-center justify-between px-4 z-50">
          {/* Left Section - Logo & File Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-primary" />
              </div>
              <span className="font-tech font-semibold text-sm">FixtureMate</span>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenFilePicker}
                className="tech-transition tech-glow font-tech"
                disabled={isProcessing}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetView}
                className="tech-transition"
                disabled={isProcessing}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Center Section - File Info */}
          <div className="flex items-center gap-4">
            {fileStats?.name && (
              <div className="flex items-center gap-3 text-xs font-tech">
                <div className="flex items-center gap-1">
                  <Box className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{fileStats.name}</span>
                </div>
                {fileStats.triangles && (
                  <Badge variant="secondary" className="font-tech text-xs">
                    {fileStats.triangles.toLocaleString()} tri
                  </Badge>
                )}
                {fileStats.size && (
                  <span className="text-muted-foreground">{fileStats.size}</span>
                )}
              </div>
            )}
            
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs font-tech text-primary">
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin-smooth" />
                Processing...
              </div>
            )}
          </div>

          {/* Right Section - View Controls & User */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetOrientation('front')}
                className="tech-transition px-2"
                disabled={isProcessing}
                title="Front View"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetOrientation('back')}
                className="tech-transition px-2"
                disabled={isProcessing}
                title="Back View"
              >
                <Square className="w-4 h-4 rotate-180" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetOrientation('left')}
                className="tech-transition px-2"
                disabled={isProcessing}
                title="Left View"
              >
                <Square className="w-4 h-4 -rotate-90" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetOrientation('right')}
                className="tech-transition px-2"
                disabled={isProcessing}
                title="Right View"
              >
                <Square className="w-4 h-4 rotate-90" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetOrientation('top')}
                className="tech-transition px-2"
                disabled={isProcessing}
                title="Top View"
              >
                <Circle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetOrientation('iso')}
                className="tech-transition px-2"
                disabled={isProcessing}
                title="Isometric View"
              >
                <Move3D className="w-4 h-4" />
              </Button>
            </div>
            
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="tech-transition text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Vertical Toolbar */}
          <aside className="w-14 border-r border-border/50 tech-glass flex flex-col justify-center">
            <VerticalToolbar />
          </aside>

          {/* Main Viewport */}
          <main className="flex-1 relative">
            {children}
            
            {/* View Cube - Top Right */}
            <div className="absolute top-4 right-4 z-10">
              <ViewCube 
                onViewChange={handleSetOrientation}
                className="border border-border/50 rounded-md bg-card/80 backdrop-blur-sm"
              />
            </div>
          </main>

          {/* Right Properties Panel */}
          <aside className="w-64 border-l border-border/50 tech-glass flex flex-col">
            {/* Properties Section */}
            <div className="p-4 flex-1">
              <h3 className="font-tech font-semibold text-sm mb-3">Properties</h3>
              {fileStats ? (
                <div className="space-y-2 text-xs font-tech">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File:</span>
                    <span>{fileStats.name}</span>
                  </div>
                  {fileStats.triangles && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Triangles:</span>
                      <span>{fileStats.triangles.toLocaleString()}</span>
                    </div>
                  )}
                  {fileStats.size && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{fileStats.size}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-tech">
                  No file loaded
                </p>
              )}
            </div>
          </aside>
        </div>

        {/* Status Bar */}
        <footer className="h-6 border-t border-border/50 tech-glass flex items-center justify-between px-4 text-xs font-tech text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Ready</span>
            <span>•</span>
            <span>WebGL 2.0</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3" />
            <span>Powered by Three.js</span>
          </div>
        </footer>
      </div>
    );
  }
);

AppShell.displayName = "AppShell";

export default AppShell;