import { Loader2 } from 'lucide-react';

import { useMeQuery } from './api';
import ProfileEditCard from './ProfileEditCard';
import UserActivityFeed from './UserActivityFeed';

export default function MePage() {
  const { data, isLoading, isError, error } = useMeQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
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
    <div className="mx-auto max-w-5xl p-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <ProfileEditCard user={data} />
      <UserActivityFeed />
    </div>
  );
}
