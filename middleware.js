// Public access to all routes - no authentication required
export default function middleware() {
  // Allow all requests to pass through
}

export const config = {
  matcher: '/:path*', // Match all paths
};