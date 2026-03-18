import { z } from "zod/v4";

export const formUpdate = z.object({
  id: z.string(),
  image: z.string().trim().optional(),
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters long")
    .max(50, "Title must not exceed 50 characters")
    .optional()
    .or(z.literal("")),

  description: z
    .string()
    .trim()
    .min(2, "Description must be at least 2 characters long")
    .max(100, "Description must not exceed 100 characters")
    .optional()
    .or(z.literal("")),

  textLogo: z
    .string()
    .trim()
    .min(2, "Text Logo must be at least 2 characters long")
    .max(50, "Text Logo must not exceed 50 characters")
    .optional(),

  signup: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || z.url().safeParse(val).success, {
      message: "Sign up URL must be a valid URL",
    }),

  signin: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || z.url().safeParse(val).success, {
      message: "Sign in URL must be a valid URL",
    }),
});

export const formSchema = z.object({
  image: z.string().trim().optional(),
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters long")
    .max(50, "Title must not exceed 50 characters"),

  description: z
    .string()
    .trim()
    .min(2, "Description must be at least 2 characters long")
    .max(100, "Description must not exceed 100 characters"),

  textLogo: z
    .string()
    .trim()
    .min(2, "Text Logo must be at least 2 characters long")
    .max(50, "Text Logo must not exceed 50 characters")
    .optional(),

  signup: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || z.url().safeParse(val).success, {
      message: "Sign up URL must be a valid URL",
    }),

  signin: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || z.url().safeParse(val).success, {
      message: "Sign in URL must be a valid URL",
    }),
});
