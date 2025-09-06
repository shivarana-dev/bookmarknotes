import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Canvas as FabricCanvas, FabricImage, Rect } from 'fabric';
import { Camera, Upload, Download, RotateCw, Crop, Scan, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

interface DocumentScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (scannedImages: Blob[]) => void;
}

interface ScannedImage {
  id: string;
  blob: Blob;
  url: string;
  processed: boolean;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  open,
  onOpenChange,
  onSave
}) => {
  const [scannedImages, setScannedImages] = useState<ScannedImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const id = Date.now().toString();
        const url = URL.createObjectURL(blob);
        setScannedImages(prev => [...prev, {
          id,
          blob,
          url,
          processed: false
        }]);
        toast({
          title: "Image captured",
          description: "Document page captured successfully"
        });
      }
    }, 'image/jpeg', 0.9);
  }, [toast]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const id = Date.now().toString() + Math.random().toString();
        const url = URL.createObjectURL(file);
        setScannedImages(prev => [...prev, {
          id,
          blob: file,
          url,
          processed: false
        }]);
      }
    });

    toast({
      title: "Images uploaded",
      description: `${files.length} image(s) added to document`
    });
  };

  const enhanceImage = async (imageIndex: number) => {
    setIsProcessing(true);
    try {
      const image = scannedImages[imageIndex];
      
      // Create a canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Apply document enhancement filters
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Increase contrast and brightness for document scanning
        for (let i = 0; i < data.length; i += 4) {
          // Increase contrast
          data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * 1.5) + 128));     // Red
          data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * 1.5) + 128)); // Green
          data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * 1.5) + 128)); // Blue
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setScannedImages(prev => prev.map((img, idx) => 
              idx === imageIndex 
                ? { ...img, blob, url, processed: true }
                : img
            ));
            toast({
              title: "Image enhanced",
              description: "Document enhancement applied"
            });
          }
          setIsProcessing(false);
        }, 'image/jpeg', 0.95);
      };
      img.src = image.url;
    } catch (error) {
      toast({
        title: "Enhancement failed",
        description: "Could not enhance image",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const removeImage = (index: number) => {
    setScannedImages(prev => {
      const newImages = prev.filter((_, idx) => idx !== index);
      if (currentImageIndex >= newImages.length && newImages.length > 0) {
        setCurrentImageIndex(newImages.length - 1);
      }
      return newImages;
    });
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setScannedImages(prev => {
      const newImages = [...prev];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      return newImages;
    });
  };

  const exportAsPDF = async () => {
    if (scannedImages.length === 0) {
      toast({
        title: "No images",
        description: "Add some images to create a PDF",
        variant: "destructive"
      });
      return;
    }

    try {
      const pdf = new jsPDF();
      let isFirstPage = true;

      for (const scannedImage of scannedImages) {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = scannedImage.url;
        });

        if (!isFirstPage) {
          pdf.addPage();
        }

        // Maintain original image quality and dimensions
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;
        
        const pageWidth = pdf.internal.pageSize.getWidth() - 20;
        const pageHeight = pdf.internal.pageSize.getHeight() - 20;
        
        let finalWidth = originalWidth;
        let finalHeight = originalHeight;
        
        // Only scale down if necessary, never scale up
        if (originalWidth > pageWidth || originalHeight > pageHeight) {
          const scaleX = pageWidth / originalWidth;
          const scaleY = pageHeight / originalHeight;
          const scale = Math.min(scaleX, scaleY);
          
          finalWidth = originalWidth * scale;
          finalHeight = originalHeight * scale;
        }

        const x = (pdf.internal.pageSize.getWidth() - finalWidth) / 2;
        const y = (pdf.internal.pageSize.getHeight() - finalHeight) / 2;

        pdf.addImage(img, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'MEDIUM');
        isFirstPage = false;
      }

      const pdfBlob = pdf.output('blob');
      const fileName = `scanned_document_${Date.now()}.pdf`;
      saveAs(pdfBlob, fileName);
      
      toast({
        title: "PDF created",
        description: `Document saved as ${fileName}`
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not create PDF",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    stopCamera();
    if (onSave && scannedImages.length > 0) {
      onSave(scannedImages.map(img => img.blob));
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Document Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {/* Camera/Upload Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={cameraActive ? stopCamera : startCamera}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              {cameraActive ? 'Stop Camera' : 'Start Camera'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Images
            </Button>

            {scannedImages.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => enhanceImage(currentImageIndex)}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <Crop className="h-4 w-4" />
                  {isProcessing ? 'Enhancing...' : 'Enhance'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={exportAsPDF}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Export PDF
                </Button>
              </>
            )}
          </div>

          {/* Camera View */}
          {cameraActive && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-96 object-cover rounded-lg"
              />
              <Button
                onClick={captureImage}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                size="lg"
              >
                Capture
              </Button>
            </div>
          )}

          {/* Image Preview and Management */}
          {scannedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Page {currentImageIndex + 1} of {scannedImages.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                    disabled={currentImageIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentImageIndex(Math.min(scannedImages.length - 1, currentImageIndex + 1))}
                    disabled={currentImageIndex === scannedImages.length - 1}
                  >
                    Next
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(currentImageIndex)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="relative">
                <img
                  src={scannedImages[currentImageIndex]?.url}
                  alt={`Page ${currentImageIndex + 1}`}
                  className="w-full max-h-96 object-contain rounded-lg border"
                />
                {scannedImages[currentImageIndex]?.processed && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                    Enhanced
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {scannedImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 relative ${
                      index === currentImageIndex ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`Page ${index + 1}`}
                      className="w-16 h-20 object-cover rounded border"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {scannedImages.length > 0 ? 'Save & Close' : 'Cancel'}
          </Button>
        </DialogFooter>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};