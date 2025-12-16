import { z } from "zod";

export const storySchema = z
  .object({
    name: z.string().optional(),
    storyTitle: z.string().optional(),
    anonymous: z.boolean(),
    transcript: z.boolean(),
    email: z.string().email().optional(),
    birthdate: z
      .string()
      .refine((value) => {
        const today = new Date();
        const birthDate = new Date(value);

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        const d = today.getDate() - birthDate.getDate();

        if (m < 0 || (m === 0 && d < 0)) {
          age--;
        }

        return age >= 18;
      }, "You must be at least 18 years old"),
  })
  .superRefine((data, ctx) => {
    if (!data.anonymous && (!data.name || data.name.trim() === "")) {
      ctx.addIssue({
        path: ["name"],
        code: z.ZodIssueCode.custom,
        message: "Name is required if not anonymous",
      });
    }

    if (data.transcript && (!data.email || data.email.trim() === "")) {
      ctx.addIssue({
        path: ["email"],
        code: z.ZodIssueCode.custom,
        message: "Email is required to receive transcript",
      });
    }
  });

export type StoryFormData = z.infer<typeof storySchema>;
