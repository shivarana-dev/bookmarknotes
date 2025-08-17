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
import { Camera } from '@capacitor/camera';
import { CameraResultType, CameraSource } from '@capacitor/camera';
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
  const { toast } = useToast();

  useEffect(() => {
    loadFolderContents();
  }, [currentFolderId]);

  const loadFolderContents = async () => {
    try {
      setLoading(true);
      
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

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from('folders')
        .insert([{
          name: newFolderName.trim(),
          parent_id: currentFolderId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      setNewFolderName('');
      setShowNewFolder(false);
      loadFolderContents();
      toast({
        title: "Folder created",
        description: `Created folder "${newFolderName}"`
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
    if (!newNoteName.trim()) return;

    try {
      const { error } = await supabase
        .from('files')
        .insert([{
          name: newNoteName.trim(),
          type: 'note',
          content: newNoteContent,
        folder_id: currentFolderId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      setNewNoteName('');
      setNewNoteContent('');
      setShowNewNote(false);
      loadFolderContents();
      toast({
        title: "Note created",
        description: `Created note "${newNoteName}"`
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
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${(await supabase.auth.getUser()).data.user?.id}/${fileName}`;

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
          user_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (dbError) throw dbError;

      loadFolderContents();
      toast({
        title: "File uploaded",
        description: `Uploaded "${file.name}"`
      });
    } catch (error) {
      toast({
        title: "Error uploading file",
        description: "Could not upload file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCameraUpload = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        // Convert data URL to blob
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new globalThis.File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

        // Upload the file
        const fileExt = 'jpg';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${(await supabase.auth.getUser()).data.user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('study-materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('files')
          .insert([{
            name: `Photo ${new Date().toLocaleDateString()}`,
            type: 'image',
            file_path: filePath,
            mime_type: 'image/jpeg',
            file_size: file.size,
            folder_id: currentFolderId,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }]);

        if (dbError) throw dbError;

        loadFolderContents();
        toast({
          title: "Photo uploaded",
          description: "Photo captured and uploaded successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error taking photo",
        description: "Could not capture photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renameItem = async () => {
    if (!editingItem || !newName.trim()) return;

    try {
      const table = editingItem.type === 'folder' ? 'folders' : 'files';
      const { error } = await supabase
        .from(table)
        .update({ name: newName.trim() })
        .eq('id', editingItem.id);

      if (error) throw error;

      setEditingItem(null);
      setNewName('');
      loadFolderContents();
      toast({
        title: `${editingItem.type === 'folder' ? 'Folder' : 'File'} renamed`,
        description: `Renamed to "${newName}"`
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
      } else if (file.file_path) {
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
      } else if (file.file_path) {
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
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
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
        {/* Navigate Up Button */}
        {currentFolderId && (
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
            onClick={navigateUp}
          >
            <CardHeader className="pb-1 p-3 sm:p-6 sm:pb-2">
              <div className="flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-xs sm:text-sm font-medium text-center">Go Back</p>
            </CardContent>
          </Card>
        )}

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