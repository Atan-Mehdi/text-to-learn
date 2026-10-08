import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Instantly scroll window and root elements to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // Also scroll any scrollable main view or container to the top
    const containers = document.querySelectorAll('main, .overflow-y-auto');
    containers.forEach((el) => {
      el.scrollTop = 0;
    });
  }, [pathname, search]);

  return null;
}
