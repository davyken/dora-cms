import mongoose, { type Model, type Types } from "mongoose";

const { model, models, Schema } = mongoose;

export interface ContentItemDoc {
  _id: Types.ObjectId;
  siteId: string;
  slotId: string;
  type: "text" | "richtext" | "image" | "color";
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

const contentItemSchema = new Schema<ContentItemDoc>(
  {
    siteId: { type: String, required: true },
    slotId: { type: String, required: true },
    type: { type: String, enum: ["text", "richtext", "image", "color"], required: true },
    value: { type: String, required: true, maxlength: 20000 },
  },
  { timestamps: true }
);

// One value per (site, slot) — saving the same slotId again overwrites it.
contentItemSchema.index({ siteId: 1, slotId: 1 }, { unique: true });

export const ContentItem: Model<ContentItemDoc> =
  (models.ContentItem as Model<ContentItemDoc>) || model<ContentItemDoc>("ContentItem", contentItemSchema);
