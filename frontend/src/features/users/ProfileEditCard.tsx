import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import ProfileNameSection from './ProfileNameSection';
import ProfilePasswordSection from './ProfilePasswordSection';
import type { User } from './types';

interface ProfileEditCardProps {
  user: User;
}

export default function ProfileEditCard({ user }: ProfileEditCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin tài khoản</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ReadOnlyRow label="Email" value={user.email} />
        <ProfileNameSection user={user} />
        <div className="h-px bg-border" />
        <div>
          <h3 className="text-sm font-medium mb-3">Đổi mật khẩu</h3>
          <ProfilePasswordSection />
        </div>
      </CardContent>
    </Card>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-mono">{value}</p>
    </div>
  );
}
