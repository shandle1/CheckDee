import { MessageCircle, Link2 } from 'lucide-react';

interface LINEStatusBadgeProps {
  linked: boolean;
  displayName?: string;
  pictureUrl?: string;
  linkedAt?: string;
  showDetails?: boolean;
}

export default function LINEStatusBadge({
  linked,
  displayName,
  pictureUrl,
  linkedAt,
  showDetails = false
}: LINEStatusBadgeProps) {
  if (!linked) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
        <Link2 className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Not Linked</span>
      </div>
    );
  }

  if (showDetails && displayName) {
    return (
      <div className="flex items-center gap-2">
        {pictureUrl && (
          <img
            src={pictureUrl}
            alt={displayName}
            className="w-6 h-6 rounded-full"
          />
        )}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700">
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{displayName}</span>
        </div>
        {linkedAt && (
          <span className="text-xs text-gray-500">
            Linked {new Date(linkedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700">
      <MessageCircle className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">Linked</span>
    </div>
  );
}
