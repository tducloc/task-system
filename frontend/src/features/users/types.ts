export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMeInput {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}
