export interface Document {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  summaryText: string | null;
  keyPoints: string[] | null;
  keywords: string[] | null;
  summaryStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface DocumentsResponse {
  documents: Document[];
  total: number;
  page: number;
  pages: number;
}

export interface DocumentSummary {
  summaryText: string | null;
  keyPoints: string[] | null;
  keywords: string[] | null;
  status: string;
}

