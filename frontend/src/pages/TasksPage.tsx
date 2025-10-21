import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  MapPin,
  Calendar as CalendarIcon,
  User,
  AlertCircle,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import api from '@/lib/api';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
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
  dueDate: string;
  createdAt: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  assigned: 'bg-purple-100 text-purple-800 border-purple-300',
  in_progress: 'bg-brand-cyan/20 text-brand-cyan-dark border-brand-cyan',
  completed: 'bg-brand-emerald/20 text-brand-emerald-dark border-brand-emerald',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

type ViewMode = 'list' | 'calendar' | 'kanban';

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedUserFilter, setAssignedUserFilter] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const queryClient = useQueryClient();

  const { data: tasks, isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data;
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      // Transform camelCase to snake_case for backend
      const backendUpdates: any = {};
      if (updates.status) backendUpdates.status = updates.status;
      if (updates.dueDate) backendUpdates.due_date = updates.dueDate;
      if (updates.priority) backendUpdates.priority = updates.priority;
      if (updates.title) backendUpdates.title = updates.title;
      if (updates.description) backendUpdates.description = updates.description;

      const response = await api.put(`/tasks/${taskId}`, backendUpdates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignedUser =
      assignedUserFilter === 'all' ||
      task.assignedTo?.id === assignedUserFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignedUser;
  });

  const uniqueUsers = Array.from(
    new Set(tasks?.map((task) => task.assignedTo).filter(Boolean))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load tasks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-navy">Tasks</h1>
        <Link
          to="/tasks/new"
          className="flex items-center gap-2 bg-brand-cyan text-white px-4 py-2 rounded-lg hover:bg-brand-cyan-dark transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
          Create Task
        </Link>
      </div>

      {/* View Mode Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-1 inline-flex">
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            viewMode === 'list'
              ? 'bg-brand-cyan text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <List className="h-4 w-4" />
          List
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            viewMode === 'calendar'
              ? 'bg-brand-cyan text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
          Calendar
        </button>
        <button
          onClick={() => setViewMode('kanban')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            viewMode === 'kanban'
              ? 'bg-brand-cyan text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Kanban
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* Assigned User Filter */}
          <select
            value={assignedUserFilter}
            onChange={(e) => setAssignedUserFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map((user) => (
              <option key={user?.id} value={user?.id}>
                {user?.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Views */}
      {viewMode === 'list' && (
        <ListView tasks={filteredTasks || []} />
      )}
      {viewMode === 'calendar' && (
        <CalendarView
          tasks={filteredTasks || []}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          onTaskMove={(taskId, newDate) => {
            updateTaskMutation.mutate({
              taskId,
              updates: { dueDate: newDate.toISOString() },
            });
          }}
        />
      )}
      {viewMode === 'kanban' && (
        <KanbanView
          tasks={filteredTasks || []}
          onTaskMove={(taskId, newStatus) => {
            updateTaskMutation.mutate({
              taskId,
              updates: { status: newStatus },
            });
          }}
        />
      )}
    </div>
  );
}

// List View Component
function ListView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {tasks && tasks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-brand-cyan hover:text-brand-cyan-dark font-medium"
                    >
                      {task.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      {task.description.substring(0, 60)}
                      {task.description.length > 60 && '...'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[task.status]
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        priorityColors[task.priority]
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {task.assignedTo.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {task.location.address}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found</p>
        </div>
      )}
    </div>
  );
}

// Calendar View Component with Drag and Drop
function CalendarView({
  tasks,
  currentMonth,
  setCurrentMonth,
  onTaskMove,
}: {
  tasks: Task[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  onTaskMove: (taskId: string, newDate: Date) => void;
}) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const dateString = over.id as string;
      const newDate = new Date(dateString);
      onTaskMove(active.id as string, newDate);
    }

    setActiveTask(null);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-brand-navy">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-medium text-gray-600 text-sm py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            const tasksForDay = getTasksForDate(day);
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <DroppableCalendarDay
                key={index}
                day={day}
                tasks={tasksForDay}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="bg-white rounded-lg p-2 shadow-lg border-2 border-brand-cyan">
            <div className="text-xs font-medium text-brand-navy">{activeTask.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable Calendar Day Component
function DroppableCalendarDay({
  day,
  tasks,
  isCurrentMonth,
  isToday,
}: {
  day: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-24 border rounded-lg p-2 transition-colors ${
        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
      } ${
        isToday ? 'border-brand-cyan border-2' : 'border-gray-200'
      } ${
        isOver ? 'bg-brand-lavender border-brand-cyan' : ''
      }`}
    >
      <div className={`text-sm font-medium mb-1 ${
        isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
      } ${
        isToday ? 'text-brand-cyan font-bold' : ''
      }`}>
        {day.getDate()}
      </div>
      <div className="space-y-1">
        {tasks.slice(0, 3).map(task => (
          <DraggableCalendarTask key={task.id} task={task} />
        ))}
        {tasks.length > 3 && (
          <div className="text-xs text-gray-500 px-2">
            +{tasks.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

// Draggable Calendar Task Component
function DraggableCalendarTask({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: task.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`block text-xs px-2 py-1 rounded border truncate cursor-move ${
        statusColors[task.status]
      }`}
    >
      {task.title}
    </div>
  );
}

// Kanban View Component with Drag and Drop
function KanbanView({
  tasks,
  onTaskMove,
}: {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: Task['status']) => void;
}) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns: { status: Task['status']; title: string }[] = [
    { status: 'pending', title: 'Pending' },
    { status: 'assigned', title: 'Assigned' },
    { status: 'in_progress', title: 'In Progress' },
    { status: 'completed', title: 'Completed' },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const newStatus = over.id as Task['status'];
      onTaskMove(active.id as string, newStatus);
    }

    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(column => {
          const columnTasks = tasks.filter(task => task.status === column.status);

          return (
            <DroppableColumn
              key={column.status}
              column={column}
              tasks={columnTasks}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="bg-white rounded-lg p-4 shadow-xl border-2 border-brand-cyan w-64">
            <h4 className="font-medium text-brand-navy mb-2">{activeTask.title}</h4>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {activeTask.description}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className={`px-2 py-1 rounded-full ${priorityColors[activeTask.priority]}`}>
                {activeTask.priority}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable Column Component
function DroppableColumn({
  column,
  tasks,
}: {
  column: { status: Task['status']; title: string };
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 rounded-lg p-4 transition-colors ${
        isOver ? 'bg-brand-lavender border-2 border-brand-cyan' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-brand-navy">{column.title}</h3>
        <span className="bg-brand-lavender text-brand-navy text-xs font-medium px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map(task => (
          <DraggableKanbanTask key={task.id} task={task} />
        ))}

        {tasks.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            No tasks
          </p>
        )}
      </div>
    </div>
  );
}

// Draggable Kanban Task Component
function DraggableKanbanTask({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: task.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-brand-cyan cursor-move"
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex-1">
          <Link to={`/tasks/${task.id}`}>
            <h4 className="font-medium text-brand-navy mb-2 hover:text-brand-cyan">
              {task.title}
            </h4>
          </Link>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>

          <div className="flex items-center justify-between text-xs">
            <span className={`px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            {task.assignedTo && (
              <div className="flex items-center gap-1 text-gray-600">
                <User className="h-3 w-3" />
                <span>{task.assignedTo.name.split(' ')[0]}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
            <CalendarIcon className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
