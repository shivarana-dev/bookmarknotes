import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Cloud, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StorageModeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModeSelect: (mode: 'local' | 'cloud') => void;
}

export const StorageModeSelector: React.FC<StorageModeSelectorProps> = ({
  open,
  onOpenChange,
  onModeSelect
}) => {
  const [selectedMode, setSelectedMode] = useState<'local' | 'cloud' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has already selected a mode
    const savedMode = localStorage.getItem('storage-mode');
    if (savedMode && (savedMode === 'local' || savedMode === 'cloud')) {
      setSelectedMode(savedMode);
    }
  }, []);

  const handleModeSelect = (mode: 'local' | 'cloud') => {
    setSelectedMode(mode);
    localStorage.setItem('storage-mode', mode);
    onModeSelect(mode);
    
    toast({
      title: "Storage mode selected",
      description: `Using ${mode === 'local' ? 'Local Storage' : 'Cloud Storage'} mode`
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Choose Your Storage Option
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {/* Local Storage Option */}
          <Card className={`cursor-pointer transition-all border-2 ${selectedMode === 'local' ? 'border-primary' : 'border-border hover:border-muted-foreground'}`}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <HardDrive className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                Local Storage
                <Badge variant="secondary">FREE</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>100% Private - data stays on your device</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>No registration required</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Works offline</span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Limited storage space (~5-10MB)</span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>No sync across devices</span>
                </div>
              </div>
              
              <Button 
                onClick={() => handleModeSelect('local')}
                className="w-full"
                variant={selectedMode === 'local' ? 'default' : 'outline'}
              >
                Choose Local Storage
              </Button>
            </CardContent>
          </Card>

          {/* Cloud Storage Option */}
          <Card className={`cursor-pointer transition-all border-2 ${selectedMode === 'cloud' ? 'border-primary' : 'border-border hover:border-muted-foreground'}`}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Cloud className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                Cloud Storage
                <Badge variant="default">PREMIUM</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Unlimited storage space</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Sync across all devices</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Automatic backup & recovery</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Advanced sharing features</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </div>
              </div>
              
              <Button 
                onClick={() => handleModeSelect('cloud')}
                className="w-full"
                variant={selectedMode === 'cloud' ? 'default' : 'outline'}
              >
                Choose Cloud Storage
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-muted-foreground text-center mt-4">
          You can change this setting anytime in the app menu
        </div>
      </DialogContent>
    </Dialog>
  );
};