import { createFirestoreModel } from "../lib/firestoreModel.js";

const SafetyReport = createFirestoreModel("safety_reports", {
  defaults: {
    reporterEmail: "",
    targetEmail: "",
    reason: "",
    details: "",
    status: "open",
  },
  timestamps: true,
});

export default SafetyReport;

