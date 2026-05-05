import { User } from 'prisma/generated/client';

export const getUserInfo = (user: User) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userInfo } = user;
  return userInfo;
};
