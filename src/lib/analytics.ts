type GtagEvent = {
  action: string;
  params?: Record<string, string | number>;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent({ action, params }: GtagEvent) {
  window.gtag?.("event", action, params);
}
