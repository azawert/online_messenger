import { fetchRedis } from "@/helper/redis";
import { authOptions } from "@/lib/auth";
import { chatHrefConstructor } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface pageProps {}

const page = async ({}) => {
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  const friendsIds = (await fetchRedis(
    "smembers",
    `user:${session.user.id}:friends`
  )) as string[];

  const friends = await Promise.all(
    friendsIds.map(
      async (id) => (await fetchRedis("get", `user:${id}`)) as string
    )
  );
  const parsedFriends = friends.map((f) => JSON.parse(f)) as User[];
  const friendsWithLastMessage = await Promise.all(
    parsedFriends.map(async (f) => {
      const [lastMessageRaw] = (await fetchRedis(
        "zrange",
        `chat:${chatHrefConstructor(session.user.id, f.id)}:messages`,
        -1,
        -1
      )) as string[];
      console.log(lastMessageRaw);
      const lastMessage = JSON.parse(lastMessageRaw ?? []) as Message;
      return {
        ...f,
        lastMessage,
      };
    })
  );
  return (
    <div className='container py-12'>
      <h1 className='font-bold text-5xl mb-8'>Recent chats:</h1>
      {friendsWithLastMessage.length === 0 ? (
        <p className='text-sm text-zinc-500'>Nothing to show</p>
      ) : (
        friendsWithLastMessage.map((f) => (
          <div
            key={f.id}
            className='relative bg-zinc-50 border-zinc-200 p-3 rounded-md'
          >
            <div className='absolute right-4 inset-y-0 flex items-center'>
              <ChevronRight className='h-7 w-7 text-zinc-400' />
            </div>
            <Link
              href={`/dashboard/chat/${chatHrefConstructor(
                session.user.id,
                f.id
              )}`}
              className='sm:flex relative'
            >
              <div className='mb-4 flex-shrink-0 sm:bm-0 sm:mr-4'>
                <div className='relative h-6 w-6'>
                  <Image
                    referrerPolicy='no-referrer'
                    className='rounded-full'
                    alt={`${f.name} profile pic`}
                    src={f.image}
                    fill
                  />
                </div>
              </div>
              <div>
                <h4 className='text-lg font-semibold'>{f.name}</h4>
                <p className='mt-1 max-w-md'>
                  <span className='text-zinc-400'>
                    {f.lastMessage.senderId === session.user.id ? "You:" : ""}
                  </span>
                  {f.lastMessage.text}
                </p>
              </div>
            </Link>
          </div>
        ))
      )}
    </div>
  );
};

export default page;
