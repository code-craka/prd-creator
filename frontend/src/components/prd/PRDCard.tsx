import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, User, Eye, Share2, MoreHorizontal } from 'lucide-react';
import { PRDWithAuthor } from '../../services/prdService';

interface PRDCardProps {
  prd: PRDWithAuthor;
  onShare?: (prd: PRDWithAuthor) => void;
  onEdit?: (prd: PRDWithAuthor) => void;
  onDelete?: (prd: PRDWithAuthor) => void;
}

const PRDCard: React.FC<PRDCardProps> = ({ prd, onShare }) => {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {prd.title || 'Untitled PRD'}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(prd.created_at)}
              </span>
              {prd.author_name && (
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {prd.author_name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            prd.visibility === 'public' ? 'bg-green-100 text-green-800' :
            prd.visibility === 'team' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {prd.visibility}
          </span>
          
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-600 text-sm line-clamp-3">
          {prd.content ? prd.content.substring(0, 200) + '...' : 'No content available'}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onShare?.(prd)}
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </button>
          
          <span className="flex items-center space-x-1 text-gray-500">
            <Eye className="w-4 h-4" />
            <span className="text-sm">0</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to={`/prd/${prd.id}`}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PRDCard;