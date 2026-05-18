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

## 3. Bước tiếp theo (Next up)
- **Day 13**: E2E Testing cho toàn bộ luồng Tasks và Memberships.

