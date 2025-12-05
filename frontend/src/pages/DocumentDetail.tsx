import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '../api/documents';
import { Layout } from '../components/layout/Layout';
import { AISummaryPanel } from '../components/documents/AISummaryPanel';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: document, isLoading: docLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getById(id!),
    enabled: !!id,
  });

  const { data: summary, isLoading: summaryLoading, refetch } = useQuery({
    queryKey: ['document-summary', id],
    queryFn: () => documentsApi.getSummary(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const handleDownload = async () => {
    if (!document) return;
    try {
      await documentsApi.download(document.id, document.filename);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  if (docLoading || summaryLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </Layout>
    );
  }

  if (!document || !summary) {
    return (
      <Layout>
        <div className="text-center py-12 text-red-500">
          Document not found
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Document Details</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {document.filename}
              </h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Size: {(document.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                <p>Type: {document.mimeType}</p>
                <p>Uploaded: {format(new Date(document.createdAt), 'PPpp')}</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <AISummaryPanel summary={summary} onRefresh={refetch} />
      </div>
    </Layout>
  );
};

