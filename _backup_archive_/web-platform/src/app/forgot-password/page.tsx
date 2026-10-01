"use client";

import { useState } from "react";
import Link from "next/link";
import { NeoButton } from "@/components/neo-brutal/neo-button";
import { NeoCard, NeoInput } from "@/components/neo-brutal/neo-card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();
      setLoading(false);

      if (!json.success) {
        setError(json.error?.message || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(json.message || "A password reset link has been sent if an account with that email exists.");
      setEmail("");
    } catch {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <main className="bg-neo-yellow page-content flex min-h-screen items-center justify-center p-6">
      <NeoCard className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-black uppercase">Forgot Password</h1>
        
        {success ? (
          <div className="space-y-4">
            <p className="font-bold text-teal-800">{success}</p>
            <Link href="/login" className="block">
              <NeoButton variant="secondary" className="w-full">
                Back to Login
              </NeoButton>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm font-medium">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
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
            
            {error && <p className="text-sm font-bold text-red-600">{error}</p>}
            
            <NeoButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </NeoButton>
            
            <p className="mt-4 text-center text-sm font-medium">
              Remembered your password?{" "}
              <Link href="/login" className="font-bold underline hover:text-gray-700">
                Sign In
              </Link>
            </p>
          </form>
        )}
      </NeoCard>
    </main>
  );
}
