"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth-context";

function safeNextPath(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const validateEmail = (val: string) => {
    if (!val.trim()) return "Email is required.";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(val.trim())) return "Please enter a valid email address.";
    return "";
  };

  const validatePassword = (val: string) => {
    if (!val) return "Password is required.";
    if (val.length < 8) return "Password must be at least 8 characters.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      router.push(nextPath);
      router.refresh();
    } else {
      setServerError(result.error || "Login failed. Please try again.");
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setEmailError("");
    setPasswordError("");
    setServerError("");
    setLoading(true);
    const result = await login(demoEmail, demoPass);
    setLoading(false);
    if (result.ok) {
      router.push(nextPath);
      router.refresh();
    } else {
      setServerError(result.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-ocean-foam flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/o3l-logo.png" alt="O3L" width={150} height={50} className="h-10 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-ocean-navy mt-4">Welcome Back</h1>
          <p className="text-ocean-text-secondary">Sign in to your O3L account.</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {serverError && (
                <div className="text-sm text-ocean-danger bg-ocean-danger/10 border border-ocean-danger/20 px-4 py-3 rounded-lg">{serverError}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
                  <Input
                    id="email" type="email" placeholder="you@example.com" className={`pl-10 ${emailError ? "border-ocean-danger focus:ring-ocean-danger" : ""}`}
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(validateEmail(e.target.value)); if (serverError) setServerError(""); }}
                    onBlur={() => setEmailError(validateEmail(email))}
                  />
                </div>
                {emailError && <p className="text-xs text-ocean-danger">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-ocean-blue hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
                  <Input
                    id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    className={`pl-10 pr-10 ${passwordError ? "border-ocean-danger focus:ring-ocean-danger" : ""}`}
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (passwordError) setPasswordError(validatePassword(e.target.value)); if (serverError) setServerError(""); }}
                    onBlur={() => setPasswordError(validatePassword(password))}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ocean-muted hover:text-ocean-blue">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-xs text-ocean-danger">{passwordError}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-ocean-text-secondary">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-ocean-blue hover:underline font-medium">Join O3L</Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-ocean-slate/20">
              <p className="text-xs font-semibold text-ocean-text-secondary uppercase tracking-wider text-center mb-3">
                Quick 1-Click Demo Login
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleQuickLogin("admin@o3l.org", "Password@123")}
                  className="text-xs py-2 h-auto flex flex-col items-center justify-center border-ocean-navy/20 hover:bg-ocean-navy hover:text-white"
                >
                  <span className="font-bold">Admin</span>
                  <span className="text-[10px] opacity-75">Full access</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleQuickLogin("fisherman@o3l.org", "Password@123")}
                  className="text-xs py-2 h-auto flex flex-col items-center justify-center border-ocean-blue/20 hover:bg-ocean-blue hover:text-white"
                >
                  <span className="font-bold">Fisherman</span>
                  <span className="text-[10px] opacity-75">Catch reports</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleQuickLogin("demo@o3l.org", "Password@123")}
                  className="text-xs py-2 h-auto flex flex-col items-center justify-center border-ocean-teal/20 hover:bg-ocean-teal hover:text-white"
                >
                  <span className="font-bold">Member</span>
                  <span className="text-[10px] opacity-75">Community</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
