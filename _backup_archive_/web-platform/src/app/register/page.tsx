"use client";

import { useState } from "react";
import Link from "next/link";
import { NeoButton } from "@/components/neo-brutal/neo-button";
import { NeoCard, NeoInput } from "@/components/neo-brutal/neo-card";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await res.json();
      setLoading(false);

      if (!json.success) {
        setError(json.error?.message || "Registration failed.");
        return;
      }

      setSuccess(json.message || "Registration successful! Please check your email to verify your account.");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <main className="bg-neo-yellow page-content flex min-h-screen items-center justify-center p-6">
      <NeoCard className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-black uppercase">Create Account</h1>
        
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
            <div>
              <label className="mb-1 block text-sm font-bold uppercase">
                Full Name
              </label>
              <NeoInput
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
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
            <div>
              <label className="mb-1 block text-sm font-bold uppercase">
                Confirm Password
              </label>
              <NeoInput
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            {error && <p className="text-sm font-bold text-red-600">{error}</p>}
            
            <NeoButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Sign Up"}
            </NeoButton>
            
            <p className="mt-4 text-center text-sm font-medium">
              Already have an account?{" "}
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
