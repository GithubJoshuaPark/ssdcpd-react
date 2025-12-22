export interface Contact {
  id?: string;
  uid: string; // User ID who created the contact request
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  response?: string; // Admin's response to the contact
}
