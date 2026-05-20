-- CreateEnum
CREATE TYPE "TaskActivityLogAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'ASSIGNED', 'UNASSIGNED');

-- CreateEnum
CREATE TYPE "TaskActivityLogField" AS ENUM ('title', 'action');

-- CreateTable
CREATE TABLE "TaskActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskActivityLog_taskId_idx" ON "TaskActivityLog"("taskId");

-- CreateIndex
CREATE INDEX "TaskActivityLog_workspaceId_idx" ON "TaskActivityLog"("workspaceId");

-- AddForeignKey
ALTER TABLE "TaskActivityLog" ADD CONSTRAINT "TaskActivityLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivityLog" ADD CONSTRAINT "TaskActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivityLog" ADD CONSTRAINT "TaskActivityLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
