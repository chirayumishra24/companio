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
  },
  timestamps: true,
});

export default Profile;
