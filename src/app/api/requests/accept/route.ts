import { fetchRedis } from "@/helper/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKeyTransform } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { z } from "zod";

export const POST = async (req: Request) => {
  try {
    const body = await req.json();

    const { id: idToAdd } = z.object({ id: z.string() }).parse(body);
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    const isAlreadyFriends = !!(await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    ));
    if (isAlreadyFriends) {
      return new Response("Already in friendlist", { status: 400 });
    }
    const hasFriendRequest = !!(await fetchRedis(
      "sismember",
      `user:${session.user.id}:incoming_friend_requests`,
      idToAdd
    ));
    if (!hasFriendRequest) {
      return new Response("No friend request", { status: 400 });
    }
    const fetchedFriend = (await fetchRedis("get", idToAdd)) as string;
    //notify added user
    pusherServer.trigger(
      toPusherKeyTransform(`user:${idToAdd}:friends`),
      "new_friend",
      { friend: JSON.parse(fetchedFriend) }
    );

    await db.sadd(`user:${session.user.id}:friends`, idToAdd);
    await db.sadd(`user:${idToAdd}:friends`, session.user.id);
    await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAdd);
    await db.srem(`user:${idToAdd}:incoming_friend_requests`, session.user.id);
    return new Response("OK");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid payload", { status: 422 });
    }
    return new Response("Internal server error", { status: 500 });
  }
};
