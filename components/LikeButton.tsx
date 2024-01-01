"use client";

import { useSessionContext } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import toast from "react-hot-toast";

import useAuthModal from "@/hooks/useAuthModal";
import { useUser } from "@/hooks/useUser";

interface LikeButtonProps {
  songId: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({ songId }) => {
  const router = useRouter();
  // TODO  为什么用 useSessionContext， 而不是useSupabaseClient
  const { supabaseClient } = useSessionContext();
  const authModal = useAuthModal();
  const { user } = useUser();

  const [isLiked, setIsLiked] = useState<boolean>(false);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const fetchData = async () => {
      const { data, error } = await supabaseClient
        .from("liked_songs")
        .select("*")
        .eq("user_id", user.id)
        .eq("song_id", songId)
        .single();
      if (!error && data) {
        setIsLiked(true);
      }
    };

    fetchData();
  }, [songId, supabaseClient, user?.id]);

  const Icon = isLiked ? AiFillHeart : AiOutlineHeart;

  const handleLike = async () => {
    if (!user) {
      authModal.onOpen();
      return;
    }
    if (isLiked) {
      const { error } = await supabaseClient
        .from("liked_songs")
        .delete()
        .eq("user_id", user.id)
        .eq("song_id", songId);
      if (error) {
        toast.error(error.message);
      } else {
        setIsLiked(false);
      }
    } else {
      const { error } = await supabaseClient.from("liked_songs").insert({
        song_id: songId,
        user_id: user.id,
      });
      if (error) {
        toast.error(error.message);
      } else {
        setIsLiked(true);
        toast.success("Song Liked");
      }
    }

    router.refresh();
  };

  return (
    <button
      className="cursor-pointer hover:opacity-75 transition"
      onClick={handleLike}
    >
      <Icon color={isLiked ? "#22c55e" : "white"} size={25} />
    </button>
  );
};

export default LikeButton;
