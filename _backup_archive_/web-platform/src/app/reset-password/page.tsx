"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { NeoButton } from "@/components/neo-brutal/neo-button";
import { NeoCard, NeoInput } from "@/components/neo-brutal/neo-card";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { data: session, status, update } = useSession();

  // Reset password via Token state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Forced change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTokenResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing from URL.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const json = await res.json();
      setLoading(false);

      if (!json.success) {
        setError(json.error?.message || "Password reset failed.");
        return;
      }

      setSuccess(json.message || "Your password has been reset successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleForcedChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const json = await res.json();
      setLoading(false);

      if (!json.success) {
        setError(json.error?.message || "Password change failed.");
        return;
      }

      setSuccess("Your password has been updated successfully. Redirecting you to the dashboard...");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Force refresh session state so middleware releases redirect block
      await update();
      
      setTimeout(() => {
        window.location.href = "/admin";
      }, 1500);
    } catch {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  // Detect forced password change state
  const isForcedChange = status === "authenticated" && session?.user?.requiresPasswordChange;

  if (isForcedChange) {
    return (
      <NeoCard className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-black uppercase text-red-600">Password Change Required</h1>
        <p className="mb-6 text-sm font-bold text-gray-700">
          This is your first login. For security, please update your temporary password to continue.
        </p>

        {success ? (
          <p className="font-bold text-teal-800">{success}</p>
        ) : (
          <form onSubmit={handleForcedChangeSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold uppercase">
                Current Password
              </label>
              <NeoInput
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold uppercase">
                New Password
              </label>
              <NeoInput
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold uppercase">
                Confirm New Password
              </label>
              <NeoInput
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm font-bold text-red-600">{error}</p>}

            <NeoButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </NeoButton>
          </form>
        )}
      </NeoCard>
    );
  }

  // Fallback: Default Token Password Reset flow
  return (
    <NeoCard className="w-full max-w-md">
      <h1 className="mb-6 text-2xl font-black uppercase">Reset Password</h1>

      {!token ? (
        <div className="space-y-4">
          <p className="font-bold text-red-600">The password reset link is invalid or missing the token.</p>
          <Link href="/forgot-password" className="block">
            <NeoButton variant="secondary" className="w-full">
              Request New Link
            </NeoButton>
          </Link>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <p className="font-bold text-teal-800">{success}</p>
          <Link href="/login" className="block">
            <NeoButton variant="secondary" className="w-full">
              Go to Login
            </NeoButton>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleTokenResetSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold uppercase">
              New Password
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
            {loading ? "Resetting..." : "Reset Password"}
          </NeoButton>
        </form>
      )}
    </NeoCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="bg-neo-yellow page-content flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={<div className="text-xl font-bold uppercase">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
