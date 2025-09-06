import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Canvas as FabricCanvas, FabricImage, Rect } from 'fabric';
import { toast } from 'sonner';
import { Share, RotateCw } from 'lucide-react';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (croppedImageBlob: Blob) => void;
}

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  open,
  onOpenChange,
  imageUrl,
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [originalImage, setOriginalImage] = useState<FabricImage | null>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!canvasRef.current || !open) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 600,
      height: 400,
      backgroundColor: '#f0f0f0',
    });

    setFabricCanvas(canvas);

    // Load the image
    FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous',
    }).then((img) => {
      // Scale image to fit canvas
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgAspect = img.width! / img.height!;
      const canvasAspect = canvasWidth / canvasHeight;

      let scale = Math.min(canvasWidth / img.width!, canvasHeight / img.height!) * 0.8;

      img.scale(scale);
      
      // Center the image
      img.set({
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: 'center',
        originY: 'center',
        angle: rotation
      });
      img.setCoords();
      img.selectable = false;
      img.evented = false;

      canvas.add(img);
      setOriginalImage(img);

      // Create crop rectangle
      const rect = new Rect({
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        width: 200,
        height: 200,
        fill: 'rgba(0,0,0,0.3)',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: true,
        hasControls: true,
        hasBorders: true,
        originX: 'center',
        originY: 'center'
      });

      canvas.add(rect);
      setCropRect(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
    });

    return () => {
      canvas.dispose();
    };
  }, [open, imageUrl, rotation]);

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Image',
          url: imageUrl
        });
      } catch (error) {
        // Fallback to copy to clipboard
        await navigator.clipboard.writeText(imageUrl);
        toast.success('Image URL copied to clipboard');
      }
    } else {
      // Fallback to copy to clipboard
      await navigator.clipboard.writeText(imageUrl);
      toast.success('Image URL copied to clipboard');
    }
  };

  const handleCrop = async () => {
    if (!fabricCanvas || !cropRect || !originalImage) {
      toast.error('Unable to crop image');
      return;
    }

    try {
      // Export the cropped area directly from Fabric.js canvas
      const cropLeft = cropRect.left! - cropRect.width! / 2;
      const cropTop = cropRect.top! - cropRect.height! / 2;
      const cropWidth = cropRect.width! * cropRect.scaleX!;
      const cropHeight = cropRect.height! * cropRect.scaleY!;

      const croppedDataURL = fabricCanvas.toDataURL({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight,
        multiplier: 1,
        format: 'png',
        quality: 1
      });

      // Convert data URL to blob
      const response = await fetch(croppedDataURL);
      const blob = await response.blob();

      onSave(blob);
      onOpenChange(false);
      toast.success('Image cropped successfully');
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Crop & Edit Image
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-center bg-gray-100 rounded-lg p-4">
          <canvas ref={canvasRef} className="border border-border rounded shadow-lg max-w-full max-h-[60vh]" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>
            Crop & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};