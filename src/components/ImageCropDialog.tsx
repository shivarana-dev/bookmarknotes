import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Canvas as FabricCanvas, FabricImage, Rect } from 'fabric';
import { toast } from 'sonner';

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

      let scale;
      if (imgAspect > canvasAspect) {
        scale = canvasWidth / img.width!;
      } else {
        scale = canvasHeight / img.height!;
      }

      img.scale(scale);
      
      // Center the image manually
      const canvasCenter = {
        x: canvasWidth / 2,
        y: canvasHeight / 2
      };
      img.set({
        left: canvasCenter.x - (img.width! * scale) / 2,
        top: canvasCenter.y - (img.height! * scale) / 2
      });
      img.setCoords();
      img.selectable = false;
      img.evented = false;

      canvas.add(img);
      setOriginalImage(img);

      // Create crop rectangle
      const rect = new Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
        fill: 'transparent',
        stroke: '#ff0000',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: true,
        hasControls: true,
        hasBorders: true,
      });

      canvas.add(rect);
      setCropRect(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
    });

    return () => {
      canvas.dispose();
    };
  }, [open, imageUrl]);

  const handleCrop = async () => {
    if (!fabricCanvas || !cropRect || !originalImage) {
      toast.error('Unable to crop image');
      return;
    }

    try {
      // Get crop area relative to the original image
      const imgLeft = originalImage.left!;
      const imgTop = originalImage.top!;
      const imgScaleX = originalImage.scaleX!;
      const imgScaleY = originalImage.scaleY!;

      const cropLeft = (cropRect.left! - imgLeft) / imgScaleX;
      const cropTop = (cropRect.top! - imgTop) / imgScaleY;
      const cropWidth = cropRect.width! / imgScaleX;
      const cropHeight = cropRect.height! / imgScaleY;

      // Create a new canvas for cropping
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const ctx = cropCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Load original image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw cropped portion
        ctx.drawImage(
          img,
          Math.max(0, cropLeft),
          Math.max(0, cropTop),
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        // Convert to blob
        cropCanvas.toBlob((blob) => {
          if (blob) {
            onSave(blob);
            onOpenChange(false);
            toast.success('Image cropped successfully');
          } else {
            toast.error('Failed to crop image');
          }
        }, 'image/png');
      };
      img.src = imageUrl;
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="border border-gray-300 rounded" />
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