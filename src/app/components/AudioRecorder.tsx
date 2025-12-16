"use client";

import { useEffect, useRef, useState } from "react";
import { StoryFormData } from "../lib/schema";
import { Mic, Square, CheckCircle, Pause, Play } from "lucide-react";

export default function AudioRecorder({ meta }: { meta: StoryFormData }) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [timeUp, setTimeUp] = useState(false);

  const TOTAL_TIME = 360;

  useEffect(() => {
    if (recording && !paused) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;

          if (next === 300) setWarningMessage("You have 1 minute left. Please wrap up your story.");
          if (next >= TOTAL_TIME - 15 && next < TOTAL_TIME) {
            setWarningMessage(`Only ${TOTAL_TIME - next} seconds remaining!`);
          }
          if (next >= TOTAL_TIME) {
            stopRecording();
            setWarningMessage("Time is up. You’ve reached the 6-minute limit.");
            setTimeUp(true);
            return TOTAL_TIME;
          }

          return next;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [recording, paused]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((audioBlob && !submitted) || recording) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [audioBlob, submitted, recording]);

  function formatTimerDisplay(sec: number) {
    if (sec >= TOTAL_TIME - 15 && sec < TOTAL_TIME) return TOTAL_TIME - sec;
    const minutes = Math.floor(sec / 60);
    const remainingSeconds = sec % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  function getTimerClass() {
    if (seconds >= TOTAL_TIME - 15 && seconds < TOTAL_TIME) return "text-red-600 animate-pulse font-bold";
    if (seconds >= 300 && seconds < TOTAL_TIME - 15) return "text-yellow-700 font-semibold";
    return "text-gray-700";
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      const tempAudio = document.createElement("audio");
      tempAudio.src = URL.createObjectURL(blob);


      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start(1000);
    setSeconds(0);
    setPaused(false);
    setRecording(true);
    setTimeUp(false);
    setWarningMessage("");
  }

  function pauseRecording() {
    mediaRecorderRef.current?.pause();
    setPaused(true);
  }

  function resumeRecording() {
    mediaRecorderRef.current?.resume();
    setPaused(false);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function resetRecorderState() {
    setSeconds(0);
    setWarningMessage("");
    setTimeUp(false);
    setRecording(false);
    setPaused(false);
    setAudioBlob(null);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function submitStory() {
    if (!audioBlob) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "story.webm");
      Object.entries(meta).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, String(value));
      });
      formData.append("transcriptRequested", String(meta.transcript ?? false));

      const res = await fetch("/api/stories", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to submit story");

      setSubmitted(true);
      resetRecorderState();
      localStorage.removeItem("record_meta");
      localStorage.removeItem("record_step");
    } catch (err) {
      console.error(err);
      alert("Failed to submit story. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-green-600">
          <CheckCircle className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Story submitted</h2>
        </div>
        <p className="mt-3 text-gray-700">Thank you for sharing your story.</p>
      </div>
    );
  }
  console.log(audioBlob, "audioBlob")
  return (
    <div className="mt-8 max-w-xl rounded-2xl border bg-white p-8 shadow-sm dark:text-black">
      {!audioBlob ? (
        <div className="flex flex-col items-center gap-4">
          <div className={`flex h-28 w-28 items-center justify-center rounded-full border-4 ${recording ? "border-green-500 bg-red-50" : "border-gray-200"}`}>
            <Mic className={`h-10 w-10 ${recording ? "text-green-600" : "text-gray-500"}`} />
          </div>

          {recording && (
            <div className={getTimerClass()}>
              {paused ? "Paused" : "Recording…"} {formatTimerDisplay(seconds)}
            </div>
          )}

          {warningMessage && (
            <div className="mt-2 text-center text-yellow-700 font-semibold">{warningMessage}</div>
          )}

          {!recording ? (
            <button onClick={startRecording} className="rounded-xl bg-[#0056b3] px-6 py-3 cursor-pointer text-white">Start recording</button>
          ) : (
            <div className="flex gap-3 flex-col md:flex-row">
              {!paused ? (
                <button onClick={pauseRecording} className="inline-flex items-center gap-2 rounded-xl border cursor-pointer px-4 py-2" disabled={timeUp}>
                  <Pause className="h-4 w-4" /> Pause
                </button>
              ) : (
                <button onClick={resumeRecording} className="inline-flex items-center gap-2 rounded-xl border cursor-pointer px-4 py-2" disabled={timeUp}>
                  <Play className="h-4 w-4" /> Resume
                </button>
              )}

              <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-[#0056b3] cursor-pointer px-6 py-3 text-white">
                <Square className="h-4 w-4" /> Stop & save
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 p-4 border rounded-2xl bg-gray-50 shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <audio ref={audioRef}
              controls
              src={audioBlob ? URL.createObjectURL(audioBlob) : undefined}
              className="w-full rounded-lg"
            />

          </div>

          <div className="flex md:flex-row flex-col justify-center gap-4">
            <button onClick={resetRecorderState} className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition cursor-pointer">Re-record</button>

            <button onClick={submitStory} disabled={loading} className={`px-5 py-2 rounded-lg cursor-pointer text-white transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#0056b3] hover:bg-[#0056b3]"}`}>
              {loading ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
