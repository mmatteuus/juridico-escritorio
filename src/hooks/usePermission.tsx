// This file will contain the usePermission hook implementation.

import { useEffect, useState } from "react";
import { useAuth } from "@/features/demo/auth"; // assumed path for auth context

// Define a simple type for a permission policy. In a real app this
// would mirror the API response. For the current demo we only need a
// boolean flag per capability.
export type PermissionPolicy = {
  [capability: string]: boolean;
};

/**
 * Hook that checks whether the current user has a required capability.
 * It first inspects the JWT claims for instant permission and, if
 * necessary, calls the server policy endpoint.
 *
 * @param required Capability string (e.g., "case:read").
 * @returns true if the user has permission, false otherwise.
 */
export function usePermission(required: string): boolean {
  const { token, role } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  useEffect(() => {
    if (!token) return;
    // Assume token contains a permissions array; fallback to role.
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.permissions?.includes(required)) {
        setHasPermission(true);
        return;
      }
    } catch {}
    // If token does not grant directly, call policy endpoint.
    fetch(`/api/policy?required=${required}`)
      .then((res) => (res.ok ? res.json() : { allowed: false }))
      .then((d: PermissionPolicy) => setHasPermission(!!d[required]))
      .catch(() => setHasPermission(false));
  }, [required, token]);

  return hasPermission;
}
