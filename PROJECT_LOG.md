# Task System Project - Daily Progress Log

File này dùng để theo dõi tiến độ của dự án, giúp AI nắm bắt bối cảnh khi reset conversation.

## 1. Trạng thái hệ thống hiện tại
- **Môi trường:** pnpm Workspace (Monorepo), tách biệt thư mục `backend` và `frontend`.
- **Tech Stack:**
  - Backend: NestJS, Prisma (PostgreSQL), JWT Authentication.
  - Frontend: React (Vite), TanStack.
- **Git Workflow:** Đang hoạt động trên nhánh tính năng và merge vào `release/mvp/main`.

## 2. Lịch sử hoàn thành (Từ Day 1 đến Day 8)

### Day 1 - Day 4: Khởi tạo & CSDL
- Khởi tạo NestJS, ConfigModule (validate env), Prisma.
- Thiết kế Schema chuẩn xác với các model: `User`, `Workspace`, `Membership`, `Task`, `RefreshToken`.
- Xây dựng module User (CRUD cơ bản, hash password).

### Day 5 - Day 7: Hệ thống Authentication & Authorization
- **Login/Register:** Trả về JWT Access Token.
- **Refresh Token Rotation:** Xử lý cấp mới token an toàn (kèm Transaction), lưu IP/UserAgent để bảo mật.
- **Logout:** Thu hồi (xóa) token.
- **Global Guards:** Setup AuthGuard mức toàn cục trong `AppModule`, tạo decorator `@Public()` để bypass.

### Day 8: Workspace Module (Đã xong)
- **`POST /workspaces`**: Bọc Transaction tạo Workspace đồng thời gán User làm `OWNER` trong bảng `Membership`.
- **`POST /workspaces/:id/join`**: Logic Join workspace. Check tồn tại (404), check đã tham gia (400), thêm làm `MEMBER`.
- **`GET /workspaces` & `:id`**: Lấy danh sách workspace tối ưu bằng cách dùng `include` để lấy luôn thông tin user, chỉ dùng đúng 1 query.
- **`PATCH /workspaces/:id`**: Chỉ cho phép `OWNER` cập nhật (check quyền khắt khe).
- **`DELETE /workspaces/:id`**: Chỉ `OWNER` mới được xóa. Đã xử lý xóa thủ công (cascade thủ công) `Membership` và `Task` trước khi xóa `Workspace` để tránh văng lỗi Khóa ngoại (P2003).

### Day 9: Membership Module + Workspace Frontend (Đã xong - 2026-05-15)
**Backend:**
- **`GET /workspaces/:workspaceId/memberships`**: Lấy danh sách thành viên (chỉ member trong workspace mới xem được).
- **`PATCH /workspaces/:workspaceId/memberships/:id`**: Đổi role (OWNER ↔ MEMBER). Có check "last owner protection" — không cho giáng cấp OWNER cuối cùng.
- **`DELETE /workspaces/:workspaceId/memberships/:id`**: Kick thành viên hoặc tự rời nhóm. Cũng có check last owner.
- **Refactor**: Tách helper methods `checkIsOwner`, `ensureTargetNotLastOwner`, `getMembership` để tránh lặp code và tối ưu số lượng query.

**Frontend:**
- **Workspace List** (`/workspaces`): Hiển thị danh sách, form tạo mới, form join bằng ID.
- **Workspace Detail** (`/workspaces/:id`): Inline rename, xóa workspace (OWNER only).
- **Member Management**: Xem danh sách, thăng/giáng cấp, kick, tự rời nhóm.
- **Tách component** `MemberList.tsx` ra khỏi `WorkspaceDetailPage.tsx` để giữ dưới 200 dòng.
- **Clean Code**: Áp dụng `CLEAN_CODE.MD` — dùng `enum Role`, `interface` thay `type`, `handle`-prefix cho handlers, `on`-prefix cho callback props, `is`-prefix cho boolean props.
- **Mở rộng `api-client.ts`**: Thêm method `patch` và `delete`.

**Quyết định kỹ thuật:**
- Tắt `erasableSyntaxOnly` trong `tsconfig.app.json` để dùng `enum` cho gọn.
- Dùng `as const` object pattern không cần thiết khi có thể dùng native enum.

