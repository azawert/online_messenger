"use client";
import { FC, PropsWithChildren } from "react";
import { Toaster } from "react-hot-toast";

interface ProvidersProps extends PropsWithChildren {}

const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <>
      <Toaster position='top-center' reverseOrder={false} />
      {children}
    </>
  );
};

export default Providers;
