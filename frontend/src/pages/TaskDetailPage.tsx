import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  User,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

interface ChecklistItem {
  id: string;
  item: string;
  isCritical: boolean;
  order: number;
}

interface Question {
  id: string;
  questionText: string;
  questionType: 'text' | 'number' | 'boolean' | 'multiple_choice';
  required: boolean;
  options?: string[];
  order: number;
  helpText?: string;
  conditionalLogic?: any;
}

interface Submission {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  submittedBy: {
    id: string;
    name: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  geofenceRadius: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
  beforePhotosCount: number;
  afterPhotosCount: number;
  beforePhotosInstructions?: string;
  afterPhotosInstructions?: string;
  checklist: ChecklistItem[];
  questions: Question[];
  submission?: Submission;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: task, isLoading, error } = useQuery<Task>({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    },
  });

  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${id}`);
      navigate('/tasks');
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load task</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {task.title}
            </h1>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[task.status]
                }`}
              >
                {task.status.replace('_', ' ')}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  priorityColors[task.priority]
                }`}
              >
                {task.priority}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/tasks/${id}/edit`}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Description
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>

          {/* Map */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Location
            </h2>
            <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-gray-400" />
              <span className="ml-2 text-gray-500">
                Map: {task.location.latitude}, {task.location.longitude}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-900">{task.location.address}</p>
                <p className="text-sm text-gray-500">
                  Geofence radius: {task.geofenceRadius}m
                </p>
              </div>
            </div>
          </div>

          {/* Checklist */}
          {task.checklist && task.checklist.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Checklist
              </h2>
              <div className="space-y-3">
                {task.checklist
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <Circle className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-900">{item.item}</p>
                        {item.isCritical && (
                          <span className="text-xs text-red-600">
                            Critical
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Questions */}
          {task.questions && task.questions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Questions
              </h2>
              <div className="space-y-4">
                {task.questions
                  .sort((a, b) => a.order - b.order)
                  .map((question, index) => (
                    <div
                      key={question.id}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <p className="font-medium text-gray-900 mb-2">
                        {index + 1}. {question.questionText}
                        {question.required && (
                          <span className="text-red-600 ml-1">*</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Type: {question.questionType.replace('_', ' ')}
                      </p>
                      {question.options && question.options.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-1">
                            Options:
                          </p>
                          <ul className="list-disc list-inside text-sm text-gray-700">
                            {question.options.map((option, idx) => (
                              <li key={idx}>{option}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Submission */}
          {task.submission && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Submission
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      task.submission.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : task.submission.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {task.submission.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Submitted by:</span>
                  <span className="text-gray-900">
                    {task.submission.submittedBy.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Submitted at:</span>
                  <span className="text-gray-900">
                    {new Date(task.submission.submittedAt).toLocaleString()}
                  </span>
                </div>
                <Link
                  to={`/submissions/${task.submission.id}`}
                  className="inline-flex items-center justify-center w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Submission Details
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Task Information
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Assigned To</span>
                </div>
                <p className="text-gray-900 ml-6">
                  {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Due Date</span>
                </div>
                <p className="text-gray-900 ml-6">
                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Created</span>
                </div>
                <p className="text-gray-900 ml-6">
                  {new Date(task.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Photo Requirements */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Photo Requirements
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {task.beforePhotosCount > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-gray-700">
                  Before photos: {task.beforePhotosCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {task.afterPhotosCount > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-gray-700">
                  After photos: {task.afterPhotosCount}
                </span>
              </div>
              {task.beforePhotosInstructions && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700">
                  <strong>Before instructions:</strong> {task.beforePhotosInstructions}
                </div>
              )}
              {task.afterPhotosInstructions && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700">
                  <strong>After instructions:</strong> {task.afterPhotosInstructions}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Task
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this task? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