### Day 10: RBAC Guard (Đã xong - 2026-05-16)
**Backend:**
- **Tạo `WorkspaceRoles` decorator** (`workspace-roles.decorator.ts`): Dùng `SetMetadata` để gắn required roles vào metadata của route.
- **Tạo `WorkspaceRoleGuard`** (`workspace-role.guard.ts`): Guard query DB lấy membership của user, check role, throw `ForbiddenException` nếu không đủ quyền. Inject `request.membership` để tránh double query.
- **Register Guard** vào `WorkspacesModule` và `MembershipsModule` providers.
- **Refactor `WorkspacesController`**: Thêm `@UseGuards(WorkspaceRoleGuard)` + `@WorkspaceRoles(...)` cho `GET :id`, `PATCH :id`, `DELETE :id`. Xóa `@CurrentUser()` khỏi các route đã có guard.
- **Refactor `WorkspacesService`**: Xóa toàn bộ logic check quyền (membership query + role check) khỏi `findOne`, `update`, `remove`. Đổi `ForbiddenException` → `NotFoundException` cho 404. Bỏ transaction trong `update` (chỉ 1 operation).
- **Refactor `MembershipsController`**: Thêm Guard cho cả 3 routes. `DELETE` dùng `@WorkspaceRoles(Role.OWNER, Role.MEMBER)` để member có thể tự rời nhóm.
- **Refactor `MembershipsService`**: Xóa `isMember` check trong `findAll`. Xóa `checkIsOwner` call trong `update`. Giữ lại `checkIsOwner` helper cho `remove` (kick người khác phải là OWNER). Fix typo `memebershipId` → `membershipId`.

**Quyết định kỹ thuật:**
- Guard dùng `request.params?.workspaceId ?? request.params?.id` để hoạt động được với cả 2 controller pattern (`/workspaces/:id` và `/workspaces/:workspaceId/memberships/:id`).
- `DELETE /memberships/:id` cho phép cả `MEMBER` và `OWNER` call — fine-grained logic (self-leave vs kick) giữ trong Service.
- `checkIsOwner` helper giữ lại trong `MembershipsService` cho trường hợp kick người khác trong `remove`.

### Day 11: Task Module & Advanced FE Task UI (Đã xong - 2026-05-17)
**Backend:**
- **Tạo `TasksModule`**: Thiết kế chuẩn RESTful với prefix `/workspaces/:workspaceId/tasks`.
- **Áp dụng Guard**: Tái sử dụng `WorkspaceRoleGuard` và `@WorkspaceRoles(Role.MEMBER, Role.OWNER)` cho CRUD bảo đảm chỉ thành viên mới được quyền thực hiện thao tác.
- **`TasksService`**: Cập nhật logic tạo/sửa task hỗ trợ gán (assignees) tự động mapping với user. Method `getAll` trả về dữ liệu cùng `assignees` đã được populate kèm `email` để tiện hiển thị.

**Frontend:**
- **Types & API Hooks**: Thêm `types.ts` và `api.ts` cho module `tasks` (TanStack Query, `api-client`).
- **Thêm Shadcn Table & Select**: Cài đặt table và select component, fix lỗi path alias của CLI shadcn trong môi trường Vite.
- **`TaskList.tsx` & `TaskRow.tsx`**: Refactor UI thành dạng Table (Database View) chuẩn mực giống Notion/Coda. Tách dòng ra thành component riêng để tuân thủ `CLEAN_CODE.md` (<200 lines).
- **Cột Thời Gian**: Format `createdAt` và `updatedAt` siêu nhẹ bằng native `Intl.DateTimeFormat` (không dùng date-fns).
- **Optimistic Updates**: Ứng dụng `onMutate` của TanStack Query để fake UI mượt mà không độ trễ khi Tạo, Sửa, và Xóa task (kèm auto-rollback khi API fail). Fix lỗi "Global Loading Flicker" bằng cách target chính xác `taskId`.
- **Tích hợp vào `WorkspaceDetailPage`**: Hiển thị bảng Task ngay dưới thông tin Workspace.

