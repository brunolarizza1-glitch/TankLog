export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Service worker registered successfully
        })
        .catch((registrationError) => {
          // Service worker registration failed
        });
    });
  }
}
