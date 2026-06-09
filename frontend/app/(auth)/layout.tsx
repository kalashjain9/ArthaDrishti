"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("arthadrishti_token");
    if (token) router.replace("/dashboard");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
