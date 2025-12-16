"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { StoryFormData, storySchema } from "../lib/schema";
import { Mic, User, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function StoryForm({
  onSuccess,
}: {
  onSuccess: (data: StoryFormData) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    unregister,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      anonymous: false,
      transcript: false,
      email: undefined,
    },
  });

  const anonymous = watch("anonymous");
  const transcript = watch("transcript");

  useEffect(() => {
    if (!transcript) {
      unregister("email");
      setValue("email", undefined);
    }
  }, [transcript, unregister, setValue]);

  const [micError, setMicError] = useState<string | null>(null);

  async function requestMicPermission() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("UNSUPPORTED");
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMic = devices.some((d) => d.kind === "audioinput");
      if (!hasMic) throw new Error("NO_MIC");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());

      setMicError(null);
      return true;
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setMicError(
          "Microphone access was denied. Please allow microphone permissions and try again."
        );
      } else if (err.name === "NotFoundError" || err.message === "NO_MIC") {
        setMicError("No microphone was found. Please connect one and try again.");
      } else {
        setMicError("Unable to access microphone. Please check browser settings.");
      }
      return false;
    }
  }

  async function onSubmit(data: StoryFormData) {
    const micOk = await requestMicPermission();
    if (!micOk) return;

    onSuccess(data);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 max-w-xl rounded-2xl border bg-white p-8 shadow-sm dark:text-black"
    >
      <header className="mb-6">
        <h2 className="text-2xl font-semibold dark:text-black">Story details</h2>
        <p className="mt-1 text-sm text-gray-600">
          A little context helps listeners connect with your story.
        </p>
      </header>

      <div className="space-y-5">
        {!anonymous && (
          <div>
            <label className="mb-1 block text-sm font-medium">Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                {...register("name", {
                  required: !anonymous
                    ? "Name is required when not anonymous"
                    : false,
                })}
                className="w-full rounded-xl border px-10 py-2"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        )}

        {anonymous && (
          <p className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
            Please avoid sharing names, places, or other identifying details.
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Birthdate *</label>
          <input
            type="date"
            {...register("birthdate", {
              required: "Birthdate is required",
              validate: (value) => {
                if (!value) return true;
                const today = new Date();
                const birthDate = new Date(value);
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                const dayDiff = today.getDate() - birthDate.getDate();

                if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                  age -= 1;
                }
                return age >= 18 || "You must be at least 18 years old";
              },
            })}
            className="w-full rounded-xl border px-3 py-2"
          />
          {errors.birthdate && (
            <p className="mt-1 text-sm text-red-600">{errors.birthdate.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Story title (optional)</label>
          <input
            type="text"
            {...register("storyTitle")}
            className="w-full rounded-xl border px-3 py-2"
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border p-4">
          <input type="checkbox" {...register("anonymous")} />
          <span className="text-sm">
            Share this story <strong>anonymously</strong>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border p-4">
          <input type="checkbox" {...register("transcript")} />
          <span className="text-sm">
            Email me a transcript when my story is ready
          </span>
        </label>

        {transcript && (
          <div>
            <label className="mb-1 block text-sm font-medium">Email address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="email"
                {...register("email", { required: transcript })}
                className="w-full rounded-xl border px-10 py-2"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        )}

        {micError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            {micError}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0056b3] cursor-pointer px-6 py-3 text-sm text-white disabled:opacity-60"
      >
        <Mic className="h-4 w-4" />
        Continue to recorder
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
