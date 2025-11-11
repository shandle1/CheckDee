import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  Activity,
} from 'lucide-react';
import api from '@/lib/api';

interface OverviewStats {
  total_workers: number;
  total_teams: number;
  total_tasks: number;
  total_submissions: number;
  approved_submissions: number;
  pending_submissions: number;
  avg_quality_score: number;
  overdue_tasks: number;
}

interface WorkerPerformance {
  worker_id: string;
  worker_name: string;
  team_name: string;
  total_submissions: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  avg_quality_score: number;
  avg_completion_time: number;
  approval_rate: number;
}

interface TeamPerformance {
  team_id: string;
  team_name: string;
  manager_name: string;
  member_count: number;
  total_submissions: number;
  approved_count: number;
  avg_quality_score: number;
  avg_completion_time: number;
  completed_tasks: number;
  overdue_tasks: number;
}

export default function AnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');

  // Fetch overview statistics
  const { data: overview } = useQuery<OverviewStats>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const response = await api.get('/analytics/overview');
      return response.data;
    },
  });

  // Fetch worker performance
  const { data: workers } = useQuery<WorkerPerformance[]>({
    queryKey: ['analytics', 'workers'],
    queryFn: async () => {
      const response = await api.get('/analytics/workers?limit=10');
      return response.data;
    },
  });

  // Fetch team performance
  const { data: teams } = useQuery<TeamPerformance[]>({
    queryKey: ['analytics', 'teams'],
    queryFn: async () => {
      const response = await api.get('/analytics/teams');
      return response.data;
    },
  });

  // Fetch top performers
  const { data: topPerformers } = useQuery<WorkerPerformance[]>({
    queryKey: ['analytics', 'top-performers'],
    queryFn: async () => {
      const response = await api.get('/analytics/top-performers?metric=quality_score&limit=5');
      return response.data;
    },
  });

  const approvalRate = overview
    ? ((overview.approved_submissions / overview.total_submissions) * 100).toFixed(1)
    : '0';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        </div>
        <p className="text-gray-600">Comprehensive insights into platform performance and productivity</p>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {overview?.total_workers || 0}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Active Workers</h3>
          <p className="text-xs text-gray-500 mt-1">
            Across {overview?.total_teams || 0} teams
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {approvalRate}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Approval Rate</h3>
          <p className="text-xs text-gray-500 mt-1">
            {overview?.approved_submissions || 0} of {overview?.total_submissions || 0} submissions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {overview?.avg_quality_score?.toFixed(1) || 'N/A'}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Avg Quality Score</h3>
          <p className="text-xs text-gray-500 mt-1">
            Platform-wide average
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {overview?.overdue_tasks || 0}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Overdue Tasks</h3>
          <p className="text-xs text-gray-500 mt-1">
            Require attention
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Top Performers</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">By quality score</p>
          </div>
          <div className="p-6">
            {topPerformers && topPerformers.length > 0 ? (
              <div className="space-y-4">
                {topPerformers.map((worker, index) => (
                  <div key={worker.worker_id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {worker.worker_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {worker.team_name || 'No team'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-bold text-gray-900">
                            {worker.avg_quality_score?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {worker.total_submissions} submissions
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No performance data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Performance Summary */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Team Performance</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">Overall team statistics</p>
          </div>
          <div className="p-6">
            {teams && teams.length > 0 ? (
              <div className="space-y-4">
                {teams.slice(0, 5).map((team) => (
                  <div key={team.team_id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{team.team_name}</p>
                        <p className="text-xs text-gray-500">
                          {team.member_count} members · Manager: {team.manager_name || 'Unassigned'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Award className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-bold text-gray-900">
                            {team.avg_quality_score?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Submissions:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {team.total_submissions}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Approved:</span>
                        <span className="ml-1 font-medium text-green-600">
                          {team.approved_count}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Overdue:</span>
                        <span className="ml-1 font-medium text-red-600">
                          {team.overdue_tasks}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No team data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Worker Performance Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Worker Performance</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">Detailed worker statistics</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {workers && workers.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Submissions</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Approved</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quality Score</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Approval Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workers.map((worker) => (
                  <tr key={worker.worker_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{worker.worker_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{worker.team_name || 'No team'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900">{worker.total_submissions}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-green-600">{worker.approved_count}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {worker.avg_quality_score?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-900">
                          {worker.avg_completion_time?.toFixed(0) || 'N/A'}m
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        worker.approval_rate >= 80 ? 'bg-green-100 text-green-800' :
                        worker.approval_rate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {worker.approval_rate?.toFixed(1) || '0'}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No worker data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
