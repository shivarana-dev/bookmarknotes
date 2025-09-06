import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ImageThumbnailProps {
  filePath: string;
  fileName: string;
  mimeType: string;
  className?: string;
}

export const ImageThumbnail: React.FC<ImageThumbnailProps> = ({ 
  filePath, 
  fileName, 
  mimeType, 
  className = "w-full h-32 object-cover rounded" 
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!filePath || !mimeType?.startsWith('image/')) {
      return;
    }

    const loadImage = async () => {
      try {
        // Use correct bucket name for image thumbnails with optimized loading
        const { data, error } = await supabase.storage
          .from('study-materials')
          .createSignedUrl(filePath, 7200, { // 2 hour expiry
            transform: {
              width: 400,
              height: 300,
              resize: 'contain',
              quality: 80
            }
          });

        if (error) throw error;
        setImageUrl(data?.signedUrl || null);
      } catch (err) {
        setError(true);
        console.error('Error loading image:', err);
      }
    };

    loadImage();
  }, [filePath, mimeType]);

  if (error || !mimeType?.startsWith('image/')) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <span className="text-muted-foreground text-sm text-center p-2">{fileName}</span>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`${className} bg-muted animate-pulse`} />
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={fileName}
      className={className}
      onError={() => setError(true)}
    />
  );
};