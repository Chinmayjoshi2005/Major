"use client";

import { signOut } from "next-auth/react";
import { NeoButton } from "@/components/neo-brutal/neo-button";

export function SignOutButton() {
  return (
    <NeoButton
      variant="danger"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign Out
    </NeoButton>
  );
}
