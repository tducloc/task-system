import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên workspace').max(255, 'Tên tối đa 255 ký tự'),
});

export type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;
