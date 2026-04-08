import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginButton } from '@/components/shared/login-button';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Nerra Hub</CardTitle>
          <CardDescription>Logg inn for å fortsette</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <LoginButton />
        </CardContent>
      </Card>
    </div>
  );
}
