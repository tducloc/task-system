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

## 3. Bước tiếp theo (Next up)
- **Day 9**: Xây dựng module `Membership` (Quản lý các thành viên, phân quyền cụ thể OWNER/MEMBER).
- **Day 10**: Triển khai RBAC (Role-Based Access Control) Guard cho toàn bộ Backend.
- Bắt đầu kết nối Frontend với API Backend.
