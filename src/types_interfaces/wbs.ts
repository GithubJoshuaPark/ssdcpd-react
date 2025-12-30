/**
 * Interface representing a Work Breakdown Structure (WBS) Task item.
 */
export interface WbsItem {
  /** Unique identifier for the task (optional for new items before saving) */
  id?: string;
  /** ID of the project this task belongs to */
  projectId: string;
  /** Name or title of the task */
  taskName: string;
  /** Detailed description of the task */
  description?: string;
  /** Planned start date of the task (ISO string or YYYY-MM-DD) */
  startDate: string;
  /** Planned end date of the task (ISO string or YYYY-MM-DD) */
  endDate: string;
  /** Completion percentage of the task (0 to 100) */
  progress: number;
  /** Name or ID of the person assigned to this task */
  assignee?: string;
  /** Current status of the task */
  status: "todo" | "in-progress" | "done" | "on-hold";
  /** Names or IDs of people cc'd on this task */
  cc_assignee?: string[];
  /** Display order for sorting tasks in the list */
  order: number;
  /** Timestamp when the task was created */
  createdAt: string;
  /** Timestamp when the task was last updated */
  updatedAt: string;
}

/**
 * Interface representing a Daily Work Report for a specific WBS Task.
 * It acts as a snapshot of the task's state (progress, status) for a specific date.
 */
export interface DailyReport {
  /** Unique identifier for the daily report */
  id: string;
  /** ID of the project this report belongs to */
  projectId: string;
  /** ID of the WBS task this report is associated with */
  wbsId: string;
  /** Description of the work performed on this date */
  content: string;
  /** Snapshot of the task's start date at the time of reporting */
  startDate: string;
  /** Snapshot of the task's end date at the time of reporting */
  endDate: string;
  /** Progress percentage achieved by this date */
  progress: number;
  /** Snapshot of the assignee at the time of reporting */
  assignee?: string;
  /** Status of the task at the time of reporting */
  status: "todo" | "in-progress" | "done" | "on-hold";
  /** Display order (typically inherits from the parent task) */
  order: number;
  /** The date this report corresponds to (YYYY-MM-DD format) */
  date: string;
  /** Timestamp when the report was created */
  createdAt: string;
  /** Timestamp when the report was last updated */
  updatedAt: string;
}
