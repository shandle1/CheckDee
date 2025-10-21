import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initLiff, isLoggedIn, login, getLiffProfile } from '@/lib/liff';
import { useAuthStore } from '@/store/authStore';

// Pages
import TasksPage from '@/pages/TasksPage';
import TaskDetailPage from '@/pages/TaskDetailPage';
import CheckInPage from '@/pages/CheckInPage';
import SubmissionPage from '@/pages/SubmissionPage';
import ProfilePage from '@/pages/ProfilePage';

// Components
import { Loader2 } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setProfile, setAuthenticated, setInitialized } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        await initLiff();
        setInitialized(true);

        if (!isLoggedIn()) {
          login();
          return;
        }

        const profile = await getLiffProfile();
        if (profile) {
          setProfile(profile);
          setAuthenticated(true);
        }

        setLoading(false);
      } catch (err) {
        console.error('LIFF initialization error:', err);
        setError('Failed to initialize LINE app. Please try again.');
        setLoading(false);
      }
    };

    init();
  }, [setProfile, setAuthenticated, setInitialized]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-line-green mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/check-in/:taskId" element={<CheckInPage />} />
        <Route path="/submission/:id" element={<SubmissionPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
