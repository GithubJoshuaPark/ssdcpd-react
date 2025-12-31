/**
 * Interface representing a Work Breakdown Structure (WBS) Task item.
 */
export interface Organization {
  /** Unique identifier for the organization (optional for new items before saving) */
  id?: string;
  /** Unique identifier for the parent organization (optional for new items before saving) */
  parentId?: string | null;
  /** Unique identifiers for the child organizations (optional for new items before saving) */
  childIds?: string[];
  /** Name of the organization */
  organizationName: string;
  /** President name of the organization */
  presidentName?: string | null;
  /** Business number of the organization */
  businessNo?: string;
  /** Detailed description of the organization */
  description?: string;
  /** Planned start date of the organization (ISO string or YYYY-MM-DD) */
  startDate: string;
  /** Planned end date of the organization (ISO string or YYYY-MM-DD) */
  endDate: string;
  /** Current status of the organization */
  status: "active" | "inactive";
  /** Members of the organization */
  members?: string[];
  /** Timestamp when the organization was created */
  createdAt: string;
  /** Timestamp when the organization was last updated */
  updatedAt: string;
}
