import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, X, MapPin, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import MapLocationPicker from '@/components/MapLocationPicker';
import ThaiDateTimePicker from '@/components/ThaiDateTimePicker';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  assignedToId: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(1, 'Address is required'),
  }),
  geofenceRadius: z.number().min(10).max(1000),
  checklist: z.array(
    z.object({
      text: z.string().min(1, 'Checklist item text is required'),
      required: z.boolean(),
      order: z.number(),
    })
  ),
  questions: z.array(
    z.object({
      text: z.string().min(1, 'Question text is required'),
      type: z.enum(['text', 'number', 'boolean', 'multiple_choice']),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
      order: z.number(),
    })
  ),
  photoRequirements: z.object({
    beforePhoto: z.boolean(),
    afterPhoto: z.boolean(),
    minPhotos: z.number().min(0),
  }),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const [showMapPicker, setShowMapPicker] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
      geofenceRadius: 50,
      location: {
        latitude: 0,
        longitude: 0,
        address: '',
      },
      checklist: [],
      questions: [],
      photoRequirements: {
        beforePhoto: true,
        afterPhoto: true,
        minPhotos: 2,
      },
    },
  });

  const {
    fields: checklistFields,
    append: appendChecklist,
    remove: removeChecklist,
  } = useFieldArray({
    control,
    name: 'checklist',
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control,
    name: 'questions',
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      // Transform camelCase to snake_case for backend
      const backendData = {
        title: data.title,
        description: data.description,
        assigned_to: data.assignedToId || null,
        due_date: data.dueDate,
        priority: data.priority,
        location_address: data.location.address,
        location_latitude: data.location.latitude,
        location_longitude: data.location.longitude,
        geofence_radius: data.geofenceRadius,
        before_photos_count: data.photoRequirements.beforePhoto ? 2 : 0,
        after_photos_count: data.photoRequirements.afterPhoto ? 2 : 0,
        checklist: data.checklist.map(item => ({
          item: item.text,
          is_critical: item.required,
          order: item.order
        })),
        questions: data.questions.map(q => ({
          question_text: q.text,
          question_type: q.type,
          required: q.required,
          options: q.options,
          order: q.order
        }))
      };
      const response = await api.post('/tasks', backendData);
      return response.data;
    },
    onSuccess: () => {
      navigate('/tasks');
    },
  });

  const onSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setValue('location.latitude', location.latitude);
    setValue('location.longitude', location.longitude);
    setValue('location.address', location.address);
  };

  const questionType = (index: number) => watch(`questions.${index}.type`);
  const currentLocation = watch('location');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task title"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task description"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  {...register('priority')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                {errors.priority && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.priority.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  {...register('assignedToId')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <ThaiDateTimePicker
                label="Due Date"
                required
                value={watch('dueDate')}
                onChange={(value) => setValue('dueDate', value)}
                error={errors.dueDate?.message}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Location
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                {...register('location.address')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address"
              />
              {errors.location?.address && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.location.address.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude *
                </label>
                <input
                  {...register('location.latitude', { valueAsNumber: true })}
                  type="number"
                  step="any"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
                {errors.location?.latitude && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.location.latitude.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude *
                </label>
                <input
                  {...register('location.longitude', { valueAsNumber: true })}
                  type="number"
                  step="any"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
                {errors.location?.longitude && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.location.longitude.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geofence Radius (m) *
                </label>
                <input
                  {...register('geofenceRadius', { valueAsNumber: true })}
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50"
                />
                {errors.geofenceRadius && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.geofenceRadius.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <MapPin className="h-4 w-4" />
              Pick location on map
            </button>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Checklist</h2>
            <button
              type="button"
              onClick={() =>
                appendChecklist({
                  text: '',
                  required: false,
                  order: checklistFields.length,
                })
              }
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>
          <div className="space-y-3">
            {checklistFields.map((field, index) => (
              <div key={field.id} className="flex gap-3">
                <input
                  {...register(`checklist.${index}.text`)}
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Checklist item"
                />
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
                  <input
                    {...register(`checklist.${index}.required`)}
                    type="checkbox"
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Required</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeChecklist(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
            {checklistFields.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No checklist items. Click "Add Item" to create one.
              </p>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
            <button
              type="button"
              onClick={() =>
                appendQuestion({
                  text: '',
                  type: 'text',
                  required: false,
                  options: [],
                  order: questionFields.length,
                })
              }
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </button>
          </div>
          <div className="space-y-4">
            {questionFields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex gap-3 mb-3">
                  <input
                    {...register(`questions.${index}.text`)}
                    type="text"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Question text"
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <select
                    {...register(`questions.${index}.type`)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Yes/No</option>
                    <option value="multiple_choice">Multiple Choice</option>
                  </select>
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
                    <input
                      {...register(`questions.${index}.required`)}
                      type="checkbox"
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                </div>
                {questionType(index) === 'multiple_choice' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Options (comma-separated)
                    </label>
                    <input
                      {...register(`questions.${index}.options`)}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Option 1, Option 2, Option 3"
                      onChange={(e) => {
                        const options = e.target.value
                          .split(',')
                          .map((opt) => opt.trim())
                          .filter(Boolean);
                        setValue(`questions.${index}.options`, options);
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            {questionFields.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No questions. Click "Add Question" to create one.
              </p>
            )}
          </div>
        </div>

        {/* Photo Requirements */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Photo Requirements
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                {...register('photoRequirements.beforePhoto')}
                type="checkbox"
                className="rounded"
              />
              <span className="text-gray-700">Require before photo</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                {...register('photoRequirements.afterPhoto')}
                type="checkbox"
                className="rounded"
              />
              <span className="text-gray-700">Require after photo</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum number of photos
              </label>
              <input
                {...register('photoRequirements.minPhotos', {
                  valueAsNumber: true,
                })}
                type="number"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Link
            to="/tasks"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createTaskMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
          </button>
        </div>

        {createTaskMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">
              Failed to create task. Please try again.
            </p>
          </div>
        )}
      </form>

      {/* Map Location Picker Modal */}
      {showMapPicker && (
        <MapLocationPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowMapPicker(false)}
          initialLocation={
            currentLocation.latitude && currentLocation.longitude
              ? currentLocation
              : undefined
          }
        />
      )}
    </div>
  );
}
