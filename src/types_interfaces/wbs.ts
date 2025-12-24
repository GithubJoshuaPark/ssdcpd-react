export interface WbsItem {
  id?: string;
  projectId: string;
  taskName: string;
  description?: string;
  startDate: string;
  endDate: string;
  progress: number; // 0 to 100
  assignee?: string;
  status: "todo" | "in-progress" | "done" | "on-hold";
  order: number;
  createdAt: string;
  updatedAt: string;
}
