import FriendRequests from "@/components/FriendRequests";
import { fetchRedis } from "@/helper/redis";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

const page = async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    return notFound();
  }

  const incomingIdsRequest = (await fetchRedis(
    "smembers",
    `user:${session.user.id}:incoming_friend_requests`
  )) as string[];
  const incomingFriendRequest = await Promise.all(
    incomingIdsRequest.map(async (incomingId) => {
      const sender = (await fetchRedis("get", `user:${incomingId}`)) as string;
      const parsedSender = JSON.parse(sender) as User;
      return {
        senderId: incomingId,
        senderEmail: parsedSender.email,
      };
    })
  );

  return (
    <section className='pt-8'>
      <h1 className='font-bold text-5xl mb-8'>Add a friend</h1>
      <div className='flex flex-col gap-4'>
        <FriendRequests
          incomingFriendRequests={incomingFriendRequest}
          sessionId={session.user.id}
        />
      </div>
    </section>
  );
};

export default page;
