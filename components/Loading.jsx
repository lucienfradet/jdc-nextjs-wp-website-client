"use client";

import dynamic from "next/dynamic";
import styles from "@/styles/Loading.module.css"; // Import CSS module
import { useRouter } from 'next/router';

const LottiePlayer = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { 
    ssr: false,
    loading: () => <div className="text-[#A22D22]">Loading animation...</div>
  }
);

const Loading = () => {
  const { basePath } = useRouter(); // Get basePath dynamically

  return (
    <div className={styles["loading-container"]}>
      <LottiePlayer
        autoplay
        loop
        src={`${basePath}/animations/loading.json`}
        className={styles["lottie-animation"]}
      />
    </div>
  );
};

export default Loading;
