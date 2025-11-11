import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Users as UsersIcon,
  Edit2,
  Save,
  X,
  UserPlus,
  UserMinus,
  Mail,
  Shield,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'team_leader' | 'field_worker';
  status: string;
  profile_photo?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  manager_name?: string;
  manager_email?: string;
  created_at: string;
  updated_at: string;
  members: TeamMember[];
}

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

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch team details
  const { data: team, isLoading, error } = useQuery<Team>({
    queryKey: ['team', id],
    queryFn: async () => {
      const response = await api.get(`/teams/${id}`);
      return response.data;
    },
  });

  // Fetch all users for adding members
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: showAddMemberModal,
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/teams/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsEditing(false);
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/teams/${id}/members`, { user_id: userId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowAddMemberModal(false);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/teams/${id}/members/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const onSubmit = (data: any) => {
    updateTeamMutation.mutate(data);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  const handleAddMember = (userId: string) => {
    addMemberMutation.mutate(userId);
  };

  const handleRemoveMember = (userId: string) => {
    if (confirm('Are you sure you want to remove this member from the team?')) {
      removeMemberMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load team details</p>
        </div>
      </div>
    );
  }

  // Get users not in this team
  const availableUsers = allUsers?.filter((user: any) =>
    !team.members.some(member => member.id === user.id)
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teams
        </Link>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600 mt-1">{team.members.length} members</p>
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
        {/* Left Column - Team Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Team Information</h2>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                  <input
                    {...register('name', { required: 'Team name is required' })}
                    type="text"
                    defaultValue={team.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    {...register('description')}
                    defaultValue={team.description}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateTeamMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  <Save className="h-4 w-4" />
                  {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                {team.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Description</p>
                    <p className="text-gray-600 mt-1">{team.description}</p>
                  </div>
                )}
                {team.manager_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Manager</p>
                    <p className="text-gray-600 mt-1">{team.manager_name}</p>
                    {team.manager_email && (
                      <p className="text-sm text-gray-500">{team.manager_email}</p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-gray-600 mt-1">{new Date(team.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Team Members */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Team Members ({team.members.length})</h2>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </button>
              </div>
            </div>

            <div className="p-6">
              {team.members.length > 0 ? (
                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {member.profile_photo ? (
                            <img src={member.profile_photo} alt={member.name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <Link to={`/users/${member.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                            {member.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{member.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
                          {roleLabels[member.role]}
                        </span>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removeMemberMutation.isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:bg-gray-100"
                          title="Remove from team"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No members in this team yet</p>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add First Member
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Add Team Member</h3>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {availableUsers.length > 0 ? (
                <div className="space-y-2">
                  {availableUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {user.profile_photo ? (
                            <img src={user.profile_photo} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{user.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role as keyof typeof roleColors]}`}>
                          {roleLabels[user.role as keyof typeof roleLabels]}
                        </span>
                        <button
                          onClick={() => handleAddMember(user.id)}
                          disabled={addMemberMutation.isPending}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">All users are already in this team</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