### Day 12: Filter, Sorting, Pagination & Security Hardening (Đã xong - 2026-05-18)
**Backend:**
- **`QueryTaskDto`**: Thêm `@Transform` cho array params (`statuses[]`, `assignees[]`), `@Min(1)` cho page/limit, `@MaxLength(255)` cho search.
- **`TasksService.getAll`**: Extract `where` clause dùng chung cho `findMany` + `count` (fix bug count không apply filter). Search case-insensitive (`mode: 'insensitive'`). Thêm guard `statuses ?` tránh query lỗi khi undefined.
- **Security Fix**: Thêm `workspaceId` validation vào `get()`, `update()`, `delete()` — chặn truy cập task cross-workspace. `delete()` dùng `findFirst` check trước rồi mới transaction xóa (fail-early, tránh orphan assignee deletion).
- **Error Handling**: Thêm try-catch P2025 → `NotFoundException` trong `update()`. Controller typed params (`workspaceId: string`, `id: string`).

**Frontend:**
- **TanStack Table** (`@tanstack/react-table` v8): Column definitions tách ra `columns.tsx`, server-side sorting via `manualSorting: true`.
- **Filter UI**: `TaskFilters.tsx` dùng shadcn `Popover` dropdown multi-select cho Status và Assignee (checkbox pattern), search input debounced 400ms.
- **Pagination**: `TaskPagination.tsx` dùng shadcn `Pagination` component, smart page numbers với ellipsis, responsive (ẩn page numbers trên mobile).
- **Smart Optimistic Updates**: Tự navigate sang trang mới khi create trên trang cuối đã full. Tự quay về trang trước khi xóa item cuối cùng trên trang cuối.
- **URL Sync**: Toàn bộ table state (filter, sort, page, search) sync lên URL search params qua `useSearchParams`. Refresh/share URL giữ nguyên state.
- **Responsive**: Container `max-w-6xl`, cột Ngày tạo/Cập nhật `hidden lg:table-cell`, `overflow-x-auto` cho mobile.
- **Refactor**: Tách `useTaskFilters`, `useTaskActions`, `columns.tsx` — tất cả component files < 200 lines.

**Packages thêm:** `@tanstack/react-table`, `qs`, shadcn `pagination`, `popover`, `badge`.

**Quyết định kỹ thuật:**
- Dùng `qs` library serialize query params thay vì tự build (handle array format chuẩn).
- TanStack Table chỉ bị hack ở Router/Start repo, Table repo an toàn — confirm qua postmortem chính thức.
- Optimistic update chỉ append khi ở trang cuối còn chỗ; các trường hợp khác chỉ update meta counts.
- URL là source of truth cho table state, `useState` chỉ dùng cho local input debounce.

### Day 13: Task Activity Log (Đã xong - 2026-05-19)
**Backend:**
- **Prisma Schema**: Thêm model `TaskActivityLog` với enum `TaskActivityLogAction` (CREATED, UPDATED, DELETED, ASSIGNED, UNASSIGNED) và `TaskActivityLogField` (title, status). Dùng FK đến Task, User, Workspace.
- **`ActivityLogsModule`**: Sub-module nested trong `tasks/activity-logs/`. Service có `log()`, `logBulk()`, `getAll()`.
- **Tích hợp `TasksService`**: Auto-log khi create (CREATED), update (UPDATED per field + ASSIGNED/UNASSIGNED per user), delete (xóa activity logs cùng transaction).
- **Diff Assignees**: So sánh old vs new assignee arrays, log email thay vì userId (dùng `Map` để resolve).
- **`GET /workspaces/:workspaceId/tasks/:taskId/activity-logs`**: Trả về logs kèm `user.email`, sort `createdAt DESC`.

**Frontend:**
- **Types & API Hook**: Thêm `TaskActivityAction` enum, `TaskActivityLog` interface, `useTaskActivityLogsQuery()` hook.
- **`TaskActivityTimeline.tsx`**: Timeline UI với icon + màu theo action type, mô tả hành động bằng tiếng Việt, format thời gian locale `vi-VN`.
- **Expandable Rows**: Click vào task row → mở rộng hiển thị activity log bên dưới. `stopPropagation` cho cột interactive (Status, Assignee, Actions).

