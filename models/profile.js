import { createFirestoreModel } from "../lib/firestoreModel.js";

const Profile = createFirestoreModel("profiles", {
  defaults: {
    userId: "",
    email: "",
    firstName: "",
    dob: "",
    gender: "",
    showGender: false,
    interestedIn: "",
    travelType: "",
    bio: "",
    location: "",
    socialLinks: {
      instagram: "",
      linkedin: "",
    },
    interests: [],
    photos: [],
    profilePhoto: "",
    username: "",
    coverPhoto: "",
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    isPublic: true,
    travelCountries: [],
    currentCity: "",
  },
  timestamps: true,
});

export default Profile;
