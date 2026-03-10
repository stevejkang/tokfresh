import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GitHubStarButton } from "@/components/github-star-button";

export default function SetupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <GitHubStarButton />
        </div>
        {children}
      </div>
    </div>
  );
}
