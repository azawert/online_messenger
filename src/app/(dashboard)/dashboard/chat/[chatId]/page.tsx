import ChatInput from "@/components/ChatInput";
import Messages from "@/components/Messages";
import { fetchRedis } from "@/helper/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { messageArrayValidator } from "@/lib/validations/messages";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FC } from "react";
import { z } from "zod";

interface pageProps {
  params: {
    chatId: string;
  };
}
async function getChatMessages(chatId: string) {
  try {
    const result: string[] = await fetchRedis(
      "zrange",
      `chat:${chatId}:messages`,
      0,
      -1
    );
    const dbMessages = result.map((message) => JSON.parse(message) as Message);
    const reversedDbMessages = dbMessages.reverse();
    const messages = messageArrayValidator.parse(reversedDbMessages);

    return messages;
  } catch (error: any) {
    notFound();
  }
}

const page = async ({ params }: pageProps) => {
  const { chatId } = params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return notFound();
  }
  const [userId1, userId2] = chatId.split("--");
  if (session.user.id !== userId1 && session.user.id !== userId2) {
    return notFound();
  }
  const chatPartnerId = session.user.id === userId1 ? userId2 : userId1;
  const chatPartner = (await fetchRedis(
    "get",
    `user:${chatPartnerId}`
  )) as string;
  const parsedChatPartner = JSON.parse(chatPartner) as User;
  const initialMessages = await getChatMessages(chatId);
  return (
    <div className='flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)]'>
      <div className='flex sm:items-center justify-between py-3 border-b-2 border-gray-200'>
        <div className='relative flex items-center space-x-4'>
          <div className='relative'>
            <div className='relative w-8 sm:w-12 h-8 sm:h-12'>
              <Image
                alt='User pic'
                fill
                src={parsedChatPartner.image}
                referrerPolicy='no-referrer'
                className='rounded-full'
              />
            </div>
          </div>
          <div className='flex flex-col leading-tight'>
            <div className='text-xl flex items-center'>
              <span className='text-gray-700 mr-3 font-semibold'>
                {parsedChatPartner.name}
              </span>
            </div>
            <span className='text-sm text-gray-600'>
              {parsedChatPartner.email}
            </span>
          </div>
        </div>
      </div>
      <Messages
        initialMessages={initialMessages}
        sessionId={session.user.id}
        chatPartner={parsedChatPartner}
        sessionImg={session.user.image ?? ""}
        chatId={chatId}
      />
      <ChatInput chatPartner={parsedChatPartner} chatId={chatId} />
    </div>
  );
};

export default page;
