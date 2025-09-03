import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  FolderPlus, 
  FilePlus, 
  Upload, 
  Folder, 
  File, 
  ArrowLeft,
  MoreHorizontal,
  Edit2,
  Trash2,
  Camera as CameraIcon,
  Download,
  Eye,
  DownloadCloud
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface File {
  id: string;
  name: string;
  type: string;
  content: string | null;
  file_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  folder_id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Simple UUID generator for browser compatibility
const generateId = () => {
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function FileExplorer() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteName, setNewNoteName] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingItem, setEditingItem] = useState<{ type: 'folder' | 'file', id: string, name: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [viewingFile, setViewingFile] = useState<File | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Sanitize name input to prevent path traversal and ensure valid names
  const sanitizeName = (name: string): string => {
    return name.trim().replace(/[/\\]/g, '').substring(0, 255);
  };

  const validateName = (name: string, type: string): boolean => {
    const sanitized = sanitizeName(name);
    if (!sanitized) {
      toast({
        title: "Error",
        description: `${type} name cannot be empty`,
        variant: "destructive"
      });
      return false;
    }
    if (sanitized !== name.trim()) {
      toast({
        title: "Error",
        description: `${type} name cannot contain / or \\ characters`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated !== null) {
      loadFolderContents();
    }
  }, [currentFolderId, isAuthenticated]);

  const loadFolderContents = async () => {
    try {
      setLoading(true);
      
      if (isAuthenticated === false) {
        // Load from localStorage for anonymous users
        const localFolders = JSON.parse(localStorage.getItem('bookmark_folders') || '[]');
        const localFiles = JSON.parse(localStorage.getItem('bookmark_files') || '[]');
        
        const filteredFolders = localFolders.filter((folder: Folder) => 
          currentFolderId ? folder.parent_id === currentFolderId : folder.parent_id === null
        );
        const filteredFiles = localFiles.filter((file: File) => 
          currentFolderId ? file.folder_id === currentFolderId : file.folder_id === null
        );
        
        setFolders(filteredFolders);
        setFiles(filteredFiles);
        
        // Update breadcrumb path for local storage
        if (currentFolderId) {
          const folderData = localFolders.find((f: Folder) => f.id === currentFolderId);
          if (folderData) {
            const path = await buildPathLocal(folderData, localFolders);
            setCurrentPath(path);
          }
        } else {
          setCurrentPath([]);
        }
        
        setLoading(false);
        return;
      }
      
      if (isAuthenticated === null) {
        setLoading(false);
        return;
      }
      
      // Load folders - handle null parent_id properly
      let foldersQuery = supabase
        .from('folders')
        .select('*');
      
      if (currentFolderId) {
        foldersQuery = foldersQuery.eq('parent_id', currentFolderId);
      } else {
        foldersQuery = foldersQuery.is('parent_id', null);
      }
      
      const { data: foldersData, error: foldersError } = await foldersQuery.order('name');

      if (foldersError) throw foldersError;
      setFolders(foldersData || []);

      // Load files - handle null folder_id properly
      let filesQuery = supabase
        .from('files')
        .select('*');
        
      if (currentFolderId) {
        filesQuery = filesQuery.eq('folder_id', currentFolderId);
      } else {
        filesQuery = filesQuery.is('folder_id', null);
      }
      
      const { data: filesData, error: filesError } = await filesQuery.order('name');

      if (filesError) throw filesError;
      setFiles(filesData || []);

      // Update breadcrumb path
      if (currentFolderId) {
        const { data: folderData, error: folderError } = await supabase
          .from('folders')
          .select('*')
          .eq('id', currentFolderId)
          .single();

        if (!folderError && folderData) {
          // Build full path
          const path = await buildPath(folderData);
          setCurrentPath(path);
        }
      } else {
        setCurrentPath([]);
      }
    } catch (error) {
      toast({
        title: "Error loading contents",
        description: "Could not load folder contents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const buildPath = async (folder: Folder): Promise<Folder[]> => {
    const path = [folder];
    let currentFolder = folder;
    
    while (currentFolder.parent_id) {
      const { data: parentData } = await supabase
        .from('folders')
        .select('*')
        .eq('id', currentFolder.parent_id)
        .single();
      
      if (parentData) {
        path.unshift(parentData);
        currentFolder = parentData;
      } else {
        break;
      }
    }
    
    return path;
  };

  const buildPathLocal = async (folder: Folder, allFolders: Folder[]): Promise<Folder[]> => {
    const path = [folder];
    let currentFolder = folder;
    
    while (currentFolder.parent_id) {
      const parentData = allFolders.find(f => f.id === currentFolder.parent_id);
      
      if (parentData) {
        path.unshift(parentData);
        currentFolder = parentData;
      } else {
        break;
      }
    }
    
    return path;
  };

  const createFolder = async () => {
    if (!validateName(newFolderName, "Folder")) return;

    const sanitizedName = sanitizeName(newFolderName);

    try {
      if (isAuthenticated === false) {
        // Store in localStorage for anonymous users
        const newFolder: Folder = {
          id: generateId(),
          name: sanitizedName,
          parent_id: currentFolderId,
          user_id: 'anonymous',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const existingFolders = JSON.parse(localStorage.getItem('bookmark_folders') || '[]');
        existingFolders.push(newFolder);
        localStorage.setItem('bookmark_folders', JSON.stringify(existingFolders));
        
        setNewFolderName('');
        setShowNewFolder(false);
        loadFolderContents();
        toast({
          title: "Folder created",
          description: `Created folder "${sanitizedName}"`
        });
        return;
      }

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id || 'anonymous';
      
      const { error } = await supabase
        .from('folders')
        .insert([{
          name: sanitizedName,
          parent_id: currentFolderId,
          user_id: userId
        }]);

      if (error) throw error;

      setNewFolderName('');
      setShowNewFolder(false);
      loadFolderContents();
      toast({
        title: "Folder created",
        description: `Created folder "${sanitizedName}"`
      });
    } catch (error) {
      toast({
        title: "Error creating folder",
        description: "Could not create folder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const createNote = async () => {
    if (!validateName(newNoteName, "Note")) return;
    
    const sanitizedName = sanitizeName(newNoteName);

    try {
      if (isAuthenticated === false) {
        // Store in localStorage for anonymous users
        const newFile: File = {
          id: generateId(),
          name: sanitizedName,
          type: 'note',
          content: newNoteContent,
          file_path: null,
          mime_type: null,
          file_size: null,
          folder_id: currentFolderId || null,
          user_id: 'anonymous',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const existingFiles = JSON.parse(localStorage.getItem('bookmark_files') || '[]');
        existingFiles.push(newFile);
        localStorage.setItem('bookmark_files', JSON.stringify(existingFiles));
        
        setNewNoteName('');
        setNewNoteContent('');
        setShowNewNote(false);
        loadFolderContents();
        toast({
          title: "Note created",
          description: `Created note "${sanitizedName}"`
        });
        return;
      }

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id || 'anonymous';
      
      const { error } = await supabase
        .from('files')
        .insert([{
          name: sanitizedName,
          type: 'note',
          content: newNoteContent,
          folder_id: currentFolderId,
          user_id: userId
        }]);

      if (error) throw error;

      setNewNoteName('');
      setNewNoteContent('');
      setShowNewNote(false);
      loadFolderContents();
      toast({
        title: "Note created",
        description: `Created note "${sanitizedName}"`
      });
    } catch (error) {
      toast({
        title: "Error creating note",
        description: "Could not create note. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Process multiple files
    const fileArray = Array.from(files);
    let successCount = 0;
    let errorCount = 0;

    for (const file of fileArray) {
      try {
        if (isAuthenticated === false) {
          // For anonymous users, store as base64 in localStorage (limited to small files)
          if (file.size > 1024 * 1024) { // 1MB limit for localStorage
            errorCount++;
            continue;
          }
          
          const reader = new FileReader();
          reader.onload = () => {
            const newFile: File = {
              id: generateId(),
              name: file.name,
              type: 'upload',
              content: reader.result as string,
              file_path: null,
              mime_type: file.type,
              file_size: file.size,
              folder_id: currentFolderId || null,
              user_id: 'anonymous',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const existingFiles = JSON.parse(localStorage.getItem('bookmark_files') || '[]');
            existingFiles.push(newFile);
            localStorage.setItem('bookmark_files', JSON.stringify(existingFiles));
            
            successCount++;
            if (successCount + errorCount === fileArray.length) {
              loadFolderContents();
              if (successCount > 0) {
                toast({
                  title: "Files uploaded",
                  description: `Successfully uploaded ${successCount} file(s)${errorCount > 0 ? `. ${errorCount} file(s) were too large.` : ''}`
                });
              }
            }
          };
          reader.readAsDataURL(file);
        } else {
          const user = await supabase.auth.getUser();
          const userId = user.data.user?.id || 'anonymous';
          
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const filePath = `${userId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('study-materials')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase
            .from('files')
            .insert([{
              name: file.name,
              type: 'upload',
              file_path: filePath,
              mime_type: file.type,
              file_size: file.size,
              folder_id: currentFolderId,
              user_id: userId
            }]);

          if (dbError) throw dbError;
          successCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    if (isAuthenticated !== false) {
      loadFolderContents();
      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${successCount} file(s)${errorCount > 0 ? `. ${errorCount} file(s) failed.` : ''}`
      });
    }
  };

  const handleCameraUpload = async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera not available",
          description: "Camera functionality is not supported in this browser.",
          variant: "destructive"
        });
        return;
      }

      // Create a file input that accepts camera
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use back camera if available
      
      // Handle file selection
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        try {
          await processUploadedFile(file);
        } catch (error) {
          toast({
            title: "Error processing photo",
            description: "Could not process the captured photo. Please try again.",
            variant: "destructive"
          });
        }
      };
      
      // Trigger file picker
      input.click();

    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera error",
        description: error instanceof Error ? error.message : "Could not access camera. Please try again.",
        variant: "destructive"
      });
    }
  };

  const processUploadedFile = async (file: File) => {
    try {
      const fileName = file.name || `photo_${Date.now()}.jpg`;

      if (isAuthenticated === false) {
        // For anonymous users, store as base64 in localStorage
        if (file.size > 1024 * 1024) { // 1MB limit for localStorage
          toast({
            title: "Photo too large",
            description: "Anonymous users can only upload photos up to 1MB. Please sign in for larger files.",
            variant: "destructive"
          });
          return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
          const newFile: File = {
            id: generateId(),
            name: fileName,
            type: 'upload',
            content: reader.result as string,
            file_path: null,
            mime_type: file.type,
            file_size: file.size,
            folder_id: currentFolderId || null,
            user_id: 'anonymous',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const existingFiles = JSON.parse(localStorage.getItem('bookmark_files') || '[]');
          existingFiles.push(newFile);
          localStorage.setItem('bookmark_files', JSON.stringify(existingFiles));
          
          loadFolderContents();
          toast({
            title: "File uploaded",
            description: `"${fileName}" uploaded successfully`
          });
        };
        reader.readAsDataURL(file);
        return;
      }

      // Upload the file for authenticated users
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id || 'anonymous';
      
      const fileExt = file.name.split('.').pop() || 'jpg';
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${userId}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('files')
        .insert([{
          name: fileName,
          type: 'upload',
          file_path: filePath,
          mime_type: file.type,
          file_size: file.size,
          folder_id: currentFolderId,
          user_id: userId
        }]);

      if (dbError) throw dbError;

      loadFolderContents();
      toast({
        title: "File uploaded",
        description: `"${fileName}" uploaded successfully`
      });
    } catch (error) {
      throw error;
    }
  };

  const renameItem = async () => {
    if (!editingItem) return;
    if (!validateName(newName, editingItem.type === 'folder' ? 'Folder' : 'File')) return;

    const sanitizedName = sanitizeName(newName);

    try {
      if (isAuthenticated === false) {
        // Update localStorage for anonymous users
        const storageKey = editingItem.type === 'folder' ? 'bookmark_folders' : 'bookmark_files';
        const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedItems = items.map((item: any) => 
          item.id === editingItem.id ? { ...item, name: sanitizedName, updated_at: new Date().toISOString() } : item
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedItems));
        
        setEditingItem(null);
        setNewName('');
        loadFolderContents();
        toast({
          title: `${editingItem.type === 'folder' ? 'Folder' : 'File'} renamed`,
          description: `Renamed to "${sanitizedName}"`
        });
        return;
      }

      const table = editingItem.type === 'folder' ? 'folders' : 'files';
      const { error } = await supabase
        .from(table)
        .update({ name: sanitizedName })
        .eq('id', editingItem.id);

      if (error) throw error;

      setEditingItem(null);
      setNewName('');
      loadFolderContents();
      toast({
        title: `${editingItem.type === 'folder' ? 'Folder' : 'File'} renamed`,
        description: `Renamed to "${sanitizedName}"`
      });
    } catch (error) {
      toast({
        title: "Error renaming item",
        description: "Could not rename item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadFile = async (file: File) => {
    try {
      if (file.type === 'note') {
        // Download note as text file
        const blob = new Blob([file.content || ''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (file.content && isAuthenticated === false) {
        // For anonymous users with base64 content
        const a = document.createElement('a');
        a.href = file.content;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (file.file_path && isAuthenticated !== false) {
        // Download uploaded file
        const { data, error } = await supabase.storage
          .from('study-materials')
          .download(file.file_path);

        if (error) throw error;

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Download started",
        description: `Downloading "${file.name}"`
      });
    } catch (error) {
      toast({
        title: "Error downloading file",
        description: "Could not download file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const viewFile = async (file: File) => {
    try {
      if (file.type === 'note') {
        setViewingFile(file);
        setShowFileViewer(true);
      } else if (file.file_path && isAuthenticated !== false) {
        // Get signed URL for viewing
        const { data, error } = await supabase.storage
          .from('study-materials')
          .createSignedUrl(file.file_path, 3600); // 1 hour expiry

        if (error) throw error;

        if (file.mime_type?.startsWith('image/')) {
          setViewingFile({ ...file, content: data.signedUrl });
          setShowFileViewer(true);
        } else {
          // Open in new tab for other file types
          window.open(data.signedUrl, '_blank');
        }
      } else if (file.content && isAuthenticated === false) {
        // For anonymous users, show the base64 content directly
        if (file.mime_type?.startsWith('image/')) {
          setViewingFile(file);
          setShowFileViewer(true);
        }
      }
    } catch (error) {
      toast({
        title: "Error viewing file",
        description: "Could not view file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadFolder = async (folder: Folder) => {
    try {
      if (isAuthenticated === false) {
        toast({
          title: "Feature not available",
          description: "Folder downloads are not available for anonymous users. Please sign in to access this feature.",
          variant: "destructive"
        });
        return;
      }

      const zip = new JSZip();
      const loadingToast = toast({
        title: "Preparing download...",
        description: "Collecting folder contents"
      });

      // Recursively get all files in the folder
      await addFolderToZip(zip, folder.id, folder.name);

      // Generate and download the zip file
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folder.name}.zip`);

      toast({
        title: "Download complete",
        description: `Downloaded "${folder.name}" as ZIP file`
      });
    } catch (error) {
      toast({
        title: "Error downloading folder",
        description: "Could not download folder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addFolderToZip = async (zip: JSZip, folderId: string, folderPath: string = '') => {
    // Skip for anonymous users - should not reach here due to guard above
    if (isAuthenticated === false) return;

    // Get all files in this folder
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('folder_id', folderId);

    if (filesError) throw filesError;

    // Add files to zip
    for (const file of files || []) {
      const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;
      
      if (file.type === 'note') {
        // Add note content as text file
        zip.file(`${filePath}.txt`, file.content || '');
      } else if (file.file_path) {
        // Download and add uploaded file
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('study-materials')
            .download(file.file_path);
          
          if (!downloadError && fileData) {
            zip.file(filePath, fileData);
          }
        } catch (error) {
          console.warn(`Could not download file: ${file.name}`, error);
        }
      }
    }

    // Get all subfolders
    const { data: subfolders, error: subfoldersError } = await supabase
      .from('folders')
      .select('*')
      .eq('parent_id', folderId);

    if (subfoldersError) throw subfoldersError;

    // Recursively add subfolders
    for (const subfolder of subfolders || []) {
      const subfolderPath = folderPath ? `${folderPath}/${subfolder.name}` : subfolder.name;
      await addFolderToZip(zip, subfolder.id, subfolderPath);
    }
  };

  const deleteItem = async (type: 'folder' | 'file', id: string, name: string) => {
    try {
      if (isAuthenticated === false) {
        // Delete from localStorage for anonymous users
        const storageKey = type === 'folder' ? 'bookmark_folders' : 'bookmark_files';
        const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedItems = items.filter((item: any) => item.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(updatedItems));
        
        loadFolderContents();
        toast({
          title: `${type === 'folder' ? 'Folder' : 'File'} deleted`,
          description: `Deleted "${name}"`
        });
        return;
      }

      if (type === 'folder') {
        const { error } = await supabase
          .from('folders')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('files')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }

      loadFolderContents();
      toast({
        title: `${type === 'folder' ? 'Folder' : 'File'} deleted`,
        description: `Deleted "${name}"`
      });
    } catch (error) {
      toast({
        title: "Error deleting item",
        description: "Could not delete item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const navigateUp = () => {
    if (currentPath.length > 1) {
      const parentFolder = currentPath[currentPath.length - 2];
      navigateToFolder(parentFolder.id);
    } else {
      navigateToFolder(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="w-full">
      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Back Button - Only show when in a folder */}
        {currentFolderId && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateUp}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              {currentPath.length > 0 ? `In: ${currentPath[currentPath.length - 1].name}` : 'Root'}
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
        <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
              <FolderPlus className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Folder</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 max-w-sm">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              />
              <div className="flex space-x-2">
                <Button onClick={createFolder} className="flex-1">Create</Button>
                <Button variant="outline" onClick={() => setShowNewFolder(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showNewNote} onOpenChange={setShowNewNote}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
              <FilePlus className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Note</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Note title"
                value={newNoteName}
                onChange={(e) => setNewNoteName(e.target.value)}
              />
              <Textarea
                placeholder="Note content"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-[150px] sm:min-h-[200px]"
              />
              <div className="flex space-x-2">
                <Button onClick={createNote} className="flex-1">Create</Button>
                <Button variant="outline" onClick={() => setShowNewNote(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="sm" asChild className="gap-1 sm:gap-2 flex-1 sm:flex-none">
          <label className="cursor-pointer">
            <Upload className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Upload</span>
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              multiple
            />
          </label>
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCameraUpload}
          className="gap-1 sm:gap-2 flex-1 sm:flex-none"
        >
          <CameraIcon className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Camera</span>
        </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 text-xs sm:text-sm overflow-x-auto">
        <button
          onClick={() => navigateToFolder(null)}
          className="text-primary hover:underline whitespace-nowrap"
        >
          Home
        </button>
        {currentPath.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <span className="text-muted-foreground">/</span>
            <button
              onClick={() => navigateToFolder(folder.id)}
              className="text-primary hover:underline whitespace-nowrap max-w-[100px] sm:max-w-none truncate"
            >
              {folder.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
        {/* Folders */}
        {folders.map((folder) => (
          <Card 
            key={folder.id} 
            className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
            onClick={() => navigateToFolder(folder.id)}
          >
            <CardHeader className="pb-1 p-3 sm:p-6 sm:pb-2">
              <div className="flex items-center justify-between">
                <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem({ type: 'folder', id: folder.id, name: folder.name });
                        setNewName(folder.name);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFolder(folder);
                      }}
                    >
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem('folder', folder.id, folder.name);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-xs sm:text-sm font-medium truncate">{folder.name}</p>
              <p className="text-xs text-muted-foreground">Folder</p>
            </CardContent>
          </Card>
        ))}

        {/* Files */}
        {files.map((file) => (
          <Card 
            key={file.id}
            className="hover:shadow-md transition-shadow active:scale-95 cursor-pointer"
            onClick={() => viewFile(file)}
          >
            <CardHeader className="pb-1 p-3 sm:p-6 sm:pb-2">
              <div className="flex items-center justify-between">
                <File className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        viewFile(file);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem({ type: 'file', id: file.id, name: file.name });
                        setNewName(file.name);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem('file', file.id, file.name);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-xs sm:text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{file.type}</p>
              {file.file_size && (
                <p className="text-xs text-muted-foreground">
                  {(file.file_size / 1024).toFixed(1)} KB
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {folders.length === 0 && files.length === 0 && !loading && (
          <div className="col-span-full text-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No items found</h3>
            <p className="text-sm text-muted-foreground">Create a folder or upload a file to get started</p>
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="mx-4 max-w-sm">
            <DialogHeader>
              <DialogTitle>Rename {editingItem.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="New name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && renameItem()}
              />
              <div className="flex space-x-2">
                <Button onClick={renameItem} className="flex-1">Rename</Button>
                <Button variant="outline" onClick={() => setEditingItem(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* File Viewer */}
      {viewingFile && (
        <Sheet open={showFileViewer} onOpenChange={setShowFileViewer}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{viewingFile.name}</SheetTitle>
              <SheetDescription>
                {viewingFile.type === 'note' ? 'Text Note' : 'File Content'}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              {viewingFile.type === 'note' ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                    {viewingFile.content || 'No content'}
                  </pre>
                </div>
              ) : viewingFile.mime_type?.startsWith('image/') ? (
                <div className="flex justify-center">
                  <img 
                    src={viewingFile.content || ''} 
                    alt={viewingFile.name}
                    className="max-w-full h-auto rounded-md"
                  />
                </div>
              ) : viewingFile.mime_type === 'application/pdf' ? (
                <div className="w-full h-[70vh]">
                  <iframe
                    src={viewingFile.content || ''}
                    className="w-full h-full border rounded-md"
                    title={viewingFile.name}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">File preview not available</p>
                  <Button 
                    onClick={() => downloadFile(viewingFile)} 
                    className="mt-4"
                  >
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}