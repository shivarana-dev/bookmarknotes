import AuthWrapper from '@/components/AuthWrapper';
import FileExplorer from '@/components/FileExplorer';
import { Layout } from '@/components/Layout';

const Index = () => {
  return (
    <AuthWrapper>
      <Layout>
        <div className="w-full">
          <FileExplorer />
        </div>
      </Layout>
    </AuthWrapper>
  );
};

export default Index;
