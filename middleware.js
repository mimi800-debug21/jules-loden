// No authentication required - public access to all routes
export default function middleware() {
  // No special handling needed
}

export const config = {
  matcher: ['/'], // Match all routes
};