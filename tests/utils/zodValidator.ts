import type { TFormiIssueBase, TValidateFn } from '@dldc/formi';
import type { z, ZodIssue } from 'zod';

export type TFormiIssueZod =
  | TFormiIssueBase
  | {
      kind: 'ZodIssue';
      issue: ZodIssue;
    };

export function zodValidator<T>(schema: z.Schema<T>): TValidateFn<any, T, TFormiIssueZod> {
  return (value) => {
    const result = schema.safeParse(value);
    if (result.success) {
      return { success: true, value: result.data };
    }
    const issues = result.error.issues.map(
      (issue): TFormiIssueZod => ({
        kind: 'ZodIssue',
        issue,
      }),
    );
    if (issues.length === 1) {
      return { success: false, issue: issues[0] };
    }
    return { success: false, issues: issues };
  };
}
