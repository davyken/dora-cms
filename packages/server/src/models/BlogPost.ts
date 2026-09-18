import mongoose, { type Model, type Types } from "mongoose";

const { model, models, Schema } = mongoose;

export interface BlogPostDoc {
  _id: Types.ObjectId;
  siteId: string;
  title: string;
  slug: string;
  body: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<BlogPostDoc>(
  {
    siteId: { type: String, required: true },
    title: { type: String, required: true, maxlength: 300 },
    slug: { type: String, required: true },
    body: { type: String, required: true, maxlength: 100000 },
    coverImage: { type: String },
  },
  { timestamps: true }
);

blogPostSchema.index({ siteId: 1, slug: 1 }, { unique: true });
blogPostSchema.index({ siteId: 1, createdAt: -1 });

export const BlogPost: Model<BlogPostDoc> =
  (models.BlogPost as Model<BlogPostDoc>) || model<BlogPostDoc>("BlogPost", blogPostSchema);
