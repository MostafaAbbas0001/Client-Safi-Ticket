import { Input } from "@/components/input";
import { Label } from "@/components/label";
import type { LoginCredentialsProps } from "@/models";

export function LoginCredentials({
  email,
  password,
  disabled,
  onEmailChange,
  onPasswordChange,
}: LoginCredentialsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="name@company.com"
          autoComplete="username"
          disabled={disabled}
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          disabled={disabled}
          className="h-10"
        />
      </div>
    </>
  );
}
