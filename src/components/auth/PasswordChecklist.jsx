import React from "react";
import { m as motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { checkPassword } from "@/lib/passwordPolicy";
import { spring } from "@/lib/motion";

/** Checklist ao vivo das regras de senha: cada item fica verde com um "pop" quando é cumprido. */
export default function PasswordChecklist({ password = "", id }) {
  const { results } = checkPassword(password);
  return (
    <ul id={id} className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 pt-1" aria-live="polite">
      {results.map((rule) => (
        <li
          key={rule.id}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            rule.ok ? "text-[#3DD68C]" : "text-[#9FB3C6]"
          }`}
        >
          <motion.span
            key={rule.ok ? "ok" : "no"}
            initial={rule.ok ? { scale: 0.6 } : false}
            animate={{ scale: 1 }}
            transition={spring.pop}
            className="inline-flex"
          >
            {rule.ok ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Circle className="w-3 h-3" />}
          </motion.span>
          <span>{rule.label}</span>
          <span className="sr-only">{rule.ok ? "(cumprido)" : "(pendente)"}</span>
        </li>
      ))}
    </ul>
  );
}
