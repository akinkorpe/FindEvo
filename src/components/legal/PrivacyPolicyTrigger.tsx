"use client";

import { useState } from "react";
import { PolicyModal } from "./PolicyModal";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";
import { TermsContent } from "./TermsContent";

interface Props {
  className?: string;
  label?: string;
  variant?: "privacy" | "terms";
}

export function PrivacyPolicyTrigger({
  className,
  label,
  variant = "privacy",
}: Props) {
  const [open, setOpen] = useState(false);
  const isTerms = variant === "terms";
  const buttonLabel = label ?? (isTerms ? "Terms" : "Privacy");
  const ariaLabel = isTerms ? "Terms of Service" : "Privacy Policy";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {buttonLabel}
      </button>
      <PolicyModal open={open} onClose={() => setOpen(false)} ariaLabel={ariaLabel}>
        {isTerms ? <TermsContent /> : <PrivacyPolicyContent />}
      </PolicyModal>
    </>
  );
}
