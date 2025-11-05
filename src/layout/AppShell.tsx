import React, { forwardRef, ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import ViewCube from "@/components/ViewCube";
import VerticalToolbar from "@/components/VerticalToolbar";
import ThreeDViewer from "@/components/3DViewer";
import BaseplateDialog from "@/components/BaseplateDialog";
import SupportsPanel from "@/components/Supports/SupportsPanel";
import { ProcessedFile } from "@/modules/FileImport/types";
import {
  Cpu,
  Upload,
  Settings,
  Eye,
  Ruler,
  Grid3X3,
  RotateCcw,
  Square,
  Circle,
  Move3D,
  ChevronLeft,
  ChevronRight,
  Scale,
  GitMerge,
  Move,
  Undo2,
  Redo2,
  Wrench,
  Box,
  LogOut,
  Zap
} from "lucide-react";

export interface AppShellHandle {
  openFilePicker: () => void;
  resetView: () => void;
  setViewOrientation: (orientation: string) => void;
}

interface AppShellProps {
  children: ReactNode;
  onLogout: () => void;
  onToggleDesignMode?: () => void;
  designMode?: boolean;
  isProcessing?: boolean;
  fileStats?: {
    name?: string;
    triangles?: number;
    size?: string;
  };
  currentFile?: ProcessedFile | null;
}

const AppShell = forwardRef<AppShellHandle, AppShellProps>(
  ({ children, onLogout, onToggleDesignMode, designMode = false, isProcessing = false, fileStats, currentFile }, ref) => {
    const [isBaseplateDialogOpen, setIsBaseplateDialogOpen] = useState(false);
    const [isSupportsOpen, setIsSupportsOpen] = useState(false);
    const [isFileImportCollapsed, setIsFileImportCollapsed] = useState(false);
    const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(false);
    const [undoStack, setUndoStack] = useState<any[]>([]);
    const [redoStack, setRedoStack] = useState<any[]>([]);
    const [transformEnabled, setTransformEnabled] = useState(false);
    const [currentBaseplate, setCurrentBaseplate] = useState<{ id: string; type: string } | null>(null);

    const handleOpenFilePicker = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.stl,.obj,.glb,.gltf';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
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

    const handleUndo = () => {
      if (undoStack.length > 0) {
        const lastState = undoStack[undoStack.length - 1];
        setRedoStack(prev => [lastState, ...prev]);
        setUndoStack(prev => prev.slice(0, -1));
        window.dispatchEvent(new CustomEvent('viewer-undo', { detail: lastState }));
      }
    };

    const handleRedo = () => {
      if (redoStack.length > 0) {
        const nextState = redoStack[0];
        setUndoStack(prev => [...prev, nextState]);
        setRedoStack(prev => prev.slice(1));
        window.dispatchEvent(new CustomEvent('viewer-redo', { detail: nextState }));
      }
    };

    const handleComponentPlaced = (component: any, position: any) => {
      const state = { component, position, timestamp: Date.now() };
      setUndoStack(prev => [...prev, state]);
      setRedoStack([]);
    };

    const handleBaseplateCreated = (e: CustomEvent) => {
      const { option } = e.detail;
      const baseplateId = `baseplate-${Date.now()}`;
      setCurrentBaseplate({ id: baseplateId, type: option });
      // Also cancel any ongoing supports placement and close panel
      setIsSupportsOpen(false);
      window.dispatchEvent(new Event('supports-cancel-placement'));
    };

    const handleBaseplateRemoved = (basePlateId: string) => {
      setCurrentBaseplate(null);
      window.dispatchEvent(new CustomEvent('remove-baseplate', { detail: { basePlateId } }));
    };

    const handleToolSelect = (toolId: string) => {
      switch (toolId) {
        case 'import':
          handleOpenFilePicker();
          return;
        case 'baseplates':
          setIsBaseplateDialogOpen(true);
          // Close supports and cancel placement if active
          setIsSupportsOpen(false);
          window.dispatchEvent(new Event('supports-cancel-placement'));
          return;
        case 'supports':
          setIsSupportsOpen(true);
          window.dispatchEvent(new CustomEvent('open-supports-dialog'));
          return;
        case 'cavity':
          window.dispatchEvent(new CustomEvent('open-cavity-dialog'));
          return;
        case 'clamps':
          window.dispatchEvent(new CustomEvent('open-clamps-dialog'));
          return;
        case 'labels':
          window.dispatchEvent(new CustomEvent('open-labels-dialog'));
          return;
        case 'drill':
          window.dispatchEvent(new CustomEvent('open-drill-dialog'));
          return;
        case 'optimize':
          window.dispatchEvent(new CustomEvent('optimize-material'));
          return;
        case 'export':
          window.dispatchEvent(new CustomEvent('open-export-dialog'));
          return;
        default:
          console.log('Unhandled tool:', toolId);
      }
    };

    // Listen for base plate events
    React.useEffect(() => {
      window.addEventListener('create-baseplate', handleBaseplateCreated as EventListener);
      return () => window.removeEventListener('create-baseplate', handleBaseplateCreated as EventListener);
    }, []);

    // Listen for supports dialog open event
    React.useEffect(() => {
      const onOpenSupports = () => setIsSupportsOpen(true);
      window.addEventListener('open-supports-dialog', onOpenSupports as EventListener);
      return () => window.removeEventListener('open-supports-dialog', onOpenSupports as EventListener);
    }, []);

    // Record support creations to undo stack
    React.useEffect(() => {
      const onSupportCreated = (e: CustomEvent) => {
        const support = e.detail;
        const state = { type: 'support-created', support };
        setUndoStack(prev => [...prev, state]);
        setRedoStack([]);
      };
      window.addEventListener('support-created', onSupportCreated as EventListener);
      return () => window.removeEventListener('support-created', onSupportCreated as EventListener);
    }, []);

    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
      openFilePicker: handleOpenFilePicker,
      resetView: handleResetView,
      setViewOrientation: handleSetOrientation,
    }));

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

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  className="tech-transition px-2"
                  disabled={undoStack.length === 0}
                  title="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  className="tech-transition px-2"
                  disabled={redoStack.length === 0}
                  title="Redo"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-transform-mode'));
                }}
                className="tech-transition"
                title="Toggle Transform Controls"
              >
                <Move className="w-4 h-4 mr-2" />
                Transform
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
                <span className="text-primary">Processing...</span>
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
          {/* Left Static Vertical Toolbar */}
          <aside className="w-14 border-r border-border/50 tech-glass flex flex-col justify-center">
            <VerticalToolbar onToolSelect={handleToolSelect} />
          </aside>

          {/* Collapsible File Import Section */}
          <aside className={`border-r border-border/50 tech-glass flex flex-col transition-all duration-300 ${isFileImportCollapsed ? 'w-12' : 'w-80'}`}>
            <div className="p-2 border-b border-border/50 flex items-center justify-between">
              {!isFileImportCollapsed && (
                <h3 className="font-tech font-semibold text-sm">File Import</h3>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const next = !isFileImportCollapsed;
                  setIsFileImportCollapsed(next);
                  setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    window.dispatchEvent(new CustomEvent('viewer-resize'));
                  }, 320);
                }}
                className="w-8 h-8 p-0 tech-transition hover:bg-primary/10 hover:text-primary"
                title={isFileImportCollapsed ? 'Expand File Import' : 'Collapse File Import'}
              >
                {isFileImportCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>
            </div>

            {!isFileImportCollapsed && (
              <div className="flex-1">
                {children && React.cloneElement(children as React.ReactElement, {
                  isInCollapsiblePanel: true
                })}
              </div>
            )}
          </aside>

          {/* Main Viewport */}
          <main className="flex-1 relative">
            <ThreeDViewer
              currentFile={currentFile}
              isProcessing={isProcessing}
              onComponentPlaced={handleComponentPlaced}
              transformEnabled={transformEnabled}
              onTransformToggle={setTransformEnabled}
            />

            <div className="absolute top-4 right-4 z-10">
              <ViewCube
                onViewChange={handleSetOrientation}
                className=""
                size={150}
              />
            </div>
          </main>

          {/* Right Properties Panel */}
          <aside className={`border-l border-border/50 tech-glass flex flex-col transition-all duration-300 ${isPropertiesCollapsed ? 'w-12' : 'w-64'}`}>
            <div className="p-2 border-b border-border/50 flex items-center justify-between">
              {!isPropertiesCollapsed && (
                <h3 className="font-tech font-semibold text-sm">Properties</h3>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const next = !isPropertiesCollapsed;
                  setIsPropertiesCollapsed(next);
                  setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    window.dispatchEvent(new CustomEvent('viewer-resize'));
                  }, 320);
                }}
                className="w-8 h-8 p-0 tech-transition hover:bg-primary/10 hover:text-primary"
                title={isPropertiesCollapsed ? 'Expand Properties' : 'Collapse Properties'}
              >
                {isPropertiesCollapsed ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </div>

            {!isPropertiesCollapsed && (
              <div className="p-4 flex-1">
                {fileStats ? (
                  <div className="space-y-2 text-xs font-tech">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File:</span>
                      <span className="truncate ml-2 max-w-[120px]" title={fileStats.name}>
                        {fileStats.name}
                      </span>
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
            )}
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

        {/* Baseplate Selection Dialog */}
        <BaseplateDialog
          isOpen={isBaseplateDialogOpen}
          onOpenChange={setIsBaseplateDialogOpen}
          onBaseplateSelect={(type, option) => {
            window.dispatchEvent(new CustomEvent('create-baseplate', {
              detail: {
                type,
                option,
                dimensions: { padding: 10, height: 10 }
              }
            }));
            setIsBaseplateDialogOpen(false);
          }}
          currentBaseplate={currentBaseplate}
          onRemoveBaseplate={handleBaseplateRemoved}
        />

        {/* Supports Panel */}
        <SupportsPanel
          open={isSupportsOpen}
          onClose={() => {
            setIsSupportsOpen(false);
            window.dispatchEvent(new Event('supports-cancel-placement'));
          }}
        />
      </div>
    );
  }
);

AppShell.displayName = "AppShell";

export default AppShell;
