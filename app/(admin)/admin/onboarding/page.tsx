import { redirect } from "next/navigation";
import Link from "next/link";
import { getParentContext, getChildrenOfFamily } from "@/lib/auth-scope";
import OnboardingWizard from "@/components/admin/OnboardingWizard";

export default async function OnboardingPage() {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");
  if (ctx.profile.role !== "parent") redirect("/admin/dashboard");

  const children = await getChildrenOfFamily(ctx.familyId);

  if (children.length === 0) {
    return (
      <div className="max-w-2xl mx-auto w-full text-center py-10 flex flex-col items-center gap-4">
        <div className="text-5xl">👨‍👩‍👧</div>
        <h1 className="font-display font-bold text-2xl text-fg">Invite a child first</h1>
        <p className="text-sm text-fg-muted max-w-md">
          The onboarding wizard sets up tasks for a specific child. Add your first child, then come back here.
        </p>
        <Link
          href="/admin/family"
          className="rounded-2xl bg-accent-teal text-black font-semibold px-6 py-3 text-sm hover:opacity-90 transition-opacity mt-2"
        >
          Go to Family →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <OnboardingWizard kids={children} />
    </div>
  );
}
