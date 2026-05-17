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

## 3. Bước tiếp theo (Next up)
- **Day 11**: Task CRUD với workspace isolation (chỉ member trong workspace mới CRUD được task).
- **Day 12**: Task filtering + pagination.
