import mongoose, { type Model, type Types } from "mongoose";

const { model, models, Schema } = mongoose;

export interface BlogPostDoc {
  _id: Types.ObjectId;
  siteId: string;
  title: string;
  slug: string;
  body: string;
  coverImage?: string;
  /**
   * Manual sort position, ascending — lower sorts first. New posts get a
   * value lower than the current minimum so they still appear first by
   * default (matching a normal blog's newest-first order) without
   * clobbering any positions the client has manually dragged into place.
   */
  order: number;
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
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

blogPostSchema.index({ siteId: 1, slug: 1 }, { unique: true });
blogPostSchema.index({ siteId: 1, order: 1 });

export const BlogPost: Model<BlogPostDoc> =
  (models.BlogPost as Model<BlogPostDoc>) || model<BlogPostDoc>("BlogPost", blogPostSchema);
