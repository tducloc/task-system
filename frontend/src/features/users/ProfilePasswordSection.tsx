import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';

import { useUpdateMeMutation } from './api';

const MIN_PASSWORD_LENGTH = 6;

export default function ProfilePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const mutation = useUpdateMeMutation();

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    mutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success('Đã đổi mật khẩu');
          handleReset();
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : 'Lỗi đổi mật khẩu');
        },
      },
    );
  };

  const canSubmit =
    currentPassword.length >= MIN_PASSWORD_LENGTH &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword.length >= MIN_PASSWORD_LENGTH &&
    !mutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">Mật khẩu mới</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Nhập lại mật khẩu mới</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={!canSubmit}>
          {mutation.isPending ? 'Đang lưu...' : 'Đổi mật khẩu'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          disabled={mutation.isPending}
        >
          Xóa form
        </Button>
      </div>
    </form>
  );
}
