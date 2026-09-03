const ticketPathPattern = /^\/tickets\/(\d+)\/?$/;

function notifyNavigationChanged() {
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function startPageTransition(update: () => void | Promise<void>) {
  if (
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    void update();
    return;
  }

  document.startViewTransition(update);
}

export function subscribeToNavigation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

export function getCurrentPathname() {
  return window.location.pathname;
}

export function getTicketIdFromPath(pathname: string) {
  const match = ticketPathPattern.exec(pathname);
  if (!match) return null;

  const ticketId = Number(match[1]);
  return Number.isSafeInteger(ticketId) && ticketId > 0 ? ticketId : null;
}

export function isKnownApplicationPath(pathname: string) {
  return pathname === "/" || getTicketIdFromPath(pathname) !== null;
}

export function navigateToTicket(ticketId: number) {
  startPageTransition(() => {
    window.history.pushState({ fromDashboard: true }, "", `/tickets/${ticketId}`);
    notifyNavigationChanged();
  });
}

export function replaceWithDashboard(update?: () => void) {
  startPageTransition(() => {
    update?.();
    window.history.replaceState(null, "", "/");
    notifyNavigationChanged();
  });
}

export function returnToDashboard() {
  replaceWithDashboard();
}
