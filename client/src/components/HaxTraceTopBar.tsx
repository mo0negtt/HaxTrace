import { useHaxTrace } from '@/contexts/HaxTraceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Undo2, 
  Redo2,
  Download,
  Upload,
  Info,
  ExternalLink,
  Settings
} from 'lucide-react';
import { SiTiktok } from 'react-icons/si';
import { useRef, useState } from 'react';

export const HaxTraceTopBar = () => {
  const {
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
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'iLoveHax.hbs';
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
        console.error('Error importing map:', error);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-6 py-3.5 bg-sidebar border-b border-sidebar-border">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">HaxTrace</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          data-testid="button-undo"
          size="sm"
          variant="ghost"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="h-9 w-9 p-0"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          data-testid="button-redo"
          size="sm"
          variant="ghost"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="h-9 w-9 p-0"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          data-testid="button-export"
          size="sm"
          variant="ghost"
          onClick={handleExport}
          title="Export HBS"
          className="h-9 rounded-lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button
          data-testid="button-import"
          size="sm"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          title="Import HBS"
          className="h-9 rounded-lg"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".hbs,.json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button
          data-testid="button-tiktok"
          size="sm"
          variant="default"
          onClick={() => window.open('https://www.tiktok.com/@mo0negtt', '_blank')}
          title="Visit TikTok"
          className="h-9 rounded-lg bg-black hover:bg-gray-900 text-white border-0"
        >
          <SiTiktok className="w-4 h-4 mr-2" />
          TikTok
        </Button>
        <Button
          data-testid="button-open-haxpuck"
          size="sm"
          variant="ghost"
          onClick={() => window.open('https://mo0negtt.github.io/haxpuck/', '_blank')}
          title="Open HaxPuck"
          className="h-9 rounded-lg"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          HaxPuck
        </Button>
        <Button
          data-testid="button-credits"
          size="sm"
          variant="ghost"
          onClick={() => setCreditsOpen(true)}
          title="Credits"
          className="h-9 w-9 p-0"
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={creditsOpen} onOpenChange={setCreditsOpen}>
        <DialogContent data-testid="dialog-credits">
          <DialogHeader>
            <DialogTitle>Credits</DialogTitle>
            <DialogDescription>
              iLoveHax
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Created by</p>
              <div className="flex flex-col gap-2 items-center">
                <p className="text-muted-foreground">@mo0negtt</p>
                <p className="text-muted-foreground">@mush</p>
                <img src="https://i.ibb.co/whCMYMNh/tp-white-1x1.png" alt="Team Packet logo" className="h-14 w-auto mt-2 object-contain max-w-full" loading="lazy" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
