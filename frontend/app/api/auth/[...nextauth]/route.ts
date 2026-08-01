import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Invalid email or password.");
        }

        const data = await res.json();
        const user = data.user;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          onboardingComplete: !!user.onboardingComplete,
          image: user.profileImageUrl || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.onboardingComplete = user.onboardingComplete;
        token.picture = (user as any).image || (user as any).picture || null;
      }
      
      if (trigger === "update" && session) {
        if (session.onboardingComplete !== undefined) token.onboardingComplete = session.onboardingComplete;
        if (session.name) token.name = session.name;
        if (session.picture) token.picture = session.picture;
        if (session.image) token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.onboardingComplete = !!token.onboardingComplete;
        session.user.image = (token.picture as string) || (token.image as string) || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
