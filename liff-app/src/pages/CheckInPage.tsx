import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Upload,
  X,
  Navigation,
} from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string;
  location_address: string;
  location_latitude: number;
  location_longitude: number;
  geofence_radius: number;
  before_photos_count: number;
  after_photos_count: number;
  before_photos_instructions?: string;
  after_photos_instructions?: string;
  checklist: Array<{
    id: string;
    item: string;
    is_critical: boolean;
    order: number;
  }>;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: 'text' | 'number' | 'yes_no' | 'multiple_choice' | 'rating';
    options?: any;
    required: boolean;
    help_text?: string;
    order: number;
  }>;
}

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

type WorkflowStep = 'check-in' | 'before-photos' | 'checklist' | 'questions' | 'work' | 'after-photos' | 'review';

export default function CheckInPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  // Task data
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('check-in');
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // GPS/Location state
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  // Photos state
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Checklist state
  const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>({});

  // Questions state
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Worker notes
  const [workerNotes, setWorkerNotes] = useState('');

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data);

      // Initialize checklist state
      const checklistState: Record<string, boolean> = {};
      response.data.checklist?.forEach((item: any) => {
        checklistState[item.id] = false;
      });
      setChecklistItems(checklistState);

      // Initialize answers state
      const answersState: Record<string, any> = {};
      response.data.questions?.forEach((q: any) => {
        answersState[q.id] = q.question_type === 'yes_no' ? null : '';
      });
      setAnswers(answersState);
    } catch (error) {
      console.error('Failed to fetch task:', error);
      alert('Failed to load task. Please try again.');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two GPS coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const Æ1 = (lat1 * Math.PI) / 180;
    const Æ2 = (lat2 * Math.PI) / 180;
    const ”Æ = ((lat2 - lat1) * Math.PI) / 180;
    const ”» = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(”Æ / 2) * Math.sin(”Æ / 2) +
      Math.cos(Æ1) * Math.cos(Æ2) * Math.sin(”» / 2) * Math.sin(”» / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(userPos);

        if (task) {
          const dist = calculateDistance(
            userPos.latitude,
            userPos.longitude,
            task.location_latitude,
            task.location_longitude
          );
          setDistance(dist);
        }

        setGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Failed to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCheckIn = async () => {
    if (!userLocation || !task) return;

    // Validate distance
    if (distance !== null && distance > task.geofence_radius) {
      alert(
        `You are too far from the task location (${Math.round(distance)}m away). You must be within ${task.geofence_radius}m.`
      );
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/submissions', {
        task_id: taskId,
        check_in_latitude: userLocation.latitude,
        check_in_longitude: userLocation.longitude,
        check_in_accuracy: userLocation.accuracy,
      });

      setSubmissionId(response.data.id);
      setCurrentStep('before-photos');
    } catch (error: any) {
      console.error('Check-in failed:', error);
      alert(error.response?.data?.message || 'Failed to check in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    if (type === 'before') {
      setBeforePhotos((prev) => [...prev, ...newFiles]);
    } else {
      setAfterPhotos((prev) => [...prev, ...newFiles]);
    }
  };

  const removePhoto = (index: number, type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforePhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAfterPhotos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const uploadPhotos = async (photos: File[], type: 'before' | 'after') => {
    if (!submissionId) return;

    setUploadingPhotos(true);
    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('photo', photo);
        formData.append('photo_type', type);

        await api.post(`/submissions/${submissionId}/photos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      throw error;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleNextStep = async () => {
    try {
      if (currentStep === 'before-photos') {
        if (!task || beforePhotos.length < task.before_photos_count) {
          alert(`Please capture at least ${task?.before_photos_count} before photos`);
          return;
        }
        setUploadingPhotos(true);
        await uploadPhotos(beforePhotos, 'before');
        setUploadingPhotos(false);
        setCurrentStep(task.checklist.length > 0 ? 'checklist' : task.questions.length > 0 ? 'questions' : 'work');
      } else if (currentStep === 'checklist') {
        // Validate critical items
        const uncompletedCritical = task?.checklist.filter(
          (item) => item.is_critical && !checklistItems[item.id]
        );
        if (uncompletedCritical && uncompletedCritical.length > 0) {
          alert('Please complete all critical checklist items');
          return;
        }
        setCurrentStep(task?.questions.length! > 0 ? 'questions' : 'work');
      } else if (currentStep === 'questions') {
        // Validate required questions
        const unanswered = task?.questions.filter(
          (q) => q.required && (!answers[q.id] || answers[q.id] === '')
        );
        if (unanswered && unanswered.length > 0) {
          alert('Please answer all required questions');
          return;
        }
        setCurrentStep('work');
      } else if (currentStep === 'work') {
        setCurrentStep('after-photos');
      } else if (currentStep === 'after-photos') {
        if (!task || afterPhotos.length < task.after_photos_count) {
          alert(`Please capture at least ${task?.after_photos_count} after photos`);
          return;
        }
        setUploadingPhotos(true);
        await uploadPhotos(afterPhotos, 'after');
        setUploadingPhotos(false);
        setCurrentStep('review');
      }
    } catch (error) {
      alert('Failed to proceed. Please try again.');
      setUploadingPhotos(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionId || !task) return;

    try {
      setSubmitting(true);

      // Submit checklist items
      if (task.checklist.length > 0) {
        const checklistData = Object.entries(checklistItems).map(([itemId, completed]) => ({
          checklist_item_id: itemId,
          completed,
        }));
        await api.post(`/submissions/${submissionId}/checklist`, { items: checklistData });
      }

      // Submit answers
      if (task.questions.length > 0) {
        const answersData = Object.entries(answers).map(([questionId, answer]) => ({
          question_id: questionId,
          answer_value: typeof answer === 'object' ? JSON.stringify(answer) : String(answer),
        }));
        await api.post(`/submissions/${submissionId}/answers`, { answers: answersData });
      }

      // Final submission with check-out location
      if (!userLocation) {
        alert('Please get your current location before submitting');
        return;
      }

      await api.put(`/submissions/${submissionId}`, {
        check_out_latitude: userLocation.latitude,
        check_out_longitude: userLocation.longitude,
        worker_notes: workerNotes,
        submitted_at: new Date().toISOString(),
      });

      alert('Task submitted successfully! <‰');
      navigate(`/submission/${submissionId}`);
    } catch (error: any) {
      console.error('Submission failed:', error);
      alert(error.response?.data?.message || 'Failed to submit task. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
      <div className="bg-line-green text-white p-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-2">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-bold">{task.title}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            {['check-in', 'before-photos', 'checklist', 'questions', 'work', 'after-photos', 'review'].map((step, index) => (
              <div
                key={step}
                className={`h-2 w-8 rounded-full ${
                  ['check-in', 'before-photos', 'checklist', 'questions', 'work', 'after-photos', 'review'].indexOf(currentStep) >= index
                    ? 'bg-white'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Check-in Step */}
        {currentStep === 'check-in' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-line-green" />
                Check-In Location
              </h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Task Location:</p>
                <p className="font-medium">{task.location_address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Allowed radius: {task.geofence_radius}m
                </p>
              </div>

              {locationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{locationError}</p>
                </div>
              )}

              {userLocation && distance !== null && (
                <div
                  className={`rounded-lg p-3 mb-4 ${
                    distance <= task.geofence_radius
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {distance <= task.geofence_radius ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p
                        className={`font-medium ${
                          distance <= task.geofence_radius ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        Distance: {Math.round(distance)}m
                      </p>
                      <p
                        className={`text-xs ${
                          distance <= task.geofence_radius ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {distance <= task.geofence_radius
                          ? ' Within allowed radius'
                          : ` Too far (must be within ${task.geofence_radius}m)`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Accuracy: ±{Math.round(userLocation.accuracy)}m
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full btn btn-secondary mb-3 flex items-center justify-center gap-2"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    Get My Location
                  </>
                )}
              </button>

              <button
                onClick={handleCheckIn}
                disabled={!userLocation || submitting || (distance !== null && distance > task.geofence_radius)}
                className="w-full btn btn-primary flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking in...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Check In
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Before Photos Step */}
        {currentStep === 'before-photos' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-line-green" />
                Before Photos
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Required: {task.before_photos_count} photos
              </p>
              {task.before_photos_instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">{task.before_photos_instructions}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mb-4">
                {beforePhotos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Before ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index, 'before')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <label className="w-full btn btn-secondary cursor-pointer flex items-center justify-center gap-2 mb-4">
                <Camera className="w-5 h-5" />
                Capture Photo ({beforePhotos.length}/{task.before_photos_count})
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoCapture(e, 'before')}
                  className="hidden"
                  multiple
                />
              </label>

              <button
                onClick={handleNextStep}
                disabled={beforePhotos.length < task.before_photos_count || uploadingPhotos}
                className="w-full btn btn-primary"
              >
                {uploadingPhotos ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Checklist Step */}
        {currentStep === 'checklist' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-line-green" />
                Checklist
              </h2>

              <div className="space-y-3 mb-4">
                {task.checklist
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={checklistItems[item.id] || false}
                        onChange={(e) =>
                          setChecklistItems((prev) => ({
                            ...prev,
                            [item.id]: e.target.checked,
                          }))
                        }
                        className="mt-1 w-5 h-5"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.item}</p>
                        {item.is_critical && (
                          <span className="text-xs text-red-600 font-medium">* Critical</span>
                        )}
                      </div>
                    </label>
                  ))}
              </div>

              <button onClick={handleNextStep} className="w-full btn btn-primary">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Questions Step */}
        {currentStep === 'questions' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-line-green" />
                Questions
              </h2>

              <div className="space-y-4 mb-4">
                {task.questions
                  .sort((a, b) => a.order - b.order)
                  .map((question) => (
                    <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                      <label className="block mb-2">
                        <span className="font-medium">
                          {question.question_text}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        {question.help_text && (
                          <span className="block text-xs text-gray-500 mt-1">
                            {question.help_text}
                          </span>
                        )}
                      </label>

                      {question.question_type === 'text' && (
                        <textarea
                          value={answers[question.id] || ''}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                          }
                          className="w-full p-2 border rounded-lg"
                          rows={3}
                        />
                      )}

                      {question.question_type === 'number' && (
                        <input
                          type="number"
                          value={answers[question.id] || ''}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                          }
                          className="w-full p-2 border rounded-lg"
                        />
                      )}

                      {question.question_type === 'yes_no' && (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={question.id}
                              checked={answers[question.id] === 'yes'}
                              onChange={() =>
                                setAnswers((prev) => ({ ...prev, [question.id]: 'yes' }))
                              }
                              className="w-4 h-4"
                            />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={question.id}
                              checked={answers[question.id] === 'no'}
                              onChange={() =>
                                setAnswers((prev) => ({ ...prev, [question.id]: 'no' }))
                              }
                              className="w-4 h-4"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      )}

                      {question.question_type === 'multiple_choice' && question.options && (
                        <div className="space-y-2">
                          {question.options.choices?.map((choice: string, index: number) => (
                            <label key={index} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={question.id}
                                checked={answers[question.id] === choice}
                                onChange={() =>
                                  setAnswers((prev) => ({ ...prev, [question.id]: choice }))
                                }
                                className="w-4 h-4"
                              />
                              <span>{choice}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {question.question_type === 'rating' && (
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [question.id]: rating }))
                              }
                              className={`w-12 h-12 rounded-lg font-bold ${
                                answers[question.id] === rating
                                  ? 'bg-line-green text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              <button onClick={handleNextStep} className="w-full btn btn-primary">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Work Step */}
        {currentStep === 'work' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Complete Your Work</h2>
              <p className="text-gray-600 mb-4">
                Complete the task work as described. When you're finished, proceed to capture after photos.
              </p>

              <div className="mb-4">
                <label className="block font-medium mb-2">
                  Work Notes (Optional)
                </label>
                <textarea
                  value={workerNotes}
                  onChange={(e) => setWorkerNotes(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  placeholder="Add any notes about the work completed..."
                />
              </div>

              <button onClick={handleNextStep} className="w-full btn btn-primary">
                Proceed to After Photos
              </button>
            </div>
          </div>
        )}

        {/* After Photos Step */}
        {currentStep === 'after-photos' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-line-green" />
                After Photos
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Required: {task.after_photos_count} photos
              </p>
              {task.after_photos_instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">{task.after_photos_instructions}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mb-4">
                {afterPhotos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`After ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index, 'after')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <label className="w-full btn btn-secondary cursor-pointer flex items-center justify-center gap-2 mb-4">
                <Camera className="w-5 h-5" />
                Capture Photo ({afterPhotos.length}/{task.after_photos_count})
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoCapture(e, 'after')}
                  className="hidden"
                  multiple
                />
              </label>

              <button
                onClick={handleNextStep}
                disabled={afterPhotos.length < task.after_photos_count || uploadingPhotos}
                className="w-full btn btn-primary"
              >
                {uploadingPhotos ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Review & Submit'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Review Submission</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Photos</h3>
                  <p className="text-sm text-gray-600">
                    Before: {beforePhotos.length} photos 
                  </p>
                  <p className="text-sm text-gray-600">
                    After: {afterPhotos.length} photos 
                  </p>
                </div>

                {task.checklist.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Checklist</h3>
                    <p className="text-sm text-gray-600">
                      {Object.values(checklistItems).filter(Boolean).length}/{task.checklist.length} items completed
                    </p>
                  </div>
                )}

                {task.questions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Questions</h3>
                    <p className="text-sm text-gray-600">
                      {Object.values(answers).filter((a) => a !== '' && a !== null).length}/{task.questions.length} answered
                    </p>
                  </div>
                )}

                {workerNotes && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-gray-600">{workerNotes}</p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                    Make sure you're still at the task location before submitting
                </p>
              </div>

              <button
                onClick={() => {
                  getCurrentLocation();
                  setTimeout(() => handleSubmit(), 1000);
                }}
                disabled={submitting}
                className="w-full btn btn-primary text-lg py-4"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mr-2" />
                    Submit Task
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
