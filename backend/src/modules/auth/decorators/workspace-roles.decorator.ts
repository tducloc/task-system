import { SetMetadata } from '@nestjs/common';

import { Role } from 'prisma/generated/enums';

export const WORKSPACE_ROLES_KEY = 'workspaceRoles';

export const WorkspaceRoles = (...roles: Role[]) => {
  return SetMetadata(WORKSPACE_ROLES_KEY, roles);
};