**Quyết định kỹ thuật:**
- Thiết kế tách bảng riêng (`TaskActivityLog`) thay vì polymorphic chung — cho phép FK chuẩn, cascade delete, type-safe. Sau này thêm `WorkspaceActivityLog`, `MembershipActivityLog` cùng pattern.
- Lưu email vào `oldValue`/`newValue` cho ASSIGNED/UNASSIGNED — immutable log, không cần join lại.
- Xóa task cascade xóa activity logs trong cùng transaction — không giữ log DELETED cho MVP.

**Vấn đề cần xử lý:**
- Task delete hiện cascade xóa luôn activity logs → mất traceability. Cần refactor sang **Soft Delete** (`deletedAt` field) để giữ log DELETED và hỗ trợ workspace-level activity feed.

### Day 14: Soft Delete Task + Unified Activity Log (Đã xong - 2026-05-21)
**Backend:**
- **Soft Delete Task**: Thêm `Task.deletedAt DateTime?` + index `(workspaceId, deletedAt)`. `TasksService.delete()` đổi từ hard-delete cascade sang `update({ deletedAt })`, giữ lại `TaskAssignee` snapshot. `getAll`/`get`/`update` filter `deletedAt: null` trong where clause dùng chung.
- **Unified ActivityLog Polymorphic**: Drop `TaskActivityLog` (Day 13), tạo model `ActivityLog` polymorphic với `entityType` (TASK/WORKSPACE/USER/MEMBERSHIP) + `entityId` + `action`. Pattern theo Notion/Coda — 1 bảng duy nhất cho tất cả entity events.
- **Schema fields**: `field String?` (cho mọi entity, không bị enum bloat), `oldValue`/`newValue`, `actor`+`targetUser` (2 relations User), `metadata Json?` (snapshot title/name tại thời điểm log), indexes `(workspaceId, createdAt DESC)` + `(entityType, entityId)` + `(actorUserId)`.
- **Shared `ActivityLogsModule`**: Move từ `tasks/activity-logs/` → `modules/activity-logs/`. Service `log(input)`/`logBulk()`/`getAll(workspaceId, query)`. `LogActivityInput` interface dùng `...spread` resolve về `UncheckedCreateInput` của Prisma (tự match XOR).
- **2 endpoints**: `GET /workspaces/:id/activity-logs` (feed chính, pagination + filter `entityType`/`entityId`/`actorUserId`) + `GET /workspaces/:id/tasks/:taskId/activity-logs` (alias, scoped tự động `entityType=TASK`).
- **Integration logging**:
  - `TasksService`: CREATED/UPDATED per field/DELETED/ASSIGNED/UNASSIGNED.
  - `WorkspacesService`: WORKSPACE_CREATED/UPDATED + JOINED (entityType=MEMBERSHIP) + cascade delete activityLog trong `remove()`.
  - `MembershipsService`: UPDATED (role change) + phân biệt LEFT (self-leave) vs KICKED (kick by owner) qua flag `isSelfLeave`.

**Frontend:**
- **Shared `features/activity-logs/`**: types (`ActivityLog`, enum `ActivityEntityType`/`ActivityAction`), api hooks (`useWorkspaceActivityLogsQuery`, `useTaskActivityLogsQuery`), `messageRenderer.tsx` (icon + i18n tiếng Việt theo entityType+action+field).
- **Sheet slide-in panel** (shadcn `sheet` + `@radix-ui/react-dialog`): `WorkspaceActivityFeed.tsx` trong Sheet trigger từ icon Activity ở `WorkspaceDetailPage`. Filter dropdown entity type + pagination.
- **Refactor `TaskActivityTimeline`**: shape Day 13 (`log.user`, flat array) → Day 14 (`log.actor`, `{ data, meta }` pagination). Dùng chung `messageRenderer` với workspace feed.

