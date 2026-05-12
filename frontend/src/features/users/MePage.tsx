import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMeQuery } from './api';

export default function MePage() {
  const { data, isLoading, isError, error } = useMeQuery();

  if (isLoading) {
    return <p className="p-6 text-muted-foreground">Đang tải...</p>;
  }

  if (isError) {
    return (
      <p className="p-6 text-destructive">
        Không tải được thông tin tài khoản
        {error instanceof Error ? `: ${error.message}` : ''}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Tài khoản của tôi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row label="ID" value={data.id} />
          <Row label="Email" value={data.email} />
          <Row label="Tạo lúc" value={new Date(data.createdAt).toLocaleString('vi-VN')} />
          <Row label="Cập nhật" value={new Date(data.updatedAt).toLocaleString('vi-VN')} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
