import mongoose, { type Model, type Types } from "mongoose";

const { model, models, Schema } = mongoose;

/**
 * One record per successful upload, independent of whether that image is
 * currently used anywhere — this is what lets the media library offer an
 * old upload back even after it's been swapped out of the slot it was
 * originally uploaded for.
 */
export interface MediaDoc {
  _id: Types.ObjectId;
  siteId: string;
  url: string;
  mimeType: string;
  createdAt: Date;
}

const mediaSchema = new Schema<MediaDoc>(
  {
    siteId: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

mediaSchema.index({ siteId: 1, createdAt: -1 });

export const Media: Model<MediaDoc> = (models.Media as Model<MediaDoc>) || model<MediaDoc>("Media", mediaSchema);
