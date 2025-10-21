import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  X,
} from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Submission {
  id: string;
  task: {
    id: string;
    title: string;
    description: string;
    location_address: string;
  };
  worker: {
    id: string;
    name: string;
  };
  check_in_time: string;
  check_out_time: string | null;
  check_in_latitude: number;
  check_in_longitude: number;
  worker_notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  submitted_at: string | null;
  photos: Array<{
    id: string;
    photo_url: string;
    photo_type: 'before' | 'after' | 'other';
    uploaded_at: string;
  }>;
  checklist_items: Array<{
    id: string;
    checklist_item: {
      id: string;
      item: string;
      is_critical: boolean;
    };
    completed: boolean;
  }>;
  answers: Array<{
    id: string;
    question: {
      id: string;
      question_text: string;
      question_type: string;
    };
    answer_value: string;
  }>;
  review: {
    id: string;
    reviewer: {
      name: string;
    };
    status: 'approved' | 'rejected' | 'info_requested';
    comments: string;
    reviewed_at: string;
  } | null;
}

export default function SubmissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const response = await api.get(\`/submissions/\${id}\`);
      setSubmission(response.data);
    } catch (error) {
      console.error('Failed to fetch submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'info_requested':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      case 'info_requested':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'info_requested':
        return 'Info Requested';
      default:
        return 'Pending Review';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-line-green" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="card text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Submission not found</p>
          <button onClick={() => navigate('/tasks')} className="mt-4 btn btn-primary">
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  const beforePhotos = submission.photos.filter((p) => p.photo_type === 'before');
  const afterPhotos = submission.photos.filter((p) => p.photo_type === 'after');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-line-green text-white p-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-2">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-bold">Submission Details</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Status Card */}
        <div className={\`card border-2 \${getStatusColor(submission.status)}\`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(submission.status)}
            <div className="flex-1">
              <h3 className="font-bold">{getStatusText(submission.status)}</h3>
              {submission.submitted_at && (
                <p className="text-xs opacity-75">
                  Submitted: {format(new Date(submission.submitted_at), 'dd/MM/yyyy HH:mm')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Task Info */}
        <div className="card">
          <h2 className="font-bold text-lg mb-3">Task Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Task:</span>
              <p className="font-medium">{submission.task.title}</p>
            </div>
            <div>
              <span className="text-gray-600">Location:</span>
              <p className="font-medium">{submission.task.location_address}</p>
            </div>
          </div>
        </div>

        {/* Time Information */}
        <div className="card">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-line-green" />
            Time Tracking
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-medium">
                {format(new Date(submission.check_in_time), 'dd/MM/yyyy HH:mm')}
              </span>
            </div>
            {submission.check_out_time && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-medium">
                    {format(new Date(submission.check_out_time), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {Math.round(
                      (new Date(submission.check_out_time).getTime() -
                        new Date(submission.check_in_time).getTime()) /
                        (1000 * 60)
                    )}{' '}
                    minutes
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Photos */}
        {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
          <div className="card">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <Camera className="w-5 h-5 text-line-green" />
              Photos
            </h2>

            {beforePhotos.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  Before ({beforePhotos.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {beforePhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo.photo_url)}
                      className="aspect-square rounded-lg overflow-hidden"
                    >
                      <img
                        src={photo.photo_url}
                        alt="Before"
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {afterPhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  After ({afterPhotos.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {afterPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo.photo_url)}
                      className="aspect-square rounded-lg overflow-hidden"
                    >
                      <img
                        src={photo.photo_url}
                        alt="After"
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checklist */}
        {submission.checklist_items && submission.checklist_items.length > 0 && (
          <div className="card">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-line-green" />
              Checklist
            </h2>
            <div className="space-y-2">
              {submission.checklist_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{item.checklist_item.item}</p>
                    {item.checklist_item.is_critical && (
                      <span className="text-xs text-red-600">Critical</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answers */}
        {submission.answers && submission.answers.length > 0 && (
          <div className="card">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-line-green" />
              Questions & Answers
            </h2>
            <div className="space-y-3">
              {submission.answers.map((answer) => (
                <div key={answer.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {answer.question.question_text}
                  </p>
                  <p className="text-sm text-gray-900">{answer.answer_value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Worker Notes */}
        {submission.worker_notes && (
          <div className="card">
            <h2 className="font-bold mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-line-green" />
              Worker Notes
            </h2>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {submission.worker_notes}
            </p>
          </div>
        )}

        {/* Review Information */}
        {submission.review && (
          <div className="card border-2 border-gray-200">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-line-green" />
              Review
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Reviewer:</span>
                <span className="font-medium">{submission.review.reviewer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={\`font-medium \${
                    submission.review.status === 'approved'
                      ? 'text-green-600'
                      : submission.review.status === 'rejected'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }\`}
                >
                  {getStatusText(submission.review.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reviewed:</span>
                <span className="font-medium">
                  {format(new Date(submission.review.reviewed_at), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              {submission.review.comments && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Comments:</p>
                  <p className="text-sm text-gray-900">{submission.review.comments}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card">
          <button
            onClick={() => navigate(\`/tasks/\${submission.task.id}\`)}
            className="w-full btn btn-secondary"
          >
            View Task Details
          </button>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
