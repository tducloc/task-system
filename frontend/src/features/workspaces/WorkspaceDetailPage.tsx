import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { useMeQuery } from '@/features/users/api';
import {
  useWorkspaceQuery,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useDeleteMembershipMutation,
  useUpdateMembershipMutation,
} from './api';
import type { Membership } from './types';
import { Role } from './types';
import MemberList from './MemberList';

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: me } = useMeQuery();
  const { data: workspace, isLoading, isError, error } = useWorkspaceQuery(id);
  const updateMutation = useUpdateWorkspaceMutation(id!);
  const deleteMutation = useDeleteWorkspaceMutation();
  const deleteMemberMutation = useDeleteMembershipMutation(id!);
  const updateMemberMutation = useUpdateMembershipMutation(id!);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    const status = error instanceof ApiError ? error.status : 0;
    return (
      <div className="mx-auto max-w-3xl p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/workspaces')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <p className="text-destructive">
          {status === 404
            ? 'Workspace không tồn tại.'
            : status === 403
              ? 'Bạn không có quyền truy cập workspace này.'
              : `Lỗi: ${error instanceof Error ? error.message : 'Không xác định'}`}
        </p>
      </div>
    );
  }

  if (!workspace || !me) {
    return null;
  }

  const myMembership = workspace.memberships?.find((m) => m.user.id === me.id);
  const isOwner = myMembership?.role === Role.OWNER;

  function handleStartEditing() {
    setEditName(workspace!.name);
    setIsEditing(true);
  }

  async function handleRename() {
    if (!editName.trim()) {
      return;
    }
    try {
      await updateMutation.mutateAsync({ name: editName.trim() });
      toast.success('Đã cập nhật tên workspace!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Lỗi cập nhật');
    }
  }

  async function handleDelete() {
    if (!confirm('Bạn có chắc chắn muốn xóa workspace này? Thao tác không thể hoàn tác.')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id!);
      toast.success('Đã xóa workspace!');
      navigate('/workspaces', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Lỗi xóa workspace');
    }
  }

  async function handleToggleRole(membership: Membership) {
    const newRole = membership.role === Role.OWNER ? Role.MEMBER : Role.OWNER;
    try {
      await updateMemberMutation.mutateAsync({
        membershipId: membership.id,
        data: { role: newRole },
      });
      toast.success(`Đã đổi quyền thành ${newRole}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Lỗi đổi quyền');
    }
  }

  async function handleKick(membership: Membership) {
    const isSelf = membership.user.id === me!.id;
    const msg = isSelf
      ? 'Bạn có chắc muốn rời khỏi workspace này?'
      : `Bạn có chắc muốn xóa ${membership.user.email} khỏi workspace?`;
    if (!confirm(msg)) {
      return;
    }
    try {
      await deleteMemberMutation.mutateAsync(membership.id);
      if (isSelf) {
        toast.success('Đã rời workspace!');
        navigate('/workspaces', { replace: true });
      } else {
        toast.success(`Đã xóa ${membership.user.email}`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Lỗi xóa thành viên');
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/workspaces')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
      </Button>

      {/* Workspace Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="max-w-xs"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleRename}
                disabled={updateMutation.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <CardTitle className="text-xl">{workspace.name}</CardTitle>
          )}
          {isOwner && !isEditing && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={handleStartEditing}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>ID: <span className="font-mono">{workspace.id}</span></p>
          <p>Tạo lúc: {new Date(workspace.createdAt).toLocaleString('vi-VN')}</p>
        </CardContent>
      </Card>

      {/* Members */}
      <MemberList
        memberships={workspace.memberships ?? []}
        currentUserId={me.id}
        isOwner={isOwner}
        isToggling={updateMemberMutation.isPending}
        isRemoving={deleteMemberMutation.isPending}
        onToggleRole={handleToggleRole}
        onKick={handleKick}
      />
    </div>
  );
}
