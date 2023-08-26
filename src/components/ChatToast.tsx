import { chatHrefConstructor, cn } from "@/lib/utils";
import { FC } from "react";
import { Toast, toast } from "react-hot-toast";
import Image from "next/image";

interface ChatToastProps {
  t: Toast;
  sessionId: string;
  friendId: string;
  friendImg: string;
  friendName: string;
  friendMessage: string;
}

const ChatToast: FC<ChatToastProps> = ({
  t,
  friendId,
  sessionId,
  friendImg,
  friendName,
  friendMessage,
}) => {
  return (
    <div
      className={cn(
        "max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5",
        { "animate-pulse": t.visible, "animate-bounce": !t.visible }
      )}
    >
      <a
        onClick={() => toast.dismiss(t.id)}
        href={`/dashboard/chat/${chatHrefConstructor(sessionId, friendId)}`}
        className='flex-1 w-0 p-4'
      >
        <div className='flex items-start'>
          <div className='flex-shrink-0 pt-0.5'>
            <div className='relative h-10 w-10'>
              <Image
                fill
                alt='Friend image'
                referrerPolicy='no-referrer'
                src={friendImg}
              />
            </div>
          </div>
          <div className='ml-3 flex-1'>
            <p className='text-sm font-medium text-gray-900'>{friendName}</p>
            <p className='mt-1 text-sm text-gray-500'>{friendMessage}</p>
          </div>
        </div>
      </a>
      <div className='flex border-l border-gray-200'>
        <button
          onClick={() => toast.dismiss(t.id)}
          className='w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center font-medium text-indigo-600 hover:text-indigo-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
        >
          X
        </button>
      </div>
    </div>
  );
};

export default ChatToast;
