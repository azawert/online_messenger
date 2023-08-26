"use client";
import { cn, toPusherKeyTransform } from "@/lib/utils";
import { FC, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";

interface MessagesProps {
  initialMessages: Message[];
  sessionId: string;
  sessionImg: string;
  chatPartner: User;
  chatId: string;
}

const Messages: FC<MessagesProps> = ({
  initialMessages,
  sessionId,
  chatPartner,
  sessionImg,
  chatId,
}) => {
  const scrollDownRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const formatTimestamp = (timestamp: number) => {
    return format(timestamp, "hh:MM");
  };
  useEffect(() => {
    pusherClient.subscribe(toPusherKeyTransform(`chat:${chatId}`));
    const handleMessageBind = (message: Message) => {
      setMessages((p) => [message, ...p]);
    };
    pusherClient.bind("incoming-messages", handleMessageBind);
    return () => {
      pusherClient.unsubscribe(toPusherKeyTransform(`chat:${chatId}`));

      pusherClient.unbind("incoming-messages", handleMessageBind);
    };
  }, [chatId]);
  return (
    <div
      id='messages'
      className='flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-light scrollbar-w-2 scrolling-touch'
    >
      <div ref={scrollDownRef} />
      {messages.map((m, i) => {
        const isMine = m.senderId === sessionId;

        const isHereNextMessageFromSameUser =
          messages[i - 1]?.senderId === messages[i].senderId;
        return (
          <div key={m.id} className='chat-message'>
            <div
              className={cn("flex items-end", {
                "justify-end": isMine,
              })}
            >
              <div
                className={cn(
                  "flex flex-col space-y-2 text-base max-w-xs mx-2",
                  {
                    "order-1 items-end": isMine,
                    "order-2 items-start": !isMine,
                  }
                )}
              >
                <span
                  className={cn("px-4 py-2 rounded-lg inline-block", {
                    "bg-indigo-600 text-white": isMine,
                    "bg-gray-200 text-gray-900": !isMine,
                    "rounded-br-none": !isHereNextMessageFromSameUser && isMine,
                    "rounded-bl-none":
                      !isHereNextMessageFromSameUser && !isMine,
                  })}
                >
                  {m.text}{" "}
                  <span className='ml-2 text-xs text-gray-400'>
                    {formatTimestamp(m.timestamp)}
                  </span>
                </span>
              </div>

              <div
                className={cn("relative w-6 h-6", {
                  "order-2": isMine,
                  "order-1": !isMine,
                  invisible: isHereNextMessageFromSameUser,
                })}
              >
                <Image
                  fill
                  src={isMine ? (sessionImg as string) : chatPartner.image}
                  alt='User image'
                  className='rounded-full'
                  referrerPolicy='no-referrer'
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Messages;
