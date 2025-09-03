import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy = () => {
  return (
    <div className="container mx-auto max-w-4xl space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">Personal Information</h4>
          <p>
            We collect information you provide directly to us, such as when you create 
            an account, upload files, or contact us for support. This may include:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Email address</li>
            <li>Account credentials</li>
            <li>Files and documents you upload</li>
            <li>Notes and content you create</li>
          </ul>

          <h4 className="font-semibold">Usage Information</h4>
          <p>
            We automatically collect certain information about how you use our service, 
            including access times, pages viewed, and the actions you take within the application.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, maintain, and improve our services</li>
            <li>Process and store your files securely</li>
            <li>Send you technical notices and support messages</li>
            <li>Monitor and analyze usage patterns to improve functionality</li>
            <li>Ensure the security and integrity of our service</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Information Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We do not sell, trade, or otherwise transfer your personal information to 
            third parties. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights, privacy, safety, or property</li>
            <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Data Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We implement appropriate security measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction. This includes:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
            <li>Secure cloud infrastructure</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Data Retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We retain your personal information for as long as necessary to provide our 
            services and fulfill the purposes outlined in this policy. You may delete 
            your account and associated data at any time through your account settings.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Your Rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and data</li>
            <li>Export your data</li>
            <li>Opt out of certain communications</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Updates to This Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We may update this privacy policy from time to time. We will notify you of 
            any changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            If you have any questions about this Privacy Policy, please contact us 
            through our support channels available in the application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Privacy;