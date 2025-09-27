import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

export function useViewFromUrl(onViewChange: (view: string) => void) {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    // 1) URL query param takes precedence (e.g., ?view=report)
    const queryView = searchParams.get('view');

    // 2) Otherwise, map pathname to view
    let pathView: string | null = null;
    const pathname = location.pathname;
    switch (pathname) {
      case '/report':
        pathView = 'report';
        break;
      case '/community':
        pathView = 'community';
        break;
      case '/my-reports':
        pathView = 'my-reports';
        break;
      case '/qr-generator':
        pathView = 'qr-generator';
        break;
      case '/':
        pathView = 'home';
        break;
      default:
        pathView = null;
    }

    const nextView = queryView || pathView;
    if (nextView) {
      onViewChange(nextView);
    }
  }, [searchParams, location.pathname, onViewChange]);
}
