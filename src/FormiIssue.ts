import type { ZodIssue } from 'zod';
import { RawPath } from './tools/Path';

export type FormiIssuesItem<Issue> = { path: RawPath; issues: Array<Issue> };
export type FormiIssues<Issue> = Array<FormiIssuesItem<Issue>>;

export type FormiIssueBase = { kind: 'FieldNotMounted' } | { kind: 'ValidationError'; error: unknown } | { kind: 'MissingField' };

export type FormiIssueSingle = { kind: 'UnexpectedMultipleValues' };
export type FormiIssueZod = FormiIssueBase | { kind: 'ZodIssue'; issue: ZodIssue };
export type FormiIssueNotFile = FormiIssueBase | { kind: 'UnexpectedFile' };
export type FormiIssueNotString = FormiIssueBase | { kind: 'UnexpectedString' };
export type FormiIssueNumber = FormiIssueBase | { kind: 'InvalidNumber'; value: string };
export type FormiIssueNonEmptyFile = FormiIssueBase | { kind: 'EmptyFile' };

export type FormiIssue =
  | FormiIssueBase
  | FormiIssueSingle
  | FormiIssueNotFile
  | FormiIssueNotString
  | FormiIssueNumber
  | FormiIssueNonEmptyFile
  | FormiIssueZod;
