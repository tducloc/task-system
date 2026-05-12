import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { useRegisterMutation } from './api';
import { registerSchema, type RegisterFormValues } from './schemas';

export default function RegisterPage() {
  const navigate = useNavigate();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '' },
  });
  const register = useRegisterMutation();

  async function onSubmit(values: RegisterFormValues) {
    try {
      await register.mutateAsync(values);
      toast.success('Đăng ký thành công, hãy đăng nhập');
      navigate('/login', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        // BE returns "Email already exists" — map to email field.
        if (typeof err.message === 'string' && err.message.toLowerCase().includes('email')) {
          form.setError('email', { type: 'server', message: err.message });
          return;
        }
        toast.error(err.message);
        return;
      }
      toast.error('Có lỗi xảy ra, thử lại sau');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đăng ký</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={register.isPending}>
                {register.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Đã có tài khoản?{' '}
                <Link to="/login" className="underline">
                  Đăng nhập
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
