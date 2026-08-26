import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Loading...", fullScreen = false }) {
  return (
    <div className={fullScreen ? "loading-screen" : "loading-state"}>
      <Loader2 className="loading-spinner" size={28} />
      <span>{label}</span>
    </div>
  );
}
