import { useEffect, useState } from "react";

export const ALL_USERS = "all-users";

export function getBodyPreview(value?: string) {
  if (!value?.trim()) return "-";

  const preview = value
    .replace(/<\s*(script|style)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, " ")
    .replace(/<\s*\/?\s*(br|p|div|tr|li|table|thead|tbody|tfoot)\b[^>]*>/gi, " ")
    .replace(/<\s*\/?\s*(td|th)\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!preview) return "-";
  return preview.length > 72 ? `${preview.slice(0, 72)}...` : preview;
}

export function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}
