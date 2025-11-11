import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Users,
  Edit2,
  Save,
  X,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  TrendingUp,
  Activity,
  Map,
  Link as LinkIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import LINEStatusBadge from '@/components/LINEStatusBadge';
import InvitationModal from '@/components/InvitationModal';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'team_leader' | 'field_worker';
  team_id?: string;
  team_name?: string;
  status: 'active' | 'inactive';
  profile_photo?: string;
  created_at: string;
  updated_at: string;
  line_id?: string;
  line_display_name?: string;
  line_picture_url?: string;
  linked_at?: string;
}

interface TaskStats {
  total_assigned: string;
  pending: string;
  in_progress: string;
  completed: string;
  overdue: string;
  completed_this_week: string;
  completed_this_month: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  location_name: string;
  scheduled_start: string;
  scheduled_end: string;
  completed_at?: string;
  created_at: string;
  client_name?: string;
}

interface Submission {
  id: string;
  task_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  submitted_at: string;
  check_in_location?: any;
  check_in_time?: string;
  photos?: string[];
  quality_score?: number;
  task_title: string;
  task_location: string;
}

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  timestamp: string;
}

interface PerformanceMetrics {
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  averageQualityScore: number;
  scoredSubmissions: number;
  completionTrend: Array<{ month: string; completed_count: string }>;
  qualityTrend: Array<{ month: string; avg_quality: string }>;
}

interface LocationHistory {
  id: string;
  task_id: string;
  check_in_location: any;
  check_in_time: string;
  task_title: string;
  task_location: string;
  task_latitude?: number;
  task_longitude?: number;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const roleColors = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  team_leader: 'bg-indigo-100 text-indigo-800',
  field_worker: 'bg-green-100 text-green-800',
};

