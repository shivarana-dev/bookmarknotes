import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FolderPlus, 
  FilePlus, 
  Upload, 
  Folder, 
  File, 
  ArrowLeft,
  MoreHorizontal,
  Edit2,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
          folder_id: currentFolderId || '',
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
          folder_id: currentFolderId || '',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {currentFolderId && (
            <Button variant="outline" size="sm" onClick={navigateUp}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span 
              className="cursor-pointer hover:text-foreground"
              onClick={() => navigateToFolder(null)}
            >
              Home
            </span>
            {currentPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <span>/</span>
                <span 
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => navigateToFolder(folder.id)}
                >
                  {folder.name}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                  <Button onClick={createFolder}>Create</Button>
                  <Button variant="outline" onClick={() => setShowNewFolder(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewNote} onOpenChange={setShowNewNote}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FilePlus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
                  className="min-h-[200px]"
                />
                <div className="flex space-x-2">
                  <Button onClick={createNote}>Create</Button>
                  <Button variant="outline" onClick={() => setShowNewNote(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {folders.map((folder) => (
          <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center space-x-2 flex-1"
                  onClick={() => navigateToFolder(folder.id)}
                >
                  <Folder className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-sm truncate">{folder.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => deleteItem('folder', folder.id, folder.name)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
          </Card>
        ))}

        {files.map((file) => (
          <Card key={file.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  <File className="h-5 w-5 text-gray-500" />
                  <CardTitle className="text-sm truncate">{file.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => deleteItem('file', file.id, file.name)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            {file.type === 'note' && file.content && (
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {file.content}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {folders.length === 0 && files.length === 0 && (
        <div className="text-center py-16">
          <Folder className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items here yet</h3>
          <p className="text-muted-foreground mb-4">
            Start organizing your study materials by creating folders and adding files.
          </p>
        </div>
      )}
    </div>
  );
}