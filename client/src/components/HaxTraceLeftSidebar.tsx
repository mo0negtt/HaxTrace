import { useHaxTrace } from "@/contexts/HaxTraceContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MousePointer,
  Circle,
  Box,
  Undo2,
  Redo2,
  Download,
  Upload,
  Info,
  ExternalLink,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SiTiktok } from "react-icons/si";

export const HaxTraceLeftSidebar = () => {
  const {
    currentTool,
    setCurrentTool,
    undo,
    redo,
    canUndo,
    canRedo,
    importMap,
    exportMap,
  } = useHaxTrace();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creditsOpen, setCreditsOpen] = useState(false);

  const handleExport = () => {
    const exportedMap = exportMap();
    const dataStr = JSON.stringify(exportedMap, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "HaxTrace.hbs";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const mapData = JSON.parse(event.target?.result as string);
        importMap(mapData);
      } catch (error) {
        console.error("Error importing map:", error);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-1">
        <Separator className="w-10 mb-2" />

        <div className="flex flex-col items-center gap-1 mb-4">
          <Button
            data-testid="button-tool-pan"
            size="icon"
            variant={currentTool === "pan" ? "default" : "ghost"}
            onClick={() => setCurrentTool("pan")}
            title="Select / Pan"
            className="h-10 w-10"
          >
            <MousePointer className="w-4 h-4" />
          </Button>
          <Button
            data-testid="button-tool-vertex"
            size="icon"
            variant={currentTool === "vertex" ? "default" : "ghost"}
            onClick={() => setCurrentTool("vertex")}
            title="Add Vertex (V)"
            className="h-10 w-10"
          >
            <Circle className="w-4 h-4" />
          </Button>
          <Button
            data-testid="button-tool-segment"
            size="icon"
            variant={currentTool === "segment" ? "default" : "ghost"}
            onClick={() => setCurrentTool("segment")}
            title="Add Segment (S)"
            className="h-10 w-10"
          >
            <Box className="w-4 h-4" />
          </Button>
        </div>

        <Separator className="w-10 mb-2" />

        <div className="flex flex-col items-center gap-1">
          <Button
            data-testid="button-undo"
            size="icon"
            variant="ghost"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="h-10 w-10"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            data-testid="button-redo"
            size="icon"
            variant="ghost"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="h-10 w-10"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        <Separator className="w-10 my-2" />

        <div className="flex flex-col items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".hbs,.json"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            data-testid="button-import"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            title="Import Map"
            className="h-10 w-10"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button
            data-testid="button-export"
            size="icon"
            variant="ghost"
            onClick={handleExport}
            title="Export Map"
            className="h-10 w-10"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex flex-col items-center gap-1">
          <Button
            data-testid="button-info"
            size="icon"
            variant="ghost"
            onClick={() => setCreditsOpen(true)}
            title="About"
            className="h-10 w-10"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={creditsOpen} onOpenChange={setCreditsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">HaxTrace</DialogTitle>
            <DialogDescription className="text-base">
              A modern map editor for Haxball
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">About</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                HaxTrace helps you create and edit Haxball maps with an intuitive
                interface and powerful tools.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Features</h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Visual map editor with real-time preview</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Keyboard shortcuts: 1/P (Pan), 2/V (Vertex), 3/S (Segment)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Multi-selection and batch operations (Ctrl+A, Ctrl+D)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Curved segments support with live editing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Background image overlay with opacity control</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Import/Export .hbs files with undo/redo</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Links</h3>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const win = window.open("https://mo0negtt.github.io/HaxPuck/", "_blank");
                    if (win) {
                      win.opener = null;
                    }
                  }}
                  className="flex items-center justify-start gap-2 h-9"
                  data-testid="button-haxpuck"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit HaxPuck
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const win = window.open("https://www.tiktok.com/@mo0negtt", "_blank");
                    if (win) {
                      win.opener = null;
                    }
                  }}
                  className="flex items-center justify-start gap-2 h-9"
                  data-testid="button-tiktok"
                >
                  <SiTiktok className="w-4 h-4" />
                  Visit TikTok
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
