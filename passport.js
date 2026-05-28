// passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
dotenv.config();

import User from './models/User.js';
export const isGoogleOAuthConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

if (isGoogleOAuthConfigured) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase()?.trim();
      if (!email) return done(new Error("Google profile email missing"), null);

      let user = await User.findOne({ email });

      if (!user) {
        user = new User({
          email,
          // Keep password unset for OAuth-only accounts.
          passwordHash: "",
          emailVerified: true,
          likes: [],
          dislikes: [],
          matches: [],
          blockedUsers: [],
          reportedUsers: [],
          refreshSessions: [],
        });
        await user.save();
      } else if (!user.emailVerified) {
        user.emailVerified = true;
        user.emailVerificationTokenHash = "";
        user.emailVerificationExpiresAt = null;
        await user.save();
      }

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));
} else {
  console.warn("⚠️ Google OAuth not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing).");
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
