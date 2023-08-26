import { fetchRedis } from "@/helper/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { nanoid } from "nanoid";
import { messageValidator } from "@/lib/validations/messages";
import { ZodError } from "zod";
import { pusherServer } from "@/lib/pusher";
import { toPusherKeyTransform } from "@/lib/utils";

export const POST = async (req: Request) => {
  try {
    const { text, chatId }: { text: string; chatId: string } = await req.json();
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    const [userId1, userId2] = chatId.split("--");
    if (userId1 !== session.user.id && userId2 !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const friendId = session.user.id === userId1 ? userId2 : userId1;
    const friendList = (await fetchRedis(
      "smembers",
      `user:${session.user.id}:friends`
    )) as string[];
    const isInFriendList = friendList.includes(friendId);
    if (!isInFriendList) {
      return new Response("This user is not your friend", { status: 400 });
    }
    const timestamp = Date.now();
    const sender = JSON.parse(
      (await fetchRedis("get", `user:${session.user.id}`)) as string
    ) as User;
    const messageData: Message = {
      id: nanoid(),
      senderId: session.user.id,
      receiverId: friendId,
      timestamp,
      text,
    };
    const message = messageValidator.parse(messageData);
    // notify
    await pusherServer.trigger(
      toPusherKeyTransform(`chat:${chatId}`),
      "incoming-messages",
      message
    );
    await pusherServer.trigger(
      toPusherKeyTransform(`user:${friendId}:chats`),
      "new_message",
      {
        ...message,
        image: sender.image,
        name: sender.name,
      }
    );
    //if everything is okay, send the message
    await db.zadd(`chat:${chatId}:messages`, {
      score: timestamp,
      member: JSON.stringify(message),
    });

    return new Response("OK");
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(error.message);
    }
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }
    return new Response("Internal server error", { status: 500 });
  } finally {
  }
};
