import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import sgMail from "@sendgrid/mail";

console.log("🔑 OpenAI key exists:", !!process.env.OPENAI_API_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const mongoClient = new MongoClient(process.env.MONGODB_URI!);
let db: ReturnType<typeof mongoClient.db>;

async function getDb() {
  if (!db) {
    console.log("📦 Connecting to MongoDB...");
    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGODB_DB!);
    console.log("✅ MongoDB connected");
  }
  return db;
}

// ---------- Send Transcript Email ----------
async function sendTranscriptEmail(
  email: string,
  storyTitle: string,
  transcript: string
) {
  console.log("📧 Sending transcript email to:", email);

  const msg = {
    to: email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: "Goodbye Cycle",
    },
    subject: `Your Story Transcript – ${storyTitle || "Untitled"}`,
    text: transcript,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding:24px">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;padding:24px">
          
          <h2 style="color:#222;margin-bottom:8px">
            Thank you for sharing your story 🤍
          </h2>

          <p style="color:#555;font-size:14px;margin-bottom:24px">
            Below is the transcript of your recorded story.
          </p>

          <div style="background:#f3f4f6;border-left:4px solid #111;padding:16px;margin-bottom:24px">
            <h3 style="margin:0 0 8px 0;color:#111">
              ${storyTitle || "Your Story"}
            </h3>
            <pre style="
              white-space:pre-wrap;
              word-wrap:break-word;
              font-size:14px;
              color:#333;
              margin:0;
              font-family:inherit;
            ">${transcript}</pre>
          </div>

          <p style="font-size:13px;color:#666">
            If you didn’t request this transcript, you can safely ignore this email.
          </p>

          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />

          <p style="font-size:12px;color:#999;text-align:center">
            © ${new Date().getFullYear()} Goodbye Cycle<br/>
            <a href="https://goodbyecycle.mistersk.tech/record" style="color:#999;text-decoration:none">
             goodbyecycle.mistersk.tech
            </a>
          </p>
        </div>
      </div>
    `,
  };

  await sgMail.send(msg);
  console.log("✅ SendGrid email sent");
}

export async function POST(req: any) {
  try {
    console.log("🎙️ Incoming voice submission request");

    const formData = await req.formData();
    const audio = formData.get("audio") as File;

    if (!audio) {
      console.error("❌ No audio file provided");
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log("🎧 Audio received:", {
      name: audio.name,
      size: audio.size,
      type: audio.type,
    });

    const tempPath = path.join("/tmp", `${Date.now()}-${audio.name}`);
    const buffer = Buffer.from(await audio.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);
    console.log("💾 Audio saved:", tempPath);

    const metadata: any = {
      name: formData.get("name") || null,
      anonymous: formData.get("anonymous") === "true",
      birthdate: formData.get("birthdate") || null,
      email: formData.get("email") || null,
      storyTitle: formData.get("storyTitle") || null,
      timestamp: new Date().toISOString(),
      transcriptRequested: formData.get("transcriptRequested") === "true",
      ip: req.headers.get("x-forwarded-for") || req.ip || null,
      userAgent: req.headers.get("user-agent") || null,
    };

    console.log("📝 Metadata:", metadata);

    const database = await getDb();
    const result = await database.collection("stories").insertOne(metadata);
    console.log("✅ Story saved with ID:", result.insertedId.toString());

    if (metadata.transcriptRequested && metadata.email) {
      console.log("🧠 Starting Whisper transcription");

      const transcriptResponse =
        await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempPath),
          model: "whisper-1",
        });

      const transcript = transcriptResponse.text;
      console.log("📜 Transcribed text:", transcript);

      await sendTranscriptEmail(
        metadata.email,
        metadata.storyTitle || "Your Story",
        transcript
      );
    } else {
      console.log("ℹ️ Transcript not requested or email missing");
    }

    fs.unlinkSync(tempPath);
    console.log("🧹 Temp file removed");

    return NextResponse.json({
      success: true,
      storyId: result.insertedId,
      message: metadata.transcriptRequested
        ? "Story saved. Transcript emailed."
        : "Story saved successfully.",
    });
  } catch (error) {
    console.error("🔥 Error processing voice submission:", error);
    return NextResponse.json(
      { error: "Failed to save story or generate transcript" },
      { status: 500 }
    );
  }
}
