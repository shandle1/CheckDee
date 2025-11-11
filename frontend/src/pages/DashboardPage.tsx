import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ClipboardList,
  Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { getMapboxTileUrl, getMapboxAttribution } from '@/lib/mapbox';
import { formatThaiDate } from '@/lib/thaiDate';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo: {
    id: string;
    name: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: string;
}

interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  const { data: recentTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['recent-tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data.slice(0, 5); // Get first 5 tasks as recent
    },
  });

  const { data: taskLocations } = useQuery<Task[]>({
    queryKey: ['task-locations'],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data; // All tasks for map
    },
  });

  const statCards = [
    {
      name: 'Total Tasks',
      value: stats?.totalTasks ?? 0,
      icon: ClipboardList,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Pending',
      value: stats?.pendingTasks ?? 0,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Completed',
      value: stats?.completedTasks ?? 0,
      icon: CheckCircle2,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Overdue',
      value: stats?.overdueTasks ?? 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const getStatusBadgeColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Overview of your tasks and activities
        </p>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Tasks</h2>
          </div>
          <div className="px-6 py-4">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : recentTasks && recentTasks.length > 0 ? (
              <ul className="space-y-4">
                {recentTasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      to={`/tasks/${task.id}`}
                      className="block border-l-4 border-indigo-500 pl-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate hover:text-indigo-600">
                            {task.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            Assigned to: {task.assignedTo.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Due: {formatThaiDate(task.dueDate, { includeTime: true, shortFormat: true })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1 ml-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              task.status
                            )}`}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent tasks found
              </div>
            )}
          </div>
        </div>

        {/* Task Locations Map */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Task Locations</h2>
          </div>
          <div className="px-6 py-4">
            <div className="h-80 rounded-md overflow-hidden">
              {taskLocations && taskLocations.length > 0 ? (
                <MapContainer
                  center={[
                    taskLocations[0]?.location?.latitude ?? 0,
                    taskLocations[0]?.location?.longitude ?? 0,
                  ]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution={getMapboxAttribution()}
                    url={getMapboxTileUrl('streets-v12')}
                    tileSize={512}
                    zoomOffset={-1}
                  />
                  {taskLocations
                    .filter((task) => task.location)
                    .map((task) => (
                      <Marker
                        key={task.id}
                        position={[
                          task.location!.latitude,
                          task.location!.longitude,
                        ]}
                      >
                        <Popup>
                          <div className="p-2">
                            <Link
                              to={`/tasks/${task.id}`}
                              className="block hover:bg-gray-50 -m-2 p-2 rounded"
                            >
                              <h3 className="font-semibold text-sm text-indigo-600 hover:text-indigo-800">
                                {task.title}
                              </h3>
                              <p className="text-xs text-gray-600 mt-1">
                                {task.location!.address}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Status: {task.status}
                              </p>
                              <div className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                View Details →
                              </div>
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded-md">
                  <p className="text-gray-500">No task locations available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
