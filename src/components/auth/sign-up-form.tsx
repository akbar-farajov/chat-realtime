"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUp } from "@/actions/auth/auth";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams();
  const error =
    searchParams.get("error") === "true" ? searchParams.get("message") : null;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeatPassword">Repeat Password</Label>
                <Input
                  id="repeatPassword"
                  name="repeatPassword"
                  type="password"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <SubmitButton pendingText="Creating account...">
                Sign up
              </SubmitButton>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
