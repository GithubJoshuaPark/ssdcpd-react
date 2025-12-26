export interface Notice {
  id: string;
  subject: string;
  content: string;
  recipients: string | string[];
  sentAt: number;
  type?: string;
}
