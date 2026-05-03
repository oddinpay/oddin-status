import { date, z } from "zod/v4";


export const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters long")
    .max(50, "Title must not exceed 50 characters"),

  image: z.string().trim().optional(),

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

  slug: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || z.url().safeParse(val).success, {
      message: "Slug must be a valid URL",
    }),
});

export const formUpdate = z.object({
  _id: z.string().trim().optional(),
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters long")
    .max(50, "Title must not exceed 50 characters")
    .optional()
    .or(z.literal("")),

  image: z.string().trim().optional(),

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

  slug: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || z.url().safeParse(val).success, {
      message: "Slug must be a valid URL",
    }),
});



export const monitorCreate = z.object({
  _id: z.string().trim().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Name must be at least 1 character long")
    .max(50, "Name must not exceed 50 characters"),
  protocol: z
    .enum(["https", "http", "tcp", "dns"], {
      message: "Protocol must be one of: https, http, tcp, dns",
    })
    .default("https"),
  host: z.string().trim(),
  port: z
    .number()
    .min(1, "Port must be a positive number")
    .max(65535, "Port must be less than 65536")
    .optional(),
  interval: z
    .number()
    .min(0, "Interval must be a positive number")
    .default(10)
    .optional(),
});

export const monitorUpdate = z.object({
  _id: z.string().trim().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Name must be at least 1 character long")
    .max(50, "Name must not exceed 50 characters")
    .optional(),
  protocol: z
    .enum(["https", "http", "tcp", "dns"], {
      message: "Protocol must be one of: https, http, tcp, dns",
    })
    .default("https")
    .optional(),
  host: z.string().trim().optional(),
  port: z
    .number()
    .min(1, "Port must be a positive number")
    .max(65535, "Port must be less than 65536")
    .optional(),
  interval: z
    .number()
    .min(0, "Interval must be a positive number")
    .default(10)
    .optional(),
});


export const scheduleCreate = z.object({
  _id: z.string().trim().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Title must be at least 1 character long")
    .max(50, "Title must not exceed 50 characters").optional(),

  service: z
    .string()
    .trim()
    .min(1, "Service must be at least 1 character long")
    .max(50, "Service must not exceed 50 characters"),

  status: z
    .enum(["Scheduled", "Inprogress", "Completed", "Cancelled"], {
      message: "Status must be one of: Scheduled, In Progress, Completed, Cancelled",
    })
    .default("Scheduled"),

  note: z
    .string()
    .trim()
    .min(1, "Note must be at least 1 character long")
    .max(180, "Note must not exceed 180 characters"),

  date: z.any()
    .refine((val) => val !== undefined && val !== null && val !== "", {
      message: "Date is required and cannot be empty",
    }),

  time: z.any()
    .refine((val) => val !== undefined && val !== null && val !== "", {
      message: "Time is required and cannot be empty",
    }),

});


export const scheduleUpdate = z.object({
  parentId: z
    .string()
    .trim()
    .startsWith("sc_", { message: "Parent ID must start with 'sc_'" }),
  service: z
    .string()
    .trim()
    .min(1, "Service must be at least 1 character long")
    .max(50, "Service must not exceed 50 characters")
    .optional(),

  status: z
    .enum(["Inprogress", "Completed", "Cancelled"], {
      message: "Status must be one of: In Progress, Completed, Cancelled",
    })
    .default("Inprogress"),

  note: z
    .string()
    .trim()
    .min(1, "Note must be at least 1 character long")
    .max(180, "Note must not exceed 180 characters")
    .optional(),
});


export const incidentCreate = z.object({
  _id: z.string().trim().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Title must be at least 1 character long")
    .max(50, "Title must not exceed 50 characters").optional(),

  service: z
    .string()
    .trim()
    .min(1, "Service must be at least 1 character long")
    .max(50, "Service must not exceed 50 characters"),

  status: z
    .enum(["Identified", "Investigating", "Inprogress", "Resolved"], {
      message: "Status must be one of: Identified, Investigating, In Progress, Resolved",
    })
    .default("Identified"),

  note: z
    .string()
    .trim()
    .min(1, "Note must be at least 1 character long")
    .max(180, "Note must not exceed 180 characters")

});


export const incidentUpdate = z.object({
  parentId: z
    .string()
    .trim()
    .startsWith("sc_", { message: "Parent ID must start with 'sc_'" }),

  service: z
    .string()
    .trim()
    .min(1, "Service must be at least 1 character long")
    .max(50, "Service must not exceed 50 characters")
    .optional(),

  status: z
    .enum(["Investigating", "Inprogress", "Resolved"], {
      message: "Status must be one of: Investigating, In Progress, Resolved",
    }).default("Investigating"),

  note: z
    .string()
    .trim()
    .min(1, "Note must be at least 1 character long")
    .max(180, "Note must not exceed 180 characters")
    .optional(),
});

