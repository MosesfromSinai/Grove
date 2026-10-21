import type { Metadata } from "next";
import "./globals.css";

// Fonts and theme tokens come with the Tailwind theme task (Edward).
export const metadata: Metadata = {
  title: "Grove",
  description: "Deals from local food spots near campus, for verified students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
