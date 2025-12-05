import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { documentsApi } from '../../api/documents';
import { toast } from 'sonner';
import type { Document } from '../../types/document.types';

interface DocumentCardProps {
  document: Document;
  onDelete: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete }) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this document?')) return;

    setDeleting(true);
    try {
      await documentsApi.delete(document.id);
      toast.success('Document deleted successfully');
      onDelete();
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await documentsApi.download(document.id, document.filename);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const getStatusIcon = () => {
    switch (document.summaryStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div
      onClick={() => navigate(`/documents/${document.id}`)}
      className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white"
    >
      <div className="flex items-start justify-between mb-3">
        <FileText className="h-10 w-10 text-blue-500" />
        <div className="flex space-x-2">
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 hover:bg-red-50 rounded-full text-red-500"
            title="Delete"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-2 truncate" title={document.filename}>
        {document.filename}
      </h3>

      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
        {getStatusIcon()}
        <span className="capitalize">{document.summaryStatus}</span>
      </div>

      <p className="text-xs text-gray-500">
        {format(new Date(document.createdAt), 'MMM dd, yyyy HH:mm')}
      </p>

      {document.summaryText && (
        <p className="mt-3 text-sm text-gray-700 line-clamp-2">
          {document.summaryText}
        </p>
      )}
    </div>
  );
};

