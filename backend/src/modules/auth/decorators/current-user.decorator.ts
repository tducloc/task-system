import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export interface AuthenticatedUser {
  sub: string;
}

export const CurrentUser = createParamDecorator<AuthenticatedUser>(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
