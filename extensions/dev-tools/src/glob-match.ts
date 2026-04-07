/**
 * Minimal glob pattern matcher — no external dependencies.
 * Supports: *, **, ?, {a,b,c} alternatives, character classes [abc].
 * Paths are expected to use forward slashes.
 */
export function globMatch(filepath: string, pattern: string): boolean {
  const regex = globToRegex(pattern);
  return regex.test(filepath);
}

function globToRegex(pattern: string): RegExp {
  let i = 0;
  let result = "^";

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        // ** matches everything including /
        if (pattern[i + 2] === "/") {
          result += "(?:.*/)?";
          i += 3;
        } else {
          result += ".*";
          i += 2;
        }
      } else {
        // * matches everything except /
        result += "[^/]*";
        i++;
      }
    } else if (ch === "?") {
      result += "[^/]";
      i++;
    } else if (ch === "{") {
      const close = pattern.indexOf("}", i);
      if (close === -1) {
        result += escapeRegex(ch);
        i++;
      } else {
        const alternatives = pattern.slice(i + 1, close).split(",");
        result += "(?:" + alternatives.map(escapeRegex).join("|") + ")";
        i = close + 1;
      }
    } else if (ch === "[") {
      const close = pattern.indexOf("]", i);
      if (close === -1) {
        result += escapeRegex(ch);
        i++;
      } else {
        result += pattern.slice(i, close + 1);
        i = close + 1;
      }
    } else {
      result += escapeRegex(ch);
      i++;
    }
  }

  result += "$";
  return new RegExp(result);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
