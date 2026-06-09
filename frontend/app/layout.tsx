import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "ArthaDrishti AI — Financial Intelligence Platform",
  description: "Autonomous Financial Intelligence Platform for the Indian Equity Market",
  keywords: ["Indian stocks", "equity research", "risk analysis", "NSE", "BSE", "AI finance"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
