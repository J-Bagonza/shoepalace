import { z } from "zod";
import { commonSchemas } from "./schemas";

export const signupSchema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
});

export const signinSchema = z.object({
  email: commonSchemas.email,
  password: z
    .string()
    .min(1, "Password is required")
    .max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;