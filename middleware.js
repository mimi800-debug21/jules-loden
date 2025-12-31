import { withAuth } from 'next-auth/middleware';

// Protect the admin route
export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
});

export const config = {
  matcher: ['/admin/:path*'],
};