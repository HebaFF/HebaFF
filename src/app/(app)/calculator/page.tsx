"use client";

import { CalculatorWidget } from "@/components/Calculator";
import { useAuth } from "@/context/AuthContext";

export default function CalculatorPage() {
  const { user } = useAuth();
  if (!user?.profile) return null;
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px" }}>
      <CalculatorWidget profile={user.profile} />
    </div>
  );
}
