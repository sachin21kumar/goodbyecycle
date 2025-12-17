"use client";

import { useState } from "react";
import { CheckCircle, Lock } from "lucide-react";

export default function ConsentGate({ onNext }: { onNext: () => void }) {
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);

  const canContinue = age && terms;

  return (
    <div className="mt-8 max-w-xl border bg-white p-8 shadow-sm">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-gray-500" />
          <h2 className="text-2xl font-semibold">Before you begin</h2>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          We just need your consent before you record your Coffee Mug Story.
        </p>
      </header>

      <div className="space-y-4">
        <label className="flex cursor-pointer items-start gap-3 border p-4 transition">
          <input
            type="checkbox"
            checked={age}
            onChange={(e) => setAge(e.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer"
          />
          <span className="text-sm text-gray-700">
            I confirm that I am <strong>at least 18 years old</strong>.
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 border p-4 transition">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer"
          />
          <span className="text-sm text-gray-700">
            I have read and agree to the{' '}
            <a href="https://www.goodbyecycle.com/policies/privacy-policy" className="underline" target="_blank">Story Recording Terms</a>{' '}
            and{' '}
            <a href="https://www.goodbyecycle.com/policies/privacy-policy" className="underline" target="_blank">Privacy Notice</a>.
          </span>
        </label>
      </div>

      <button
        disabled={!canContinue}
        onClick={onNext}
        className={`mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${canContinue
            ? "bg-[#e295c1] text-white cursor-pointer"
            : "cursor-not-allowed bg-gray-200 text-gray-500"
          }`}
      >
        <CheckCircle className="h-4 w-4" /> Start Story
      </button>

      <p className="mt-4 text-xs text-gray-500">
        Your recording is private and will only be used according to our terms.
      </p>
    </div>
  );
}
