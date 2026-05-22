import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Pencil, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';

import { useUpdateMeMutation } from './api';
import type { User } from './types';

interface ProfileNameSectionProps {
  user: User;
}

export default function ProfileNameSection({ user }: ProfileNameSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name ?? '');
  const mutation = useUpdateMeMutation();

  const handleStartEdit = () => {
    setName(user.name ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(user.name ?? '');
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Tên không được để trống');
      return;
    }
    if (trimmed === (user.name ?? '')) {
      setIsEditing(false);
      return;
    }
    mutation.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật tên hiển thị');
          setIsEditing(false);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : 'Lỗi cập nhật');
        },
      },
    );
  };

  return (
    <div className="space-y-2">
      <Label>Tên hiển thị</Label>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên của bạn"
            maxLength={100}
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm">
            {user.name ?? <span className="text-muted-foreground italic">Chưa đặt</span>}
          </span>
          <Button size="sm" variant="ghost" onClick={handleStartEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
