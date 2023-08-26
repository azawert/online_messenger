import { z } from "zod";

export const addFriendValidator = z.object({
  email: z.string().email(),
});

export type TAddFriendValidator = z.infer<typeof addFriendValidator>;
