import mongoose from "mongoose";

const EnterpriseDetailSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BankruptcyBatch",
    required: true,
  },
  enterpriseNumber: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  details: { type: Object, required: true },
  grabbedAt: { type: Date, default: Date.now },
});

export default mongoose.model("EnterpriseDetail", EnterpriseDetailSchema);
