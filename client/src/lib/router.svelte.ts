let current = $state(window.location.pathname);

window.addEventListener('popstate', () => {
  current = window.location.pathname;
});

export function navigate(path: string) {
  history.pushState({}, '', path);
  current = path;
}

export function getPath() {
  return current;
}
