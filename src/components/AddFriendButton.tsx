"use client";

import { FC, useState } from "react";
import Button from "./ui/Button";
import {
  TAddFriendValidator,
  addFriendValidator,
} from "@/lib/validations/add-friend";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface AddFriendButtonProps {}

const AddFriendButton: FC<AddFriendButtonProps> = ({}) => {
  const [showSuccessState, setShowSuccessState] = useState<boolean>(false);
  const {
    register,
    formState: { errors },
    setError,
    handleSubmit,
  } = useForm<TAddFriendValidator>({
    resolver: zodResolver(addFriendValidator),
  });
  const addFriendByEmail = async (email: string) => {
    try {
      const validatedEmail = addFriendValidator.parse({ email });
      await axios.post("/api/add-friend", validatedEmail);
      setShowSuccessState(true);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError("email", {
          message: e.message,
        });
        return;
      }
      if (e instanceof AxiosError) {
        setError("email", {
          message: e.response?.data,
        });
        return;
      }
      setError("email", {
        message: "Something went wrong",
      });
    }
  };
  const onSubmit = (data: TAddFriendValidator) => {
    addFriendByEmail(data.email);
  };
  return (
    <form className='max-w-sm' onSubmit={handleSubmit(onSubmit)}>
      <label
        htmlFor='email'
        className='block text-sm font-medium leading-6 text-gray-900'
      >
        Add friend by his email
      </label>
      <div className='mt-2 flex gap-4'>
        <input
          type='text'
          className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
          placeholder='you@example.com'
          {...register("email")}
        />

        <Button type='submit'>Add</Button>
      </div>
      {errors && (
        <p className='text-red-600 mt-1 text-sm'>{errors.email?.message}</p>
      )}
      {showSuccessState && (
        <p className='text-green-600 mt-1 text-sm'>Friend request sent!</p>
      )}
    </form>
  );
};

export default AddFriendButton;
