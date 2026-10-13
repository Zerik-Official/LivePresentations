import { useEffect, useState } from "react";

import { configApi } from "@/lib/api";
import { TURNSTILE_PUBLIC_KEY } from "@/lib/api/client";
import type { RuntimeConfig } from "@/types/backend";

/**
 * Load the public runtime configuration used by the auth forms.
 * Falls back to the build-time captcha key when the server is unreachable.
 * @returns Runtime config, or null while loading
 */
export function useRuntimeConfig(): RuntimeConfig | null {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);

  useEffect(() => {
    void configApi
      .fetchRuntimeConfig()
      .then(setConfig)
      .catch(() => setConfig({ turnstile_enabled: Boolean(TURNSTILE_PUBLIC_KEY), turnstile_site_key: TURNSTILE_PUBLIC_KEY ?? null, upload_quota_bytes: 20 * 1024 * 1024 }));
  }, []);

  return config;
}
