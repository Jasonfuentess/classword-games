import type { ActivityIssue } from '../../services/activitySchema';
import type { TranslateFn } from '../../i18n/translate';

export type IssueField = ActivityIssue['field'];

/** Turns validation issues into translated messages grouped by form field. */
export function issueMessages(issues: ActivityIssue[], t: TranslateFn): Partial<Record<IssueField, string[]>> {
  const out: Partial<Record<IssueField, string[]>> = {};
  const add = (field: IssueField, msg: string) => (out[field] ??= []).push(msg);
  for (const issue of issues) {
    switch (issue.field) {
      case 'title':
        add('title', t(`error.title.${issue.code}`));
        break;
      case 'instructions':
        add('instructions', t('error.instructions.too-long'));
        break;
      case 'timeLimit':
        add('timeLimit', t('error.timeLimit.range'));
        break;
      case 'secret':
        add('secret', t(`error.secret.${issue.code}`));
        break;
      case 'words':
        if (issue.code === 'impossible') add('words', t('error.words.impossible'));
        else for (const e of issue.errors) add('words', t(`error.words.${e.code}`, { word: e.word ?? '', limit: e.limit ?? '' }));
        break;
    }
  }
  return out;
}
