import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '../../api/documents';
import { DocumentCard } from './DocumentCard';
import { Loader2 } from 'lucide-react';

export const DocumentList: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.getAll(),
    refetchInterval: 5000, // Refetch every 5 seconds to check for summary updates
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load documents. Please try again.
      </div>
    );
  }

  if (!data || data.documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No documents yet</p>
        <p className="text-sm mt-2">Upload your first document to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} onDelete={refetch} />
      ))}
    </div>
  );
};

