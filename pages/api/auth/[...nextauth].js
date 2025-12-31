import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// For demo purposes, we'll use a simple hardcoded admin credential
// In production, you should store this securely (e.g., in environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password'; // In production, hash this properly

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // For demo purposes, check against hardcoded credentials
        // In production, verify against your database
        const isValidUser = credentials.username === ADMIN_USERNAME && 
                           await bcrypt.compare(credentials.password, await bcrypt.hash(ADMIN_PASSWORD, 10));
        
        if (isValidUser) {
          return {
            id: '1',
            name: ADMIN_USERNAME,
            email: 'admin@example.com'
          };
        } else {
          // Try with plain text comparison for demo purposes
          if (credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD) {
            return {
              id: '1',
              name: ADMIN_USERNAME,
              email: 'admin@example.com'
            };
          }
        }
        
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'default_secret_for_dev',
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      // Add user ID to session
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  }
});