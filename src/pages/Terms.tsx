import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="container mx-auto max-w-4xl space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Terms & Conditions</h1>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            By accessing and using Bookmark, you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by the above, 
            please do not use this service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Use License</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Permission is granted to temporarily download one copy of Bookmark per device 
            for personal, non-commercial transitory viewing only. This is the grant of a 
            license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>modify or copy the materials</li>
            <li>use the materials for any commercial purpose or for any public display</li>
            <li>attempt to reverse engineer any software contained in Bookmark</li>
            <li>remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. User Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            You retain full ownership of your content. By uploading content to Bookmark, 
            you grant us permission to store, process, and display your content solely 
            for the purpose of providing our services to you.
          </p>
          <p>
            You are responsible for ensuring that your content does not violate any laws 
            or third-party rights. We reserve the right to remove content that violates 
            our terms or applicable laws.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Your privacy is important to us. Please review our Privacy Policy, which 
            also governs your use of the service, to understand our practices.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Service Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We strive to maintain high service availability but cannot guarantee 100% uptime. 
            We reserve the right to modify, suspend, or discontinue the service at any time 
            with reasonable notice.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            In no event shall Bookmark or its suppliers be liable for any damages 
            (including, without limitation, damages for loss of data or profit, or due to 
            business interruption) arising out of the use or inability to use Bookmark, 
            even if Bookmark or a Bookmark authorized representative has been notified 
            orally or in writing of the possibility of such damage.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            If you have any questions about these Terms & Conditions, please contact us 
            through our support channels available in the application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terms;