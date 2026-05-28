import { createFirestoreModel } from "../lib/firestoreModel.js";

const User = createFirestoreModel("users", {
  defaults: {
    email: "",
    passwordHash: "",
    emailVerified: false,
    emailVerificationTokenHash: "",
    emailVerificationExpiresAt: null,
    verificationRequestedAt: null,
    passwordResetTokenHash: "",
    passwordResetExpiresAt: null,
    likes: [],
    dislikes: [],
    matches: [],
    blockedUsers: [],
    reportedUsers: [],
    refreshSessions: [],
    lastLoginAt: null,
    lastActiveAt: null,
  },
  timestamps: true,
});

export default User;
