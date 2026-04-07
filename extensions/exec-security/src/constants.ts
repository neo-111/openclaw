import path from "node:path";

/**
 * Protected file suffixes — paths ending with any of these are blocked
 * from write/edit operations and flagged in exec commands.
 */
export const PROTECTED_SUFFIXES: readonly string[] = [
  ".bashrc",
  ".bash_profile",
  ".profile",
  ".zshrc",
  ".zprofile",
  ".zshenv",
  ".gitconfig",
  ".git/config",
  ".ssh/config",
  ".ssh/authorized_keys",
  ".ssh/id_rsa",
  ".ssh/id_ed25519",
  ".npmrc",
  ".yarnrc.yml",
  ".pnpmrc",
  ".env",
  ".env.keys",
  ".env.local",
  ".env.production",
  "openclaw.json",
] as const;

/** Matches zero-width/invisible Unicode characters used for command obfuscation */
export const ZERO_WIDTH_CHARS_RE = /\u{200B}|\u{200C}|\u{200D}|\u{2060}|\u{FEFF}|\u{00AD}/gu;

/** Matches ANSI-C quoting patterns: $'...\...' */
export const ANSI_C_QUOTE_RE = /\$'[^']*\\[^']*'/;

/** Default threshold for write-hardening file size gate */
export const DEFAULT_MAX_WRITE_LINES = 200;

/**
 * Normalize a file path to forward slashes for cross-platform suffix matching.
 */
export function normalizePath(filePath: string): string {
  return path.resolve(filePath).replace(/\\/g, "/");
}

/**
 * Check if a normalized (forward-slash) path matches any protected suffix.
 * Uses boundary-aware matching: suffix must be preceded by "/" or be the full path.
 */
export function isProtectedPath(
  normalizedForwardSlash: string,
  suffixes: readonly string[],
): boolean {
  for (const suffix of suffixes) {
    if (
      normalizedForwardSlash.endsWith("/" + suffix) ||
      normalizedForwardSlash === suffix
    ) {
      return true;
    }
  }
  return false;
}
