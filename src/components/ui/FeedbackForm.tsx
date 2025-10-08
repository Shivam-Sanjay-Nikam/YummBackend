import React, { useState } from 'react';
import { Star, MessageSquare, User, Eye, EyeOff } from 'lucide-react';
import { Button } from './Button';
import { Card, CardBody } from './Card';

interface FeedbackFormProps {
  orderId: string;
  onSubmit: (feedback: {
    rating: number;
    comment: string;
    share_user_details: boolean;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  existingFeedback?: {
    rating: number;
    comment: string;
    share_user_details: boolean;
  };
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  orderId,
  onSubmit,
  onCancel,
  isLoading = false,
  existingFeedback
}) => {
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [comment, setComment] = useState(existingFeedback?.comment || '');
  const [shareUserDetails, setShareUserDetails] = useState(existingFeedback?.share_user_details || false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    onSubmit({
      rating,
      comment: comment.trim(),
      share_user_details: shareUserDetails
    });
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= (hoveredRating || rating);
      
      return (
        <button
          key={starValue}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          disabled={isLoading}
          className={`p-1 transition-colors ${
            isFilled 
              ? 'text-yellow-400 hover:text-yellow-500' 
              : 'text-gray-300 hover:text-yellow-400'
          } ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Star className="w-6 h-6 fill-current" />
        </button>
      );
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardBody className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {existingFeedback ? 'Update Feedback' : 'Rate Your Order'}
          </h3>
          <p className="text-sm text-gray-600">
            Help us improve by sharing your experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate this order? *
            </label>
            <div className="flex justify-center space-x-1">
              {renderStars()}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              disabled={isLoading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Privacy Option */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {shareUserDetails ? (
                  <Eye className="w-5 h-5 text-blue-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareUserDetails}
                    onChange={(e) => setShareUserDetails(e.target.checked)}
                    disabled={isLoading}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Share my details with this feedback
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      If checked, vendors and staff will see your name and email along with this feedback. 
                      If unchecked, only the feedback content will be visible.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={rating === 0 || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Submitting...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
