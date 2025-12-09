import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompany extends Document {
  company_name: string;
  pan_no: string;
  user_id: mongoose.Types.ObjectId; // Reference to User
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    company_name: { type: String, required: true, trim: true },
    pan_no: { type: String, required: true, trim: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", companySchema);

export default Company;
