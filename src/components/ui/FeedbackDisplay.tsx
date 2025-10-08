import React from 'react';
import { Star, MessageSquare, User, Calendar, Eye, EyeOff } from 'lucide-react';
import { Card, CardBody } from './Card';
import { Badge } from './Badge';

interface FeedbackDisplayProps {
  feedback: {
    id: string;
    rating: number;
    comment?: string;
    share_user_details: boolean;
    created_at: string;
    employees?: {
      name: string;
      email: string;
    };
  };
  showUserDetails?: boolean; // Whether the current user can see user details
  className?: string;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  feedback,
  showUserDetails = false,
  className = ''
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= rating;
      
      return (
        <Star
          key={starValue}
          className={`w-4 h-4 ${
            isFilled 
              ? 'text-yellow-400 fill-current' 
              : 'text-gray-300'
          }`}
        />
      );
    });
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-blue-100 text-blue-800';
      case 5: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canShowUserDetails = showUserDetails && feedback.share_user_details;

  return (
    <Card className={`${className}`}>
      <CardBody className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="flex">
              {renderStars(feedback.rating)}
            </div>
            <Badge 
              variant="secondary" 
              className={`text-xs ${getRatingColor(feedback.rating)}`}
            >
              {getRatingText(feedback.rating)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(feedback.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* User Details */}
        {canShowUserDetails && feedback.employees && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 text-sm">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                {feedback.employees.name}
              </span>
              <span className="text-blue-700">
                ({feedback.employees.email})
              </span>
            </div>
          </div>
        )}

        {/* Privacy Indicator */}
        <div className="mb-3 flex items-center space-x-2 text-xs text-gray-500">
          {feedback.share_user_details ? (
            <>
              <Eye className="w-3 h-3" />
              <span>User details shared</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3" />
              <span>Anonymous feedback</span>
            </>
          )}
        </div>

        {/* Comment */}
        {feedback.comment && (
          <div className="mt-3">
            <div className="flex items-start space-x-2">
              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {feedback.comment}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No comment message */}
        {!feedback.comment && (
          <div className="text-sm text-gray-500 italic">
            No additional comments provided
          </div>
        )}
      </CardBody>
    </Card>
  );
};
