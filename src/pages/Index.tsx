import AuthWrapper from '@/components/AuthWrapper';
import FileExplorer from '@/components/FileExplorer';

const Index = () => {
  return (
    <AuthWrapper>
      <FileExplorer />
    </AuthWrapper>
  );
};

export default Index;
