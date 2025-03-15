"use client";
import Image from "next/image";
import styles from "@/styles/Loading.module.css";

const Loading = () => {
  return (
    <div className={styles["loading-container"]}>
      <div className={styles["content-wrapper"]}>
        {/* Logo */}
        <div className={styles["logo-container"]}>
          <Image 
            src="/images/jdc_logo.png" 
            alt="JDC Logo" 
            width={100} 
            height={100} 
            priority
          />
        </div>
        
        {/* Loading bar animation */}
        <div className={styles["loading-bar-container"]}>
          <div className={styles["loading-bar"]}></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
