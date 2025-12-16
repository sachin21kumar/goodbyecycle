"use client";

import { useEffect, useState } from "react";
import ConsentGate from "../components/ConsentGate";
import StoryForm from "../components/StoryForm";
import AudioRecorder from "../components/AudioRecorder";
import { StoryFormData } from "../lib/schema";

const STEP_KEY = "record_step";
const META_KEY = "record_meta";


export default function RecordPage() {
  const [step, setStep] = useState<number>(0);
  const [meta, setMeta] = useState<StoryFormData | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const savedStep = localStorage.getItem(STEP_KEY);
    const savedMeta = localStorage.getItem(META_KEY);

    if (savedStep) setStep(Number(savedStep));
    if (savedMeta) setMeta(JSON.parse(savedMeta));

    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(STEP_KEY, String(step));

    if (meta) {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    }
  }, [step, meta, hydrated]);
  if (!hydrated) return null;

  return (
    <main className="p-10 max-w-xl mx-auto dark:text-black">
      <h1 className="text-2xl font-bold mb-6">Record Your Mug Story</h1>

      {step === 0 && <ConsentGate onNext={() => setStep(1)} />}

      {step === 1 && (
        <StoryForm
          onSuccess={(data) => {
            setMeta(data);
            setStep(2);
          }}
        />
      )}

      {step === 2 && meta && <AudioRecorder meta={meta} />}
    </main>
  );
}
