"use client";

import { ButtonHTMLAttributes, FC, useState } from "react";
import Button from "./ui/Button";
import { signOut } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface SignOutProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const SignOut: FC<SignOutProps> = ({ ...rest }) => {
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const { push } = useRouter();
  return (
    <Button
      {...rest}
      variant={"ghost"}
      onClick={async () => {
        setIsSigningOut(true);
        try {
          await signOut();
          push("/login");
        } catch (e: any) {
          toast.error("There was a problem signing out");
        } finally {
          setIsSigningOut(false);
        }
      }}
    >
      {isSigningOut ? (
        <Loader2 className='animate-spin h-4 w-4' />
      ) : (
        <LogOut className='h-4 w-4' />
      )}
    </Button>
  );
};

export default SignOut;
