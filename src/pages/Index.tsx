import AuthWrapper from '@/components/AuthWrapper';
import FileExplorer from '@/components/FileExplorer';

const Index = () => {
  return (
    <AuthWrapper>
      <div className="w-full">
        <FileExplorer />
      </div>
    </AuthWrapper>
  );
};

export default Index;
