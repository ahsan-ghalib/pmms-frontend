import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions = {
  session: { strategy: "jwt", maxAge: 10 * 24 * 60 * 60 },
  jwt: { secret: process.env.NEXTAUTH_SECRET, maxAge: 10 * 24 * 60 * 60 },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {

          // console the requested url here
          console.log(process.env.NEXT_PUBLIC_API_URL + "/auth/login", "=========================================");
          const res = await axios.post(
            process.env.NEXT_PUBLIC_API_URL + "/auth/login",
            {
              email: credentials.email,
              password: credentials.password,
            }
          );

          const data = res?.data?.data;

          if (data?.token && data?.user) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              avatar: data.user.avatar,
              access_token: data.token,
              role: data.user.role,
              permissions: data.permissions || null,
              vendor: data.user.vendor || null,
              vendor_info: data.vendor_info || null,
            };
          }
          return null;
        } catch (error) {
          console.error("Login failed:", error.response?.data || error.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.accessToken = user.access_token;
        token.role = user.role;
        if (user.vendor) {
          token.vendor_status = user.vendor.status;
          token.profile_completed = user.vendor.profile_completed;
        } else if (user.role === 'vendor') {
          token.vendor_status = 'incomplete';
          token.profile_completed = false;
        }
        if (user.vendor_info) {
          token.vendor_info = user.vendor_info;
        }
      }
      if (trigger === "update" && session) {
        if (session.vendor_status !== undefined) {
          token.vendor_status = session.vendor_status;
        }
        if (session.profile_completed !== undefined) {
          token.profile_completed = session.profile_completed;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.accessToken = token.accessToken;
      session.user.role = token.role;
      session.user.vendor_status = token.vendor_status;
      session.user.profile_completed = token.profile_completed;
      if (token.vendor_info) {
        session.user.vendor_info = token.vendor_info;
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
