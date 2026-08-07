import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-Enhanced ECG Workflow",
  description:
    "Systematic ECG interpretation tool with Gemini AI cardiologist consultation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
