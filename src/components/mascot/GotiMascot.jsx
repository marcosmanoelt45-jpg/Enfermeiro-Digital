import React from "react";
import GotiAnimated from "./GotiAnimated";

/**
 * GotiMascot.jsx
 * Reexporta o componente oficial GotiAnimated com presets convenientes.
 */
export default function GotiMascot({
  animation = "idle",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <GotiAnimated
      animation={animation}
      size={size}
      className={className}
      {...props}
    />
  );
}
