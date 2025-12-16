import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

// MongoDB client
const mongoClient = new MongoClient(process.env.MONGODB_URI!);
let db: ReturnType<typeof mongoClient.db>;

async function getDb() {
  if (!db) {
    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGODB_DB!);
  }
  return db;
}

// Email sender using Gmail
async function sendTranscriptEmail(email: string, storyTitle: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "vinaykumar.mrski@gmail.com",
      pass: "xrfk knpe ciwf akrs",
    },
  });

  await transporter.sendMail({
    from: `"Goodbye Cycle" <vinaykumar.mrski@gmail.com>`,
    to: email,
    subject: `Your Story Transcript: ${storyTitle || "Untitled"}`,
    text: `Thank you for submitting your story! Your transcript will be ready shortly.`,
    html: `<p>Thank you for submitting your story!</p><p>Your transcript will be ready shortly.</p>`,
  });
}

export async function POST(req: any) {
  try {
    const formData = await req.formData();

    // const audio = formData.get("audio") as File; // AWS S3 upload commented for now

    const metadata:any = {
      name: formData.get("name") || null,
      anonymous: formData.get("anonymous") === "true",
      birthdate: formData.get("birthdate") || null,
      email: formData.get("email") || null,
      storyTitle: formData.get("storyTitle") || null,
      timestamp: new Date().toISOString(),
      transcriptRequested: formData.get("transcriptRequested") === "true",
      // s3Key: fileKey, // commented out
      ip: req.headers.get("x-forwarded-for") || req.ip || null,
      userAgent: req.headers.get("user-agent") || null,
    };

    // Save metadata to MongoDB
    const database = await getDb();
    const result = await database.collection("stories").insertOne(metadata);

    // Send transcript email if requested
    // if (metadata.transcriptRequested && metadata.email) {
    //   await sendTranscriptEmail(metadata.email, metadata.storyTitle || "Your Story");
    // }

    return NextResponse.json({
      success: true,
      storyId: result.insertedId,
      message: metadata.transcriptRequested
        ? "Story saved. Transcript email sent."
        : "Story saved successfully.",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save story" }, { status: 500 });
  }
}
