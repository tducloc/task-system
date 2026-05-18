Task System Backend (NestJS) - 20 Day Plan (Revised)
Goal: Build a production-like backend system using NestJS with multi-tenant architecture,
authentication, caching, async processing, real-time updates, file export, and AI integration.

Daily Plan:
Day 1: Setup NestJS project, folder structure, ConfigModule with validation, Prisma init
Day 2: Design database schema (User, Workspace, Membership, Task, ActivityLog)
Day 3: Implement Prisma models + migrations + seed data
Day 4: User module (basic CRUD + password hashing)
Day 5: Auth (register/login + JWT access token)
Day 6: Refresh token + logout flow
Day 7: Auth guards + cleanup
Day 8: Workspace module (create/join)
Day 9: Membership + roles (OWNER/MEMBER) + Workspace Frontend
Day 10: RBAC guard implementation
Day 11: Task CRUD with workspace isolation + Task UI (TanStack Query, Optimistic Updates)
Day 12: Task filtering + sorting + pagination + security hardening + responsive UI
Day 13: Activity log (model, auto-log task changes, FE timeline UI)
Day 14: Redis setup + cache task list
Day 15: Cache invalidation + consistency testing
Day 16: Queue system (BullMQ) + export tasks job (CSV) + file download API
Day 17: WebSocket setup + real-time updates + optimize event flow
Day 18: Logging + error classification
Day 19: AI integration (summarization/query)
Day 20: Final refactor + README system design documentation
