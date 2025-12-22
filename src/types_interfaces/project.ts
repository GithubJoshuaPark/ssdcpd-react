export interface Project {
  id?: string;
  uid: string;
  projectName: string;
  startDate: string;
  endDate: string;
  demoUrl?: string;
  gitUrl?: string;
  description: string;
  userRole: string;
  usedSkills: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
