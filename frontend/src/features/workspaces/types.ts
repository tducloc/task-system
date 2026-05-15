export enum Role {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDetail extends Workspace {
  memberships: Membership[];
}

export interface Membership {
  id: string;
  userId: string;
  workspaceId: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
  };
}

export interface CreateWorkspaceInput {
  name: string;
}

export interface UpdateWorkspaceInput {
  name: string;
}

export interface UpdateMembershipInput {
  role: Role;
}
