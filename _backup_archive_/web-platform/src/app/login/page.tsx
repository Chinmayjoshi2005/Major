"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { NeoButton } from "@/components/neo-brutal/neo-button";
import { NeoCard, NeoInput } from "@/components/neo-brutal/neo-card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verified = searchParams.get("verified");
    const urlError = searchParams.get("error");

    if (verified === "true") {
      setSuccess("Email verified successfully! You can now log in.");
    } else if (verified === "false") {
      setError("Email verification failed or link has expired.");
    }

    if (urlError) {
      if (urlError === "ACCOUNT_LOCKED") {
        setError("This account is locked due to too many failed attempts. Please try again in 15 minutes.");
      } else if (urlError === "ACCOUNT_SUSPENDED") {
        setError("This account has been suspended. Please contact a Super Admin.");
      } else if (urlError === "EMAIL_NOT_VERIFIED") {
        setError("Please verify your email address before signing in.");
      } else {
        setError("Invalid email or password.");
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe: rememberMe ? "true" : "false",
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        if (result.error.includes("ACCOUNT_LOCKED")) {
          setError("Account locked due to repeated failed logins. Please try again in 15 minutes.");
        } else if (result.error.includes("ACCOUNT_SUSPENDED")) {
          setError("This account has been suspended. Please contact a Super Admin.");
        } else if (result.error.includes("EMAIL_NOT_VERIFIED")) {
          setError("Your email address is not verified. Please check your email.");
        } else if (result.error.includes("INVALID_CREDENTIALS")) {
          setError("Invalid email or password.");
        } else {
          setError("Invalid email or password.");
        }
        return;
      }

      router.push("/admin");
    } catch {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <NeoCard className="w-full max-w-md">
      <h1 className="mb-6 text-2xl font-black uppercase">Admin Login</h1>
      
      {success && <p className="mb-4 text-sm font-bold text-teal-800">{success}</p>}
      {error && <p className="mb-4 text-sm font-bold text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-bold uppercase">
            Email
          </label>
          <NeoInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold uppercase">
            Password
          </label>
          <NeoInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold uppercase select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              className="accent-yellow-400"
            />
            Remember Me
          </label>
          <Link href="/forgot-password" className="text-xs font-bold underline hover:text-gray-700">
            Forgot Password?
          </Link>
        </div>

        <NeoButton type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </NeoButton>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#0a0a0a]" />
          </div>
          <span className="relative bg-white px-2 text-xs font-bold uppercase text-gray-500">
            Or connect via
          </span>
        </div>

        <NeoButton
          type="button"
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          disabled={loading}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.085-7-7s3.14-7 7-7c1.7 0 3.245.614 4.427 1.643l2.42-2.42C17.472 1.8 15.01 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.795 0 10.24-4.11 10.24-10.24 0-.614-.068-1.2-.205-1.743H12.24z"/>
          </svg>
          Google SSO
        </NeoButton>

        <p className="mt-4 text-center text-sm font-medium">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold underline hover:text-gray-700">
            Sign Up
          </Link>
        </p>
      </form>
    </NeoCard>
  );
}

export default function LoginPage() {
  return (
    <main className="bg-neo-yellow page-content flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={<div className="text-xl font-bold uppercase">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