const roleLabels = {
  admin: 'Admin',
  manager: 'Manager',
  team_leader: 'Team Leader',
  field_worker: 'Field Worker',
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'submissions' | 'activity' | 'performance' | 'location'>('overview');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch user details
  const { data: userDetails, isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['user-details', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}/details`);
      return response.data;
    },
  });

  // Fetch all teams for dropdown
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get('/teams');
      return response.data;
    },
  });

  // Fetch task statistics
  const { data: taskStats } = useQuery<TaskStats>({
    queryKey: ['user-task-stats', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}/task-stats`);
      return response.data;
    },
    enabled: userDetails?.user?.role === 'field_worker',
  });

  // Fetch task history
  const { data: taskHistory } = useQuery({
    queryKey: ['user-task-history', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}/task-history`);
      return response.data;
    },
    enabled: activeTab === 'tasks' && userDetails?.user?.role === 'field_worker',
  });

  // Fetch submission history
  const { data: submissionHistory } = useQuery({
    queryKey: ['user-submission-history', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}/submission-history`);
      return response.data;
    },
    enabled: activeTab === 'submissions' && userDetails?.user?.role === 'field_worker',
  });

  // Fetch activity log
  const { data: activityLog } = useQuery({
    queryKey: ['user-activity-log', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}/activity-log`);
      return response.data;
    },
    enabled: activeTab === 'activity',
  });

  // Fetch performance metrics
  const { data: performanceMetrics } = useQuery<PerformanceMetrics>({
    queryKey: ['user-performance-metrics', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}/performance-metrics`);
      return response.data;
    },
    enabled: activeTab === 'performance' && userDetails?.user?.role === 'field_worker',
  });

  // Fetch location history
  const { data: locationHistory } = useQuery({
    queryKey: ['user-location-history', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}/location-history`);
      return response.data;
    },
    enabled: activeTab === 'location' && userDetails?.user?.role === 'field_worker',
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-details', id] });
      setIsEditing(false);
    },
  });

  // Unlink LINE account mutation
  const unlinkLineMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/users/${id}/unlink-line`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-details', id] });
    },
  });

  // Generate invite mutation
  const generateInviteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/users/${userId}/generate-invite`);
      return response.data;
    },
    onSuccess: (data) => {
      setInvitationData(data);
    },
  });

  const onSubmit = (data: any) => {
    updateUserMutation.mutate(data);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  const handleGenerateInvite = () => {
    setInvitationData(null);
    setShowInviteModal(true);
    if (id) {
      generateInviteMutation.mutate(id);
    }
  };

  const handleRegenerateInvite = () => {
    setInvitationData(null);
    if (id) {
      generateInviteMutation.mutate(id);
    }
  };

  const user = userDetails?.user as User | undefined;

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load user details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <UserIcon className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                  {roleLabels[user.role]}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" />
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    defaultValue={user.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    {...register('email', { required: 'Email is required' })}
                    type="email"
                    defaultValue={user.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    defaultValue={user.phone}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    {...register('role')}
                    defaultValue={user.role}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="team_leader">Team Leader</option>
                    <option value="field_worker">Field Worker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                  <select
                    {...register('team_id')}
                    defaultValue={user.team_id || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No team assigned</option>
                    {teams?.map((team: any) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    {...register('status')}
                    defaultValue={user.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  <Save className="h-4 w-4" />
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-4 w-4" />
                  <span>{roleLabels[user.role]}</span>
                </div>
                {user.team_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{user.team_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}

            {/* LINE Account Section */}
            {user.role === 'field_worker' && (
              <>
                <hr className="my-4" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">LINE Account</h3>
                  <LINEStatusBadge
                    linked={!!user.line_id}
                    displayName={user.line_display_name}
                    pictureUrl={user.line_picture_url}
                    linkedAt={user.linked_at}
                    showDetails={true}
                  />
                  {user.line_id ? (
                    <button
                      onClick={() => unlinkLineMutation.mutate()}
                      disabled={unlinkLineMutation.isPending}
                      className="mt-2 w-full px-3 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:bg-gray-100"
                    >
                      {unlinkLineMutation.isPending ? 'Unlinking...' : 'Unlink LINE Account'}
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateInvite}
                      className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Generate Invite
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Stats and Details */}
        <div className="lg:col-span-2">
          {/* Task Statistics Cards (for field workers) */}
          {user.role === 'field_worker' && taskStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Total Tasks</span>
                </div>
                <p className="text-2xl font-bold">{taskStats.total_assigned}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">In Progress</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{taskStats.in_progress}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Completed</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Overdue</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                {user.role === 'field_worker' && (
                  <>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        activeTab === 'tasks'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Tasks
                    </button>
                    <button
                      onClick={() => setActiveTab('submissions')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        activeTab === 'submissions'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Submissions
                    </button>
                    <button
                      onClick={() => setActiveTab('performance')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        activeTab === 'performance'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Performance
                    </button>
                    <button
                      onClick={() => setActiveTab('location')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        activeTab === 'location'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Location
                    </button>
                  </>
                )}
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'activity'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activity
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">User Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <p className="font-medium">{user.status === 'active' ? 'Active' : 'Inactive'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-medium">{roleLabels[user.role]}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Team</p>
                      <p className="font-medium">{user.team_name || 'No team assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="font-medium">{new Date(user.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks Tab */}
              {activeTab === 'tasks' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Task History</h3>
                  {taskHistory?.tasks?.length > 0 ? (
                    <div className="space-y-3">
                      {taskHistory.tasks.map((task: Task) => (
                        <Link
                          key={task.id}
                          to={`/tasks/${task.id}`}
                          className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                              {task.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {task.location_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(task.scheduled_start).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No tasks assigned yet.</p>
                  )}
                </div>
              )}

              {/* Submissions Tab */}
              {activeTab === 'submissions' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Submission History</h3>
                  {submissionHistory?.submissions?.length > 0 ? (
                    <div className="space-y-3">
                      {submissionHistory.submissions.map((submission: Submission) => (
                        <div key={submission.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{submission.task_title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                              submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {submission.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>Submitted: {new Date(submission.submitted_at).toLocaleString()}</p>
                            {submission.quality_score && (
                              <p>Quality Score: {submission.quality_score}/10</p>
                            )}
                            {submission.notes && <p>Notes: {submission.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No submissions yet.</p>
                  )}
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && performanceMetrics && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                      <p className="text-3xl font-bold text-blue-600">{performanceMetrics.completionRate}%</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {performanceMetrics.completedTasks} of {performanceMetrics.totalTasks} tasks
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Average Quality Score</p>
                      <p className="text-3xl font-bold text-green-600">{performanceMetrics.averageQualityScore}/10</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Based on {performanceMetrics.scoredSubmissions} scored submissions
                      </p>
                    </div>
                  </div>

                  {performanceMetrics.completionTrend.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Completion Trend (Last 6 Months)</h4>
                      <div className="space-y-2">
                        {performanceMetrics.completionTrend.map((item) => (
                          <div key={item.month} className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 w-32">
                              {new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-4">
                              <div
                                className="bg-blue-600 h-4 rounded-full"
                                style={{ width: `${Math.min((parseInt(item.completed_count) / performanceMetrics.totalTasks) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12">{item.completed_count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Location Tab */}
              {activeTab === 'location' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Location History</h3>
                  {locationHistory?.locations?.length > 0 ? (
                    <div className="space-y-3">
                      {locationHistory.locations.map((location: LocationHistory) => (
                        <div key={location.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium">{location.task_title}</h4>
                              <p className="text-sm text-gray-600">{location.task_location}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Check-in: {new Date(location.check_in_time).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No location history available.</p>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
                  {activityLog?.activities?.length > 0 ? (
                    <div className="space-y-3">
                      {activityLog.activities.map((activity: Activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 border-l-4 border-blue-500 bg-gray-50 rounded">
                          <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">{activity.action.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-gray-600">
                              {activity.entity_type && `${activity.entity_type}`}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No activity recorded yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Modal */}
      {showInviteModal && user.role === 'field_worker' && (
        <InvitationModal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setInvitationData(null);
          }}
          worker={{
            id: user.id,
            name: user.name,
            email: user.email,
          }}
          invitationData={invitationData}
          onRegenerate={handleRegenerateInvite}
          isGenerating={generateInviteMutation.isPending}
        />
      )}
    </div>
  );
}
