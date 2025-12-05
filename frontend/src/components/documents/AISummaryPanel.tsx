import React from 'react';
import { Sparkles, Tag, ListChecks, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface AISummaryPanelProps {
  summary: {
    summaryText: string | null;
    keyPoints: string[] | null;
    keywords: string[] | null;
    status: string;
  };
  onRefresh?: () => void;
}

export const AISummaryPanel: React.FC<AISummaryPanelProps> = ({ summary, onRefresh }) => {
  if (summary.status === 'pending' || summary.status === 'processing') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          <div>
            <h3 className="font-semibold text-blue-900">AI Analysis in Progress</h3>
            <p className="text-sm text-blue-700">
              Generating summary and extracting key information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (summary.status === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-900">Analysis Failed</h3>
              <p className="text-sm text-red-700">
                Failed to generate AI summary. Please try again.
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 space-y-6">
      <div className="flex items-center space-x-2 text-purple-900">
        <Sparkles className="h-6 w-6" />
        <h3 className="text-xl font-bold">AI Analysis</h3>
      </div>

      {summary.summaryText && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
          <p className="text-gray-700 leading-relaxed">{summary.summaryText}</p>
        </div>
      )}

      {summary.keyPoints && summary.keyPoints.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <ListChecks className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Key Points</h4>
          </div>
          <ul className="space-y-2">
            {summary.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.keywords && summary.keywords.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Tag className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Keywords</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

