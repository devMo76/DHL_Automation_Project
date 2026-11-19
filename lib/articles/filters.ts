import { z } from "zod";

export const articleFiltersSchema = z.object({
  search: z.string().trim().max(100).default(""),
  status: z.enum(["draft", "reviewed", "published", "all", ""]).default(""),
  tag: z.string().trim().max(50).default(""),
  creatorId: z
    .string()
    .trim()
    .default("")
    .refine(
      (value) => value === "" || z.string().uuid().safeParse(value).success,
      "Invalid creator ID",
    ),
  from: z
    .string()
    .trim()
    .default("")
    .refine(
      (value) => value === "" || !Number.isNaN(Date.parse(value)),
      "Invalid from date",
    ),
  to: z
    .string()
    .trim()
    .default("")
    .refine(
      (value) => value === "" || !Number.isNaN(Date.parse(value)),
      "Invalid to date",
    ),
});
