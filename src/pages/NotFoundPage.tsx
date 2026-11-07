import { Compass, Home } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { EmptyState } from '../components/ui/misc';
import { ButtonLink } from '../components/ui/Button';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={Compass}
      title={t('notFound.title')}
      body={t('notFound.body')}
      actions={
        <ButtonLink to="/" variant="primary" icon={Home}>
          {t('common.backHome')}
        </ButtonLink>
      }
    />
  );
}
