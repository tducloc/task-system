import { Prisma } from 'prisma/generated/client';

export const checkIsPrismaError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError => {
  return error instanceof Prisma.PrismaClientKnownRequestError;
};
