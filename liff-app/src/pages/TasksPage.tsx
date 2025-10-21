import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, MapPin, Calendar, User2, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location_address: string;
  due_date: string;
  assigned_to_name: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      approved: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-line-green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-line-green text-white p-4">
        <h1 className="text-2xl font-bold">งานของฉัน</h1>
        <p className="text-sm opacity-90">My Tasks</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto">
          {['all', 'assigned', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                filter === status
                  ? 'text-line-green border-b-2 border-line-green'
                  : 'text-gray-600'
              }`}
            >
              {status === 'all' ? 'ทั้งหมด' : status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="p-4 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">ไม่มีงาน</p>
            <p className="text-sm text-gray-400">No tasks available</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <Link
              key={task.id}
              to={`/tasks/${task.id}`}
              className="block bg-white rounded-lg shadow-sm p-4 active:bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
                <div className="flex gap-1 ml-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{task.location_address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(task.due_date), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
