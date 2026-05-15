import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutGrid, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogoutMutation } from '@/features/auth/api';

export default function Header() {
  const navigate = useNavigate();
  const logout = useLogoutMutation();

  async function onLogout() {
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  }

  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/workspaces" className="text-lg font-semibold">
          Task System
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/workspaces">
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Workspaces
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/me">
              <User className="mr-1.5 h-4 w-4" />
              Tôi
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            disabled={logout.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </nav>
      </div>
    </header>
  );
}
