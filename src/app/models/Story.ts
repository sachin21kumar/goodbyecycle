import mongoose from "mongoose";

const StorySchema = new mongoose.Schema({
  name: String,
  anonymous: Boolean,
  birthdate: String,
  email: String,
  storyTitle: String,
  transcriptRequested: Boolean,
  audioPath: String,
  createdAt: { type: Date, default: Date.now },
  userAgent: String,
  ipAddress: String,
});

export default mongoose.models.Story ||
  mongoose.model("Story", StorySchema);
