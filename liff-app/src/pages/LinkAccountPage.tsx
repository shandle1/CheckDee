import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Phone, Link2, CheckCircle, AlertCircle } from 'lucide-react';
import { getAccessToken, getLiffProfile } from '@/lib/liff';
import { linkViaPhone, linkViaToken } from '@/services/linkService';
import { useAuthStore } from '@/store/authStore';

type LinkingStep = 'phone' | 'processing' | 'success' | 'error';

export default function LinkAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setProfile, setAuthenticated } = useAuthStore();

  const [step, setStep] = useState<LinkingStep>('phone');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lineProfile, setLineProfile] = useState<any>(null);

  // Check if there's a token in the URL (invitation link)
  const linkToken = searchParams.get('token');

  useEffect(() => {
    // Get LINE profile on mount
    const fetchProfile = async () => {
      try {
        const profile = await getLiffProfile();
        setLineProfile(profile);

        // If there's a link token in URL, try to link immediately
        if (linkToken && profile) {
          handleLinkViaToken(linkToken);
        }
      } catch (err) {
        console.error('Failed to get LINE profile:', err);
        setError('Failed to get LINE profile. Please try again.');
      }
    };

    fetchProfile();
  }, [linkToken]);

  const handleLinkViaToken = async (token: string) => {
    setStep('processing');
    setError(null);

    try {
      const liffToken = getAccessToken();
      if (!liffToken) {
        throw new Error('No LIFF access token available');
      }

      const response = await linkViaToken(liffToken, token);

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Update auth store
      if (lineProfile) {
        setProfile(lineProfile);
        setAuthenticated(true);
      }

      setStep('success');

      // Redirect to tasks after 2 seconds
      setTimeout(() => {
        navigate('/tasks');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to link via token:', err);
      setError(err.response?.data?.error || 'Failed to link account. Please try entering your phone number.');
      setStep('phone');
    }
  };

  const handleLinkViaPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setError(null);

    try {
      const liffToken = getAccessToken();
      if (!liffToken) {
        throw new Error('No LIFF access token available');
      }

      const response = await linkViaPhone(liffToken, phone);

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Update auth store
      if (lineProfile) {
        setProfile(lineProfile);
        setAuthenticated(true);
      }

      setStep('success');

      // Redirect to tasks after 2 seconds
      setTimeout(() => {
        navigate('/tasks');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to link via phone:', err);
      setError(err.response?.data?.error || 'Failed to link account. Please check your phone number.');
      setStep('phone');
    }
  };

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-line-green mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Linking Account...
          </h2>
          <p className="text-gray-600">
            Please wait while we link your LINE account
          </p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Account Linked Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Your LINE account has been linked to CheckDee
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="text-center mb-6">
            {lineProfile?.pictureUrl && (
              <img
                src={lineProfile.pictureUrl}
                alt={lineProfile.displayName}
                className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-line-green"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {lineProfile?.displayName || 'there'}!
            </h1>
            <p className="text-gray-600 text-sm">
              Link your LINE account to start using CheckDee
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Phone Input Form */}
          <form onSubmit={handleLinkViaPhone} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-line-green focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the phone number registered with your CheckDee account
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-line-green text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Link2 className="w-5 h-5" />
              Link Account
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Need Help?
            </h3>
            <p className="text-xs text-blue-700">
              If you don't have an account yet, please contact your manager to create one for you.
              Make sure your phone number matches the one registered in the system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
