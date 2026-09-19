import mongoose, { type Model, type Types } from "mongoose";

const { model, models, Schema } = mongoose;

// Stores a site's admin password hash once it's been changed via the admin
// UI, taking over from the env-var-based DORA_ADMIN_PASSWORD_HASH used to
// bootstrap the very first login (see routes/auth.ts's currentPasswordHash).
export interface SiteAuthDoc {
  _id: Types.ObjectId;
  siteId: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const siteAuthSchema = new Schema<SiteAuthDoc>(
  {
    siteId: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const SiteAuth: Model<SiteAuthDoc> =
  (models.SiteAuth as Model<SiteAuthDoc>) || model<SiteAuthDoc>("SiteAuth", siteAuthSchema);
