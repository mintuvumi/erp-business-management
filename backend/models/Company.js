import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: String,
  ownerId: String,
});

export default mongoose.model("Company", companySchema);