**Quyết định kỹ thuật:**
- Polymorphic `ActivityLog` 1 bảng thay vì 3 bảng riêng (Task/Workspace/User): theo pattern Notion/Coda, scale tự nhiên khi thêm entity mới (Comment, Page...) chỉ cần thêm enum value.
- `field: String?` thay vì enum riêng cho từng entity: tránh enum bloat, không cần migration khi thêm field. Mapping enum → label/icon ở FE layer.
- 2 endpoints riêng (feed chính + task alias) thay vì 1 endpoint với filter: REST nested semantic đẹp, giữ tương thích URL Day 13 FE.
- Workspace feed KHÔNG aggregate task events (theo pattern Linear): task có timeline riêng ở row expand, workspace feed chỉ show workspace + membership events. Tránh duplicate log + giảm complexity query.
- Workspace `remove()` cascade delete activity logs (FK `ON DELETE RESTRICT`): không giữ log WORKSPACE_DELETED (chấp nhận mất history khi workspace bị xóa hoàn toàn — MVP scope).
- Membership remove dùng tuple return `{ deleted, isSelfLeave }` từ transaction để phân biệt LEFT/KICKED ở log call ngoài transaction.

**Vấn đề tồn đọng:**
- Log calls nằm NGOÀI transaction (`this.prisma.activityLog.log()` không dùng `tx`) → nếu log fail thì entity write đã commit, không rollback. Chấp nhận inconsistency lỏng cho MVP. Refactor sau: truyền `tx` vào helper.

### Day 15: User Activity Log + Profile Edit (Đã xong - 2026-05-22)
**Backend:**
- **Schema**: Thêm `User.name String?` + model riêng `UserActivityLog` với enum `UserActivityAction` (PROFILE_UPDATED, PASSWORD_CHANGED). FK `userId` + index `(userId, createdAt DESC)`. **KHÔNG dùng** `ActivityLog` polymorphic của Day 14.
- **`UserActivityLogsModule`** (`modules/user-activity-logs/`): Service `log()` + `logBulk()` (có empty-array guard) + `getAll(userId, query)`. Controller `GET /users/me/activities` (pagination + optional `action` filter, dùng `@CurrentUser()` thay vì WorkspaceRoleGuard).
- **`PATCH /users/me`**: DTO `UpdateMeDto` (name, currentPassword, newPassword) với `@ValidateIf` cho currentPassword khi có newPassword. Service `updateMe()`:
  - Early throw `BadRequestException('Nothing to update')` nếu cả 2 field rỗng.
  - Verify `bcrypt.compareSync(currentPassword, oldPassword)` → `BadRequestException('Current password is incorrect')`.
  - Hash `newPassword` bằng `bcrypt.hashSync(_, 10)`.
  - Log PROFILE_UPDATED field=`name` (kèm oldValue/newValue) + PASSWORD_CHANGED **không** lưu values (event marker only).
- **Migration squash workflow**: Day 15 ban đầu tạo 2 migrations trùng tên do rename field `meta` → `metadata`. Squash bằng `rm -rf` 2 migrations dirty → `prisma migrate reset --force` (replay đến hết Day 14) → `prisma migrate dev --name <name>` tạo lại 1 migration sạch.

**Frontend:**
- **`features/user-activity-logs/`** mới: types (`UserActivityLog`, enum `UserActivityAction`), `useMyActivityLogsInfiniteQuery` (page size 30, qs.stringify), `messageRenderer.tsx` (icon `KeyRound`/`UserCog` + label tiếng Việt).
- **Profile edit split components** (tất cả < 200 lines):
  - `ProfileNameSection.tsx`: inline edit toggle (Pencil → Check/X buttons), `useUpdateMeMutation` invalidate `['me']` + `['me', 'activities']`.
  - `ProfilePasswordSection.tsx`: form với currentPassword + newPassword + confirmPassword, FE validate length + match trước khi submit.
  - `ProfileEditCard.tsx`: wrapper Card chứa cả 2 + email read-only.
- **`UserActivityFeed.tsx`**: dùng pattern infinite scroll như `WorkspaceActivityFeed` (Day 14), filter dropdown action (ALL/PROFILE_UPDATED/PASSWORD_CHANGED), height 600px.
- **`MePage.tsx`** refactor: 2-column responsive grid `lg:grid-cols-[1fr_1.2fr]`, left = ProfileEditCard, right = UserActivityFeed.
- **`UserDetailPage.tsx`** update: hiển thị `data.name ?? data.email` ở title, thêm Row "Tên" với fallback `—`.

