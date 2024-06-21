import { object, string } from "zod";

export const zLogin = object({
  email: string().email(),
  password: string().min(1),
})
