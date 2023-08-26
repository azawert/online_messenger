"use client";
import { pusherClient } from "@/lib/pusher";
import { toPusherKeyTransform } from "@/lib/utils";
import axios, { AxiosError } from "axios";
import { Check, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, Fragment, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface FriendRequestsProps {
  incomingFriendRequests: IncomingFriendRequest[];
  sessionId: string | null;
}

const FriendRequests: FC<FriendRequestsProps> = ({
  incomingFriendRequests,
  sessionId,
}) => {
  const [friendRequests, setFriendRequests] = useState<IncomingFriendRequest[]>(
    incomingFriendRequests
  );
  const { refresh } = useRouter();
  const acceptFriend = async (friendToAddId: string) => {
    try {
      await axios.post("/api/requests/accept", { id: friendToAddId });
      setFriendRequests((prev) =>
        prev.filter((req) => req.senderId !== friendToAddId)
      );
      refresh();
    } catch (e: any) {
      if (e instanceof AxiosError) {
        return toast.error(e.response?.data);
      }
      return toast.error("Internal Server Error");
    }
  };
  const denyFriend = async (friendToDenyId: string) => {
    try {
      await axios.post("/api/requests/deny", { id: friendToDenyId });
      setFriendRequests((prev) =>
        prev.filter((req) => req.senderId !== friendToDenyId)
      );
      refresh();
    } catch (e: any) {
      if (e instanceof AxiosError) {
        return toast.error(e.response?.data);
      }
      return toast.error("Internal Server Error");
    }
  };
  useEffect(() => {
    pusherClient.subscribe(
      toPusherKeyTransform(`user:${sessionId}:incoming_friend_requests`)
    );
    const friendRequestHandler = ({
      senderId,
      senderEmail,
    }: IncomingFriendRequest) => {
      setFriendRequests((p) => [...p, { senderEmail, senderId }]);
    };
    pusherClient.bind("incoming_friend_requests", friendRequestHandler);
    return () => {
      pusherClient.unsubscribe(
        toPusherKeyTransform(`user:${sessionId}:incoming_friend_requests`)
      );
      pusherClient.unbind("incoming_friend_requests", friendRequestHandler);
    };
  }, [sessionId]);
  return (
    <Fragment>
      {friendRequests.length === 0 ? (
        <p className='text-sm text-zinc-500'>Nothing to show here.</p>
      ) : (
        friendRequests.map((req) => {
          return (
            <div className='flex gap-4 items-center' key={req.senderId}>
              <UserPlus className='text-black' />
              <p className='font-medium text-lg'>{req.senderEmail}</p>
              <button
                aria-label='accept friend'
                className='w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center rounded-full transition'
                onClick={() => acceptFriend(req.senderId)}
              >
                <Check className='font-semibold text-white w-3/4 h-3/4' />
              </button>
              <button
                aria-label='decline friend'
                className='w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center rounded-full transition'
                onClick={() => denyFriend(req.senderId)}
              >
                <X className='font-semibold text-white w-3/4 h-3/4' />
              </button>
            </div>
          );
        })
      )}
    </Fragment>
  );
};

export default FriendRequests;