**Quyết định kỹ thuật:**
- **Tách bảng `UserActivityLog` riêng** (KHÔNG dùng `ActivityLog` polymorphic của Day 14): user account audit có scope khác (global, không thuộc workspace) vs workspace collaboration. Gộp chung sẽ phải `workspaceId nullable` → bẩn mọi query workspace feed. Pattern industry — Notion/GitHub/Linear cũng tách audit log riêng. Trade-off: 1 ít code duplication (`logBulk` helper), nhưng lợi schema clarity + future flexibility (sau này thêm LOGIN/LOGOUT + ipAddress/userAgent).
- **Password log không lưu values** (KHÔNG có oldValue/newValue): chỉ là event marker. Lưu password (kể cả hashed) trong audit log là anti-pattern — offline crack target + leak vector. Audit chỉ cần biết "đổi password lúc nào".
- **Split Profile thành 2 sub-components** (ProfileNameSection + ProfilePasswordSection): mỗi component < 100 lines, single responsibility, dễ test riêng.
- **FE validate password match/length trước khi submit**: tránh round-trip BE chỉ để báo "mật khẩu không khớp". BE vẫn check lại để safety.

**E2E test Playwright:**
- Setup Playwright test trong `/tmp/pw-day15/` (không pollute repo). Test cover: register → login → check render → edit name → check toast + render → wrong currentPassword → correct password → check 2 activity entries → re-login với new password. ALL 12 checks PASS. Screenshot lưu `/tmp/pw-day15/me-page.png`.

### Day 16: Redis Setup + Task List Cache + Invalidation (Đã xong - 2026-05-25)
**Hạ tầng:**
- Chạy Redis 7-alpine container đứng riêng (`docker run --name task-system-redis -p 6379:6379 --restart unless-stopped`). Chưa dùng `docker-compose.yml` — defer sang Day 17.
- Thêm `REDIS_HOST`/`REDIS_PORT` vào Joi schema với `.default()` (không required) để fresh clone không vỡ.

**Backend:**
- **`RedisModule` global + `RedisService`** (`src/database/`): wrap `ioredis` client với lifecycle `onModuleInit`/`onModuleDestroy`. API: `get<T>(key)`, `set(key, value, ttlSec)`, `del(key)`, `delByPattern(pattern)`. JSON.parse/stringify ẩn trong service. `maxRetriesPerRequest: 3` để fail-fast khi Redis chết.
- **`delByPattern` dùng `SCAN` cursor** thay vì `KEYS` — production-safe ngay cả khi nhiều key. Stream batch 100 keys/cycle.
- **Cache key strategy**: `tasks:list:{workspaceId}:{sha1Hash[12]}`. Helper `buildTaskListCacheKey` ở `tasks/utils/cache-key.ts` normalize query params (sort array `statuses`/`assignees` ASC) trước khi hash → 2 query khác thứ tự array = cùng key, tránh duplicate cache entries.
- **Read-through cache** `TasksService.getAll`: thử `redis.get` trước → HIT thì return; MISS thì query DB → `redis.set` TTL 60s → return. Cache full response shape `{ data, meta }`.
- **Write-through invalidation**: helper `invalidateListCache(workspaceId)` gọi `delByPattern('tasks:list:{wsId}:*')` sau mỗi `create`/`update`/`delete` (gọi NGOÀI `$transaction` để tránh race condition reader thấy uncommitted data → re-cache stale).
- **Fix latent bug Day 14**: `WorkspacesService.create()` gọi `activityLogs.log()` **bên trong** `$transaction` callback nhưng dùng `this.prisma` (connection khác `tx`) → FK violation `P2003` khi workspace chưa commit. Fix: kéo `log()` ra ngoài transaction, match đúng intent đã ghi trong PROJECT_LOG Day 14.
- **Fix latent bug Config**: `config/config.module.ts` gọi `ConfigModule.forRoot(...)` ở top-level nhưng vứt return value, không export, không import vào `AppModule` → `ConfigService` chưa bao giờ register vào DI container. Lỗi này latent từ Day 1, hôm nay `RedisService` lần đầu inject `ConfigService` mới lộ. Fix: export `AppConfigModule = ConfigModule.forRoot(...)` và import đầu `AppModule.imports`.

