import PublicAnalytics from "@/components/analytics/PublicAnalytics";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PublicAnalytics />
    </>
  );
}
