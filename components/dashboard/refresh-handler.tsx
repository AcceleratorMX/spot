"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RefreshHandler() {
  const router = useRouter();

  useEffect(() => {
    // Refresh the page data every 10 seconds if the tab is active
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
