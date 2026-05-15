import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Users, ChevronRight, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { useWorkspacesQuery, useCreateWorkspaceMutation, useJoinWorkspaceMutation } from './api';
import { createWorkspaceSchema, type CreateWorkspaceFormValues } from './schemas';

export default function WorkspacesPage() {
  const [showForm, setShowForm] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const { data: workspaces, isLoading } = useWorkspacesQuery();
  const createMutation = useCreateWorkspaceMutation();
  const joinMutation = useJoinWorkspaceMutation();

  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: '' },
  });

  function handleToggleJoin() {
    setShowJoin((v) => !v);
    setShowForm(false);
  }

  function handleToggleCreate() {
    setShowForm((v) => !v);
    setShowJoin(false);
  }

  async function handleJoin() {
    if (!joinId.trim()) {
      return;
    }
    try {
      await joinMutation.mutateAsync(joinId.trim());
      toast.success('Đã tham gia workspace!');
      setJoinId('');
      setShowJoin(false);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Có lỗi xảy ra, thử lại sau');
      }
    }
  }

  async function handleCreate(values: CreateWorkspaceFormValues) {
    try {
      await createMutation.mutateAsync(values);
      toast.success('Đã tạo workspace mới!');
      form.reset();
      setShowForm(false);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Có lỗi xảy ra, thử lại sau');
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleToggleJoin} size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            {showJoin ? 'Đóng' : 'Tham gia'}
          </Button>
          <Button onClick={handleToggleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {showForm ? 'Đóng' : 'Tạo mới'}
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tạo workspace mới</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="flex items-end gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Tên workspace</FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: Dự án Alpha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Join Form */}
      {showJoin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tham gia workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Workspace ID</label>
                <Input
                  placeholder="Dán ID workspace vào đây"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>
              <Button onClick={handleJoin} disabled={joinMutation.isPending || !joinId.trim()}>
                {joinMutation.isPending ? 'Đang tham gia...' : 'Tham gia'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workspace List */}
      {workspaces && workspaces.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>Bạn chưa có workspace nào.</p>
            <p className="text-sm">Nhấn "Tạo mới" để bắt đầu!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workspaces?.map((ws) => (
            <Link key={ws.id} to={`/workspaces/${ws.id}`}>
              <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{ws.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Tạo lúc {new Date(ws.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
