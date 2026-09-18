// Fixed admin password used across the test suite — the hash for it is
// computed once in global-setup.ts and exposed via env so route handlers
// see exactly what a real deployment would see.
export const TEST_ADMIN_PASSWORD = "test-password-123";
