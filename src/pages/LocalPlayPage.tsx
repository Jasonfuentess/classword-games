import { useParams } from 'react-router-dom';
import { FileQuestion, FolderOpen } from 'lucide-react';
import { getActivity } from '../storage/activities';
import { SAMPLE_ACTIVITIES } from '../data/samples';
import { useActivities } from '../hooks/useStores';
import { useI18n } from '../i18n/useI18n';
import { ActivityPlayer } from '../games/ActivityPlayer';
import { EmptyState } from '../components/ui/misc';
import { ButtonLink } from '../components/ui/Button';

/** Plays an activity saved in this browser, or one of the built-in examples. */
export function LocalPlayPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  useActivities(); // re-render if storage changes
  const activity = getActivity(id) ?? SAMPLE_ACTIVITIES.find((a) => a.id === id);
  if (!activity) {
    return (
      <EmptyState
        icon={FileQuestion}
        title={t('editor.notFound')}
        body={t('activities.subtitle')}
        actions={
          <ButtonLink to="/activities" variant="primary" icon={FolderOpen}>
            {t('nav.myActivities')}
          </ButtonLink>
        }
      />
    );
  }
  return <ActivityPlayer key={`${activity.id}-${activity.updatedAt}`} activity={activity} activityKey={activity.id} />;
}
