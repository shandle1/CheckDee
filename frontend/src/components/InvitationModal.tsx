import { useState } from 'react';
import { X, Copy, Check, QrCode, Link2, Clock, RefreshCw } from 'lucide-react';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: {
    id: string;
    name: string;
    email: string;
  };
  invitationData: {
    invitationUrl: string;
    qrCode: string; // base64 QR code image
    expiresAt: string;
  } | null;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export default function InvitationModal({
  isOpen,
  onClose,
  worker,
  invitationData,
  onRegenerate,
  isGenerating
}: InvitationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (invitationData) {
      await navigator.clipboard.writeText(invitationData.invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTimeRemaining = () => {
    if (!invitationData) return '';
    const expiryDate = new Date(invitationData.expiresAt);
    const now = new Date();
    const hoursRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (hoursRemaining < 1) {
      const minutesRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60));
      return `${minutesRemaining} minutes`;
    }
    return `${hoursRemaining} hours`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              LINE Account Invitation
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              For {worker.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!invitationData && !isGenerating && (
            <div className="text-center py-8">
              <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Generate an invitation link for this worker to link their LINE account
              </p>
              <button
                onClick={onRegenerate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Invitation
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating invitation...</p>
            </div>
          )}

          {invitationData && !isGenerating && (
            <>
              {/* Expiry Warning */}
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-yellow-900">
                    Expires in {getTimeRemaining()}
                  </span>
                  <p className="text-yellow-700 mt-0.5">
                    This invitation link will expire on{' '}
                    {new Date(invitationData.expiresAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-3">
                  <QrCode className="w-5 h-5 text-gray-600" />
                  <h3 className="text-sm font-medium text-gray-900">
                    Scan QR Code
                  </h3>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg inline-block">
                  <img
                    src={invitationData.qrCode}
                    alt="QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Worker can scan this QR code with their LINE app
                </p>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or share link</span>
                </div>
              </div>

              {/* Invitation URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invitation Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={invitationData.invitationUrl}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Send this link to the worker via LINE message or email
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Instructions for Worker
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Click the invitation link or scan the QR code</li>
                  <li>LINE app will open automatically</li>
                  <li>Account will be linked immediately</li>
                  <li>Worker can start using the app</li>
                </ol>
              </div>

              {/* Regenerate Button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={onRegenerate}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate New Link
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
