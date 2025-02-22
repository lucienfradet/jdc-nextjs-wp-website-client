"use client";

import dynamic from "next/dynamic";
import styles from "@/styles/Loading.module.css"; // Import CSS module

const LottiePlayer = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { 
    ssr: false,
    loading: () => <div className="text-[#A22D22]">Loading animation...</div>
  }
);

const Loading = () => {
  return (
    <div className={styles["loading-container"]}>
      <LottiePlayer
        autoplay
        loop
        src="/animations/loading.json"
        className={styles["lottie-animation"]}
      />
    </div>
  );
};

export default Loading;
