import { redirect } from "next/navigation";
import { getParentContext } from "@/lib/auth-scope";
import OnboardingWizard from "@/components/admin/OnboardingWizard";

export default async function OnboardingPage() {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");
  if (ctx.profile.role !== "parent") redirect("/admin/dashboard");

  return (
    <div className="max-w-2xl mx-auto w-full">
      <OnboardingWizard />
    </div>
  );
}
