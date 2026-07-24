import { useId, useMemo } from "react";

const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "caption",
  "center",
  "code",
  "col",
  "colgroup",
  "div",
  "em",
  "font",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "style",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const droppedTags = new Set([
  "base",
  "embed",
  "form",
  "head",
  "iframe",
  "input",
  "link",
  "meta",
  "object",
  "script",
  "svg",
]);

const tableTags = new Set(["table", "tbody", "td", "tfoot", "th", "thead", "tr"]);

const safeStyleProperties = new Set([
  "background",
  "background-color",
  "border",
  "border-bottom",
  "border-bottom-color",
  "border-bottom-style",
  "border-bottom-width",
  "border-collapse",
  "border-color",
  "border-left",
  "border-left-color",
  "border-left-style",
  "border-left-width",
  "border-right",
  "border-right-color",
  "border-right-style",
  "border-right-width",
  "border-spacing",
  "border-style",
  "border-top",
  "border-top-color",
  "border-top-style",
  "border-top-width",
  "border-width",
  "color",
  "display",
  "font",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "height",
  "letter-spacing",
  "line-height",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-height",
  "max-width",
  "min-height",
  "min-width",
  "mso-line-height-rule",
  "overflow",
  "overflow-wrap",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "text-align",
  "text-decoration",
  "text-indent",
  "text-transform",
  "vertical-align",
  "white-space",
  "width",
  "word-break",
]);

