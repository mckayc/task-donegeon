export type BugReportStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export enum BugReportType {
    Bug = 'Bug Report',
    Feature = 'Feature Request',
    Feedback = 'UI/UX Feedback',
    Content = 'Content Suggestion',
}

export interface BugReportLogEntry {
  timestamp: string;
  type: 'ACTION' | 'NOTE' | 'NAVIGATION' | 'STATE_CHANGE' | 'ELEMENT_PICK' | 'COMMENT';
  message: string;
  author?: string; // For comments
  element?: {
    tag: string;
    id?: string;
    classes?: string;
    text?: string;
  };
  lastCopiedAt?: string;
  isDimmed?: boolean;
  commentStatus?: 'good' | 'review';
}

export interface BugReport {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  status: BugReportStatus;
  tags: string[];
  logs: BugReportLogEntry[];
}

export interface BugReportTemplate {
  id: string;
  title: string;
  text: string;
}
