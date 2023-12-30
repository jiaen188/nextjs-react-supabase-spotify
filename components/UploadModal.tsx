"use client";

import { useSupabaseClient } from "@supabase/auth-helpers-react";
import toast from "react-hot-toast";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import uniqid from "uniqid";
import { useRouter } from "next/navigation";

import useUploadModal from "@/hooks/useUploadModal";
import { useUser } from "@/hooks/useUser";

import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";

const UploadModal = () => {
  const [loading, setLoading] = useState(false);

  const uploadModal = useUploadModal();
  const { user } = useUser();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();

  const { register, handleSubmit, reset } = useForm<FieldValues>({
    defaultValues: {
      author: "",
      title: "",
      song: null,
      image: null,
    },
  });

  const onChange = (open: boolean) => {
    if (!open) {
      reset();
      uploadModal.onClose();
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async (values) => {
    try {
      setLoading(true);
      const songFile = values.song?.[0];
      const imageFile = values.image?.[0];

      if (!imageFile || !songFile || !user) {
        toast.error("Missing fields");
        return;
      }

      const uniqueId = uniqid();

      // Upload song
      const { data: songData, error: songError } = await supabaseClient.storage
        .from("songs")
        .upload(`song-${values.title}-${uniqueId}`, songFile, {
          cacheControl: "3600",
          upsert: false,
        });
      if (songError) {
        setLoading(false);
        return toast.error("Error uploading song");
      }

      // Upload image
      const { data: imageData, error: imageError } =
        await supabaseClient.storage
          .from("images")
          .upload(`image-${values.title}-${uniqueId}`, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });
      if (imageError) {
        setLoading(false);
        return toast.error("Error uploading image");
      }

      // Create record
      const { error: supabaseError } = await supabaseClient
        .from("songs")
        .insert({
          user_id: user.id,
          title: values.title,
          author: values.author,
          song_path: songData.path,
          image_path: imageData.path,
        });

      if (supabaseError) {
        return toast.error(supabaseError.message);
      }

      router.refresh();
      setLoading(false);
      toast.success("Song created!");
      reset();
      uploadModal.onClose();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add a song"
      description="Upload an mp3 file"
      isOpen={uploadModal.isOpen}
      onChange={onChange}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
        <Input
          id="title"
          disabled={loading}
          {...register("title", { required: true })}
          placeholder="Song title"
        ></Input>
        <Input
          id="author"
          disabled={loading}
          {...register("author", { required: true })}
          placeholder="Song author"
        />
        <div>
          <div className="pb-1">Select a song file</div>
          <Input
            disabled={loading}
            type="file"
            accept=".mp3"
            id="song"
            {...register("song", { required: true })}
          />
        </div>
        <div>
          <div className="pb-1">Select an image</div>
          <Input
            disabled={loading}
            type="file"
            accept="image/*"
            id="image"
            {...register("image", { required: true })}
          />
        </div>
        <Button disabled={loading} type="submit">
          Create
        </Button>
      </form>
    </Modal>
  );
};

export default UploadModal;
