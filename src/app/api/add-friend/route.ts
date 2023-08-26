import { fetchRedis } from "@/helper/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKeyTransform } from "@/lib/utils";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { z } from "zod";

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { email } = addFriendValidator.parse(body);
    const resp = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/user:email:${email}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
        cache: "no-store",
      }
    );
    const data = (await resp.json()) as { result: string | null };
    const idToAdd = data.result;
    const session = await getServerSession(authOptions);
    if (!idToAdd) {
      return new Response("Does not exist", { status: 400 });
    }
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (idToAdd === session.user.id) {
      return new Response("You cant add yourself as a friend", { status: 400 });
    }
    const isAlreadyAdded = (await fetchRedis(
      "sismember",
      `user:${idToAdd}:incoming_friend_requests`,
      session.user.id
    )) as 0 | 1;
    if (isAlreadyAdded) {
      return new Response("Already added this user", { status: 400 });
    }
    const isAlreadyFriends = (await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    )) as 0 | 1;
    if (isAlreadyFriends) {
      return new Response("Already added this user", { status: 400 });
    }
    pusherServer.trigger(
      toPusherKeyTransform(`user:${idToAdd}:incoming_friend_requests`),
      "incoming_friend_requests",
      {
        senderId: session.user.id,
        senderEmail: session.user.email,
      }
    );
    db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id);
    return new Response("OK");
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return new Response("Something went wrong, check your email", {
        status: 422,
      });
    }
    return new Response(error.message ?? error, { status: 500 });
  }
};
