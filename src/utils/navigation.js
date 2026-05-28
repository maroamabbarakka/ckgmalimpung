export function safeBack(navigate, fallback = '/dashboard') {
  if (window.history.length > 1) {
    navigate(-1);
    return;
  }

  navigate(fallback, { replace: true });
}
