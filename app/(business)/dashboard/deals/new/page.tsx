import type { Metadata } from "next";
import { PostDealForm } from "@/components/business/post-deal-form";

export const metadata: Metadata = { title: "Post a deal" };

export default function PostDealPage() {
  return (
    <>
      <header className="mb-7">
        <h1 className="text-3xl sm:text-4xl">Post a deal</h1>
        <p className="mt-2 text-ink-muted">Give students a reason to stop by.</p>
      </header>
      <PostDealForm />
    </>
  );
}
