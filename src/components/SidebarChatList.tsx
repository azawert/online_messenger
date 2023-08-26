"use client";
import { pusherClient } from "@/lib/pusher";
import { chatHrefConstructor, toPusherKeyTransform } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import ChatToast from "./ChatToast";

interface SidebarChatListProps {
  friends: User[];
  sessionId: string;
}

const SidebarChatList: FC<SidebarChatListProps> = ({ friends, sessionId }) => {
  const pathname = usePathname();
  const { refresh } = useRouter();
  const [unseenMessage, setUnseenMessages] = useState<Message[]>([]);

  useEffect(() => {
    pusherClient.subscribe(toPusherKeyTransform(`user:${sessionId}:chats`));
    pusherClient.subscribe(toPusherKeyTransform(`user:${sessionId}:friends`));
    const handleChatNewMessages = (
      message: Message & { name: string; image: string }
    ) => {
      const isNotificationShouldHappen =
        pathname !==
        `/dashboard/chat/${chatHrefConstructor(sessionId, message.senderId)}`;

      if (!isNotificationShouldHappen) return;
      toast.custom((t) => (
        //custom notification
        <ChatToast
          t={t}
          friendId={message.senderId}
          sessionId={sessionId}
          friendImg={message.image}
          friendName={message.name}
          friendMessage={message.text}
        />
      ));
      setUnseenMessages((p) => [...p, message]);
    };

    const handleNewFriendHandler = (friend: User) => {
      refresh();
    };
    pusherClient.bind("new_message", handleChatNewMessages);
    pusherClient.bind("new_friend", handleNewFriendHandler);
    return () => {
      pusherClient.unsubscribe(
        toPusherKeyTransform(`user:${sessionId}:friends`)
      );
      pusherClient.unsubscribe(toPusherKeyTransform(`user:${sessionId}:chats`));
      pusherClient.unbind("new_message", handleChatNewMessages);
      pusherClient.unbind("new_friend", handleNewFriendHandler);
    };
  }, [pathname, sessionId, refresh]);
  useEffect(() => {
    if (pathname?.includes("chat")) {
      setUnseenMessages((p) => {
        return p.filter((m) => !pathname.includes(m.senderId));
      });
    }
  }, [pathname]);
  return (
    <ul role='list' className='max-h-[25rem] overflow-y-auto -mx-2 '>
      {friends.sort().map((f) => {
        const unseenMessagesCount: number = unseenMessage.filter(
          (msg) => msg.senderId === f.id
        ).length;
        return (
          <li key={f.id}>
            <a
              href={`/dashboard/chat/${chatHrefConstructor(sessionId, f.id)}`}
              className='text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
            >
              {f.name}
              {unseenMessagesCount > 0 ? (
                <div className='bg-indigo-600 font-medium text-xs text-white w-4 h-4 rounded-full flex justify-center items-center'>
                  {unseenMessagesCount}
                </div>
              ) : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default SidebarChatList;
