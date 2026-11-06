import React from "react";

/**
 * Simple placeholder HOC for authentication.
 * In the real app it would check the user's session and possibly redirect.
 * For the purpose of this repository (demo), it just returns the original component.
 */
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  const Wrapped: React.FC<T> = (props) => <Component {...props} />;
  // Keep the display name for debugging.
  Wrapped.displayName = `withAuth(${Component.displayName ?? Component.name})`;
  return Wrapped;
}

export default withAuth;