const safeMediaPattern = /^[\w\s:().,%/-]+$/;
const unsafeCssValuePattern =
  /(?:@import|behavior\s*:|binding\s*:|expression\s*\(|javascript\s*:|vbscript\s*:|-moz-binding|url\s*\()/i;

function isHtmlBody(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function isSafeHref(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function getSafeTokenList(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.replace(/[^\w-]/g, ""))
    .filter(Boolean)
    .slice(0, 30)
    .join(" ");
}

function isSafeCssValue(value: string) {
  return value.length <= 500 && !unsafeCssValuePattern.test(value);
}

function sanitizeStyleDeclarations(value: string) {
  const declarations = value
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean);
  const safeDeclarations: string[] = [];

  declarations.forEach((declaration) => {
    const separatorIndex = declaration.indexOf(":");
    if (separatorIndex <= 0) return;

    const property = declaration.slice(0, separatorIndex).trim().toLowerCase();
    const propertyValue = declaration.slice(separatorIndex + 1).trim();

    if (!safeStyleProperties.has(property) || !isSafeCssValue(propertyValue)) {
      return;
    }

    safeDeclarations.push(`${property}: ${propertyValue}`);
  });

  return safeDeclarations.join("; ");
}

function sanitizeSelector(selector: string, scopeSelector: string) {
  const selectors = selector
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const safeSelectors: string[] = [];

  selectors.forEach((item) => {
    if (item.length > 300 || /[{};]/.test(item)) return;

    const normalizedSelector = item.replace(/\b(html|body|:root)\b/gi, "").trim();
    const scopedSelector = normalizedSelector
      ? `${scopeSelector} ${normalizedSelector}`
      : scopeSelector;

    safeSelectors.push(scopedSelector);
  });

  return safeSelectors.join(", ");
}

function findMatchingBrace(css: string, openBraceIndex: number) {
  let depth = 0;

  for (let index = openBraceIndex; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return index;
  }

  return -1;
}

function sanitizeCssRules(css: string, scopeSelector: string) {
  const rules: string[] = [];
  let cursor = 0;

  while (cursor < css.length) {
    const openBraceIndex = css.indexOf("{", cursor);
    if (openBraceIndex === -1) break;

    const selector = css.slice(cursor, openBraceIndex).trim();
    const closeBraceIndex = findMatchingBrace(css, openBraceIndex);
    if (closeBraceIndex === -1) break;

    const block = css.slice(openBraceIndex + 1, closeBraceIndex).trim();

    if (/^@media\b/i.test(selector)) {
      const mediaQuery = selector.replace(/^@media\b/i, "").trim();
      const nestedRules = sanitizeCssRules(block, scopeSelector);

      if (mediaQuery && safeMediaPattern.test(mediaQuery) && nestedRules) {
        rules.push(`@media ${mediaQuery} { ${nestedRules} }`);
      }
    } else if (!selector.startsWith("@")) {
      const scopedSelector = sanitizeSelector(selector, scopeSelector);
      const declarations = sanitizeStyleDeclarations(block);

      if (scopedSelector && declarations) {
        rules.push(`${scopedSelector} { ${declarations}; }`);
      }
    }

    cursor = closeBraceIndex + 1;
  }

  return rules.join(" ");
}

function sanitizeCss(css: string, scopeSelector: string) {
  return sanitizeCssRules(css.replace(/\/\*[\s\S]*?\*\//g, " "), scopeSelector);
}

function copySafeAttributes(source: Element, target: HTMLElement, tagName: string) {
  const className = source.getAttribute("class");
  const id = source.getAttribute("id");
  const style = source.getAttribute("style");
  const title = source.getAttribute("title");
  const align = source.getAttribute("align");

  if (className) {
    const safeClassName = getSafeTokenList(className);
    if (safeClassName) target.setAttribute("class", safeClassName);
  }

  if (id) {
    const safeId = id.replace(/[^\w-]/g, "");
    if (safeId) target.setAttribute("id", safeId);
  }

  if (style) {
    const safeStyle = sanitizeStyleDeclarations(style);
    if (safeStyle) target.setAttribute("style", safeStyle);
  }

  if (title) {
    target.setAttribute("title", title);
  }

  if (align && /^(left|center|right|justify)$/i.test(align)) {
    target.setAttribute("align", align.toLowerCase());
  }

  if (tagName === "a") {
    const href = source.getAttribute("href");
    if (href && isSafeHref(href)) {
      target.setAttribute("href", href);
      target.setAttribute("target", "_blank");
      target.setAttribute("rel", "noreferrer");
    }
  }

  if (tableTags.has(tagName)) {
    ["bgcolor", "border", "cellpadding", "cellspacing", "height", "valign", "width"].forEach(
      (attribute) => {
        const value = source.getAttribute(attribute);
        if (value && /^[\w\s#.%,-]+$/.test(value)) {
          target.setAttribute(attribute, value);
        }
      },
    );
  }

  if (tagName === "td" || tagName === "th") {
    ["colspan", "rowspan"].forEach((attribute) => {
      const value = source.getAttribute(attribute);
      if (!value) return;

      const span = Number(value);
      if (Number.isInteger(span) && span > 0 && span <= 50) {
        target.setAttribute(attribute, String(span));
      }
    });
  }
}

function sanitizeNode(node: Node, document: Document, scopeSelector: string): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent ?? "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  if (droppedTags.has(tagName)) {
    return null;
  }

  if (!allowedTags.has(tagName)) {
    const fragment = document.createDocumentFragment();
    element.childNodes.forEach((childNode) => {
      const sanitizedChild = sanitizeNode(childNode, document, scopeSelector);
      if (sanitizedChild) {
        fragment.appendChild(sanitizedChild);
      }
    });

    return fragment;
  }

  if (tagName === "style") {
    const sanitizedCss = sanitizeCss(element.textContent ?? "", scopeSelector);
    if (!sanitizedCss) return null;

    const styleElement = document.createElement("style");
    styleElement.textContent = sanitizedCss;
    return styleElement;
  }

  const sanitizedElement = document.createElement(tagName);
  copySafeAttributes(element, sanitizedElement, tagName);

  element.childNodes.forEach((childNode) => {
    const sanitizedChild = sanitizeNode(childNode, document, scopeSelector);
    if (sanitizedChild) {
      sanitizedElement.appendChild(sanitizedChild);
    }
  });

  return sanitizedElement;
}

function sanitizeHtmlBody(value: string, scopeSelector: string) {
  const parser = new DOMParser();
  const document = parser.parseFromString(value, "text/html");
  const container = document.createElement("div");

  document.head.querySelectorAll("style").forEach((styleElement) => {
    const sanitizedStyle = sanitizeNode(styleElement, document, scopeSelector);
    if (sanitizedStyle) {
      container.appendChild(sanitizedStyle);
    }
  });

  document.body.childNodes.forEach((childNode) => {
    const sanitizedChild = sanitizeNode(childNode, document, scopeSelector);
    if (sanitizedChild) {
      container.appendChild(sanitizedChild);
    }
  });

  return container.innerHTML;
}

export function EmailBody({ value }: { value?: string | null }) {
  const reactId = useId();
  const scopeClass = `email-body-${reactId.replace(/[^\w-]/g, "")}`;
  const body = value?.trim() ?? "";
  const shouldRenderHtml = isHtmlBody(body);
  const sanitizedHtml = useMemo(
    () => (shouldRenderHtml ? sanitizeHtmlBody(body, `.${scopeClass}`) : ""),
    [body, scopeClass, shouldRenderHtml],
  );

  if (!body) {
    return <p className="text-muted-foreground">No body provided.</p>;
  }

  if (!shouldRenderHtml) {
    return <p className="whitespace-pre-wrap">{body}</p>;
  }

  return (
    <div
      className={`email-body-html ${scopeClass}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
