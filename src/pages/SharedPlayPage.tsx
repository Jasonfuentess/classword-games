import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { decodeActivity } from '../services/share';
import { ActivityPlayer } from '../games/ActivityPlayer';
import { LinkError } from '../components/LinkError';

/**
 * Entry point for shared links (#/p/<code>). Everything needed to rebuild the game is
 * inside the code, so this works on any device and survives page reloads.
 */
export function SharedPlayPage() {
  const { code } = useParams();
  const decoded = useMemo(() => decodeActivity(code), [code]);
  if (!decoded.ok) return <LinkError reason={decoded.reason} />;
  return <ActivityPlayer key={decoded.key} activity={decoded.activity} activityKey={decoded.key} />;
}
