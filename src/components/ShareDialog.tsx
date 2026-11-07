import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, Download, ExternalLink, Info, Share2 } from 'lucide-react';
import type { Activity } from '../types/activity';
import { useI18n } from '../i18n/useI18n';
import { assessLinkLength, buildShareUrl, QR_MAX_LENGTH } from '../services/share';
import { copyText, nativeShare } from '../services/clipboard';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { useToast } from './ui/useToast';
import { cn } from '../utils/format';

export function ShareDialog({ activity, open, onClose }: { activity: Activity | null; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const url = useMemo(() => (activity ? buildShareUrl(activity) : ''), [activity]);
  const size = assessLinkLength(url);
  const [qr, setQr] = useState<{ url: string; data: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const canQr = url.length > 0 && url.length <= QR_MAX_LENGTH && size !== 'too-long';

  useEffect(() => {
    if (!open || !canQr) return;
    let cancelled = false;
    import('qrcode')
      .then((QRCode) => QRCode.toDataURL(url, { errorCorrectionLevel: 'L', margin: 1, width: 320, color: { dark: '#1e1b4b', light: '#ffffff' } }))
      .then((data) => !cancelled && setQr({ url, data }))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [open, url, canQr]);

  const qrData = qr?.url === url ? qr.data : null;

  const copy = async () => {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
    toast(ok ? t('common.copied') : t('common.copyFailed'), ok ? 'success' : 'error');
  };

  const share = async () => {
    if (!activity) return;
    const result = await nativeShare({ title: activity.title, text: t('share.shareText', { title: activity.title }), url });
    if (result === 'unsupported') await copy();
  };

  if (!activity) return null;
  const blocked = size === 'too-long';

  return (
    <Dialog open={open} onClose={onClose} title={t('share.title')} description={t('share.subtitle')} size="md">
      <div className="space-y-5">
        <div>
          <label htmlFor="share-url" className="sr-only">
            URL
          </label>
          <div className="flex gap-2">
            <input
              id="share-url"
              data-testid="share-url"
              readOnly
              value={blocked ? '' : url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 truncate rounded-2xl bg-slate-100 px-4 py-3 font-mono text-xs text-slate-700 ring-1 ring-slate-200 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10"
            />
          </div>
          <p className={cn('mt-1.5 text-xs', size === 'ok' ? 'text-slate-400' : 'text-amber-600 dark:text-amber-400')}>{t('share.length', { count: url.length })}</p>
        </div>

        {size !== 'ok' && (
          <div role="alert" className={cn('flex gap-2 rounded-2xl px-4 py-3 text-sm', blocked ? 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200')}>
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            {blocked ? t('share.tooLong') : t('share.long')}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="primary" icon={copied ? Check : Copy} onClick={copy} disabled={blocked} data-autofocus data-testid="copy-link">
            {copied ? t('common.copied') : t('share.copyLink')}
          </Button>
          <Button icon={Share2} onClick={share} disabled={blocked}>
            {t('share.share')}
          </Button>
          <a
            href={blocked ? undefined : url}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={blocked}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10',
              blocked && 'pointer-events-none opacity-50',
            )}
          >
            <ExternalLink size={18} aria-hidden="true" />
            {t('share.open')}
          </a>
        </div>

        <div className="rounded-3xl bg-slate-50 p-4 text-center dark:bg-white/5">
          <p className="mb-3 text-sm font-bold">{t('share.qr')}</p>
          {canQr ? (
            qrData ? (
              <div className="flex flex-col items-center gap-3">
                <img src={qrData} alt={t('share.qr')} width={220} height={220} className="rounded-2xl bg-white p-2 shadow-md" data-testid="share-qr" />
                <a
                  href={qrData}
                  download={`${activity.title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) || 'activity'}-qr.png`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                >
                  <Download size={16} aria-hidden="true" />
                  {t('share.downloadQr')}
                </a>
              </div>
            ) : (
              <div className="mx-auto h-[220px] w-[220px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
            )
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('share.qrTooLong')}</p>
          )}
        </div>

        <p className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t('share.note')}
        </p>
      </div>
    </Dialog>
  );
}