**Quyết định kỹ thuật:**
- **`ioredis` trực tiếp thay vì `@nestjs/cache-manager`**: control rõ TTL + invalidation pattern, API cache-manager v5+ rườm. Pattern hiện tại đủ đơn giản, không cần abstraction.
- **SHA1 hash 12 ký tự** cho query: cân bằng giữa collision-safe (12 hex char ≈ 48 bit, collision rất hiếm cho 1 workspace) và length ngắn dễ debug. MD5 cũng OK, anh chọn SHA1 cho nhất quán convention.
- **`delByPattern` wipe toàn workspace** (thô nhưng correct): mỗi mutation clear sạch cache list của workspace đó, kể cả page/filter không liên quan. Trade-off correctness > hit ratio — pattern industry (Notion/Linear). Sau này có thể tối ưu sang surgical invalidation nếu hit ratio drop.
- **TTL 60s + event-driven invalidation song song** (defense in depth): nếu invalidation logic miss case nào đó, max stale = 60s. Không bao giờ stale vĩnh viễn.
- **Log `[CACHE HIT]`/`[CACHE MISS]`/`[CACHE INVALIDATED]` dùng `logger.debug`**: dev mode bật, prod tắt được qua `LOG_LEVEL` env. Cleanup hẳn ở Day 17 sau khi unit test xong.
- **Không cache single `get(id)`**: invalidation phức tạp gấp đôi, hit ratio thấp (single record ít hot hơn list). YAGNI.

**Vấn đề tồn đọng / Defer:**
- **Day 14 inconsistency lỏng** vẫn chưa fix: `activityLogs.log()` ngoài transaction → entity write commit mà log fail thì không rollback. Refactor truyền `tx` vào helper là cách triệt để, defer Day 17+.
- **Unit test cache**: chưa viết. Day 17 sẽ cover: HIT/MISS path, normalize key (sort array), TTL expire, invalidation pattern match.
- **`docker-compose.yml`**: chưa tạo. Day 17 setup compose cho Postgres + Redis, named volumes, `.env.example` đi kèm.
- **PR chưa tạo**: defer sau Day 17 (gộp unit test + cache invalidation feature commit chung).

### Day 17 (phần 1): Docker Compose Setup (Đã xong - 2026-05-26)
**Hạ tầng:**
- **`docker-compose.yml`** ở root project: 2 services `postgres` (postgres:16-alpine) + `redis` (redis:7-alpine) với named volumes `task-system-pgdata` + `task-system-redisdata`. `container_name` cố định để exec/debug dễ.
- **Healthcheck** cho cả 2 service: `pg_isready` cho Postgres, `redis-cli ping` cho Redis — interval 5s, retries 5. Sau này CI có thể dùng `depends_on: { condition: service_healthy }` chính xác.
- **Env interpolation** `${POSTGRES_USER:-loctd}`: đọc từ `.env` root project, fallback nếu trống → linh hoạt cho team/CI.
- **`backend/.env.example`**: commit lên git với placeholder (`postgres:postgres`, `change-me-...` cho secret). Match default Postgres official image → fresh clone `cp .env.example .env` là chạy được.

**Migration data:**
- Reset path: stop container Postgres manual cũ, `docker compose up -d`, `prisma migrate deploy` lại từ đầu. MVP dev data → không cần dump/restore.

**Quyết định kỹ thuật:**
- **Named volume** thay vì bind mount: Docker quản lý, không vương vãi file vào project, dễ wipe khi cần (`docker compose down -v`).
- **Standalone container manual → compose**: workflow setup máy mới giảm từ "đọc README + chạy 2 lệnh docker run riêng" xuống 1 lệnh `docker compose up -d`.

**Vấn đề tồn đọng (chuyển sang phần 2 Day 17):**
- Unit test cho cache layer chưa viết.
- PR `[MVP] Add Redis cache for task list` chưa tạo (defer sau khi viết test).

## 3. Bước tiếp theo (Next up)
- **Day 17 (phần 2)**: Unit test cho cache layer (HIT/MISS, normalize key, invalidation pattern) + tạo PR `[MVP] Add Redis cache for task list`.
- **Day 18**: Queue system (BullMQ) + export tasks job (CSV) + file download API.

