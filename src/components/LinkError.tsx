import { Home, Link2Off, Play } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { ButtonLink } from './ui/Button';
import { EmptyState } from './ui/misc';

export type LinkErrorReason = 'empty' | 'corrupt' | 'version' | 'invalid' | 'generate';

export function LinkError({ reason }: { reason: LinkErrorReason }) {
  const { t } = useI18n();
  return (
    <div data-testid="link-error" className="mx-auto max-w-xl">
      <EmptyState
        icon={Link2Off}
        title={t('link.errorTitle')}
        body={t(`link.error.${reason}`)}
        actions={
          <>
            <ButtonLink to="/play" variant="primary" icon={Play}>
              {t('link.goPlay')}
            </ButtonLink>
            <ButtonLink to="/" icon={Home}>
              {t('common.backHome')}
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
