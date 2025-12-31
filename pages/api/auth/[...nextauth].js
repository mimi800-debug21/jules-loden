import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// For demo purposes, we'll use a simple hardcoded admin credential
// In production, you should store this securely (e.g., in environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Verify credentials
        const isValidUser = credentials.username === ADMIN_USERNAME && 
                           bcrypt.compareSync(credentials.password, ADMIN_PASSWORD_HASH);
        
        if (isValidUser) {
          return {
            id: '1',
            name: 'Admin',
            email: 'admin@julesloden.com'
          };
        } else {
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'jules-loden-secret-key',
};

export default NextAuth(authOptions);