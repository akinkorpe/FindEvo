import { Suspense } from "react";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { UpgradeSuccessToast } from "@/components/billing/UpgradeSuccessToast";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <>
      {/* useSearchParams needs a Suspense boundary in App Router; the toast
          is purely additive, so falling back to nothing is fine. */}
      <Suspense fallback={null}>
        <UpgradeSuccessToast />
      </Suspense>
      <DashboardClient />
    </>
  );
}
