import {
  Shield,
  ShieldCheck,
  LogOut,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Membership } from './types';
import { Role } from './types';

interface MemberListProps {
  memberships: Membership[];
  currentUserId: string;
  isOwner: boolean;
  isToggling: boolean;
  isRemoving: boolean;
  onToggleRole: (membership: Membership) => void;
  onKick: (membership: Membership) => void;
}

export default function MemberList({
  memberships,
  currentUserId,
  isOwner,
  isToggling,
  isRemoving,
  onToggleRole,
  onKick,
}: MemberListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          <UserPlus className="mr-2 inline h-4 w-4" />
          Thành viên ({memberships.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {memberships.map((m) => {
            const isSelf = m.user.id === currentUserId;

            return (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {m.user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {m.user.email}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">(Bạn)</span>
                      )}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {m.role === Role.OWNER ? (
                        <>
                          <ShieldCheck className="h-3 w-3 text-amber-500" /> Owner
                        </>
                      ) : (
                        <>
                          <Shield className="h-3 w-3" /> Member
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {isOwner && !isSelf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleRole(m)}
                      disabled={isToggling}
                    >
                      {m.role === Role.OWNER ? 'Giáng cấp' : 'Thăng cấp'}
                    </Button>
                  )}

                  {(isOwner || isSelf) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onKick(m)}
                      disabled={isRemoving}
                    >
                      {isSelf ? (
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
