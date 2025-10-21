import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Answer {
  questionId: string;
  questionText: string;
  answer: string | number | boolean;
}

interface Photo {
  id: string;
  url: string;
  type: 'before' | 'after' | 'other';
  uploadedAt: string;
}

interface Submission {
  id: string;
  taskId: string;
  task: {
    id: string;
    title: string;
    description: string;
    location: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: {
    id: string;
    name: string;
    email: string;
  };
  submittedAt: string;
  reviewedBy?: {
    id: string;
    name: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  checkInTime: string;
  checkInLocation: {
    latitude: number;
    longitude: number;
  };
  checkOutTime?: string;
  checkOutLocation?: {
    latitude: number;
    longitude: number;
  };
  checklist: ChecklistItem[];
  answers: Answer[];
  photos: Photo[];
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  const { data: submission, isLoading, error } = useQuery<Submission>({
    queryKey: ['submission', id],
    queryFn: async () => {
      const response = await api.get(`/submissions/${id}`);
      return response.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      action,
      notes,
    }: {
      action: 'approve' | 'reject';
      notes: string;
    }) => {
      const response = await api.post(`/submissions/${id}/review`, {
        status: action === 'approve' ? 'approved' : 'rejected',
        notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      setShowReviewModal(false);
      setReviewNotes('');
    },
  });

  const handleReview = () => {
    reviewMutation.mutate({ action: reviewAction, notes: reviewNotes });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load submission</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/submissions"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Submissions
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Submission Details
            </h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[submission.status]
              }`}
            >
              {submission.status}
            </span>
          </div>
          {submission.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setReviewAction('approve');
                  setShowReviewModal(true);
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => {
                  setReviewAction('reject');
                  setShowReviewModal(true);
                }}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Task Information
            </h2>
            <div className="space-y-3">
              <div>
                <Link
                  to={`/tasks/${submission.taskId}`}
                  className="text-lg font-medium text-blue-600 hover:text-blue-800"
                >
                  {submission.task.title}
                </Link>
                <p className="text-gray-700 mt-2">
                  {submission.task.description}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <p className="text-gray-900">{submission.task.location.address}</p>
              </div>
            </div>
          </div>

          {/* Check-in/out Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Check-in/out Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Check-in
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {new Date(submission.checkInTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {submission.checkInLocation.latitude.toFixed(6)},{' '}
                      {submission.checkInLocation.longitude.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>
              {submission.checkOutTime && submission.checkOutLocation && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Check-out
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {new Date(submission.checkOutTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {submission.checkOutLocation.latitude.toFixed(6)},{' '}
                        {submission.checkOutLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
            {submission.photos && submission.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {submission.photos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.url}
                      alt={`${photo.type} photo`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <span className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      {photo.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No photos uploaded</p>
              </div>
            )}
          </div>

          {/* Checklist */}
          {submission.checklist && submission.checklist.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Checklist Completion
              </h2>
              <div className="space-y-3">
                {submission.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <p className="text-gray-900">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answers */}
          {submission.answers && submission.answers.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Question Answers
              </h2>
              <div className="space-y-4">
                {submission.answers.map((answer, index) => (
                  <div key={answer.questionId} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">
                      {index + 1}. {answer.questionText}
                    </p>
                    <p className="text-gray-700">
                      {typeof answer.answer === 'boolean'
                        ? answer.answer
                          ? 'Yes'
                          : 'No'
                        : answer.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Information */}
          {(submission.reviewedBy || submission.reviewNotes) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Review Information
              </h2>
              <div className="space-y-3">
                {submission.reviewedBy && (
                  <div>
                    <span className="text-sm text-gray-600">Reviewed by:</span>
                    <p className="text-gray-900">{submission.reviewedBy.name}</p>
                  </div>
                )}
                {submission.reviewedAt && (
                  <div>
                    <span className="text-sm text-gray-600">Reviewed at:</span>
                    <p className="text-gray-900">
                      {new Date(submission.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {submission.reviewNotes && (
                  <div>
                    <span className="text-sm text-gray-600">Notes:</span>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                      {submission.reviewNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submission Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Submission Information
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Submitted By</span>
                </div>
                <p className="text-gray-900 ml-6">
                  {submission.submittedBy.name}
                </p>
                <p className="text-sm text-gray-500 ml-6">
                  {submission.submittedBy.email}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Submitted At</span>
                </div>
                <p className="text-gray-900 ml-6">
                  {new Date(submission.submittedAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Completion Stats
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Checklist Items</span>
                <span className="font-medium text-gray-900">
                  {submission.checklist?.filter((i) => i.completed).length || 0} /{' '}
                  {submission.checklist?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Questions Answered</span>
                <span className="font-medium text-gray-900">
                  {submission.answers?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Photos Uploaded</span>
                <span className="font-medium text-gray-900">
                  {submission.photos?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Submission
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes {reviewAction === 'reject' && '(required)'}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter review notes..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewMutation.isPending}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewMutation.isPending
                  ? 'Processing...'
                  : reviewAction === 'approve'
                  ? 'Approve'
                  : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
