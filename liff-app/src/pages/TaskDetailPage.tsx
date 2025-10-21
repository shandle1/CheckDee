import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, CheckCircle2, FileText, Loader2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location_address: string;
  location_latitude: number;
  location_longitude: number;
  geofence_radius: number;
  due_date: string;
  checklist: Array<{ id: string; item: string; is_critical: boolean }>;
  questions: Array<{ id: string; question_text: string; question_type: string }>;
  submission: any;
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    navigate(`/check-in/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-line-green" />
      </div>
    );
  }

  if (!task) {
    return <div className="p-4">Task not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-line-green text-white p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-2">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-bold">{task.title}</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        <div className="card">
          <h2 className="font-semibold mb-2">รายละเอียด / Description</h2>
          <p className="text-gray-700">{task.description}</p>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            สถานที่ / Location
          </h2>
          <p className="text-gray-700">{task.location_address}</p>
          <p className="text-sm text-gray-500 mt-1">
            Geofence: {task.geofence_radius}m radius
          </p>
        </div>

        {/* Due Date */}
        <div className="card">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            ครบกำหนด / Due Date
          </h2>
          <p className="text-gray-700">{format(new Date(task.due_date), 'dd/MM/yyyy HH:mm')}</p>
        </div>

        {/* Checklist */}
        {task.checklist && task.checklist.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              รายการตรวจสอบ / Checklist
            </h2>
            <ul className="space-y-2">
              {task.checklist.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span className="flex-1">
                    {item.item}
                    {item.is_critical && (
                      <span className="ml-2 text-xs text-red-600">(Critical)</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Questions */}
        {task.questions && task.questions.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              คำถาม / Questions ({task.questions.length})
            </h2>
            <p className="text-sm text-gray-600">
              Answer these questions during task completion
            </p>
          </div>
        )}

        {/* Status */}
        {task.submission ? (
          <div className="card bg-green-50 border border-green-200">
            <p className="text-green-800 font-medium">✓ งานนี้ส่งแล้ว / Task Submitted</p>
            <button
              onClick={() => navigate(`/submission/${task.submission.id}`)}
              className="mt-2 text-sm text-green-600 underline"
            >
              View Submission
            </button>
          </div>
        ) : (
          <button
            onClick={handleCheckIn}
            className="w-full btn btn-primary text-lg py-4"
            disabled={task.status === 'completed'}
          >
            {task.status === 'in_progress' ? 'Continue Task' : 'Start Check-In'}
          </button>
        )}
      </div>
    </div>
  );
}
