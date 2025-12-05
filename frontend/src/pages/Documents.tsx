import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { DocumentUpload } from '../components/documents/DocumentUpload';
import { DocumentList } from '../components/documents/DocumentList';
import { Upload, FileText } from 'lucide-react';

export const Documents: React.FC = () => {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showUpload ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            <span>{showUpload ? 'View Documents' : 'Upload Document'}</span>
          </button>
        </div>

        {showUpload ? (
          <DocumentUpload onUploadSuccess={() => setShowUpload(false)} />
        ) : (
          <DocumentList />
        )}
      </div>
    </Layout>
  );
};

