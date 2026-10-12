import React from "react";
import { RISK_META } from "@/lib/riskEngine";

export default function RiskBadge({ status, size = "md" }) {
  const meta = RISK_META[status] || RISK_META.estavel;
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${meta.bg} ${meta.border} ${meta.text} ${sizes[size]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
