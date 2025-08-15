import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bookmark, Target, Users, Zap } from 'lucide-react';

const About = () => {
  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <img 
            src="/lovable-uploads/8a59dbbc-df78-4864-8163-6aaf2c63c051.png" 
            alt="Bookmark" 
            className="h-16 w-16 rounded-xl"
          />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">About Bookmark</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your personal digital organizer for study materials, documents, and important resources.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To provide students and professionals with a simple, efficient way to organize 
              and access their digital materials anytime, anywhere. We believe that good 
              organization leads to better learning and productivity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Hierarchical folder organization</li>
              <li>• File upload and management</li>
              <li>• Note-taking capabilities</li>
              <li>• Mobile-first responsive design</li>
              <li>• Secure cloud storage</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Why Choose Bookmark?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Bookmark className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Simple & Intuitive</h3>
              <p className="text-sm text-muted-foreground">Easy to use interface that gets out of your way</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Fast & Reliable</h3>
              <p className="text-sm text-muted-foreground">Lightning-fast performance with reliable cloud sync</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Privacy Focused</h3>
              <p className="text-sm text-muted-foreground">Your data is secure and private, always</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Get Started Today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Join thousands of students and professionals who have already organized their 
            digital life with Bookmark. Start creating folders, uploading files, and taking 
            notes to boost your productivity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;