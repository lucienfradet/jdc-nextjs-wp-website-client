"use client";

import { useState } from "react";
import styles from "@/styles/BurgerMenu.module.css";

const BurgerMenu = ({ burgerState, onBurgerClick }) => {
  return (
    <div
      onClick={onBurgerClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 400 400" fill="none">
        <g id="BurgerMenu_1_0">
          <path
            id="Line_2_1"
            className={`${styles.line} ${styles.animated} ${burgerState === 0 ? styles.flow_1_1 : styles.flow_1_2}`}
            d="M111 138H104V152H111V138ZM111 152H288V138H111V152Z"
            fill="#F5F0E1"
          />
          <path
            id="Line_3_2"
            className={`${styles.line} ${styles.animated} ${burgerState === 0 ? styles.flow_2_1 : styles.flow_2_2}`}
            d="M111 194H104V208H111V194ZM111 208H288V194H111V208Z"
            fill="#F5F0E1"
          />
          <path
            id="Line_4_3"
            className={`${styles.line} ${styles.animated} ${burgerState === 0 ? styles.flow_3_1 : styles.flow_3_2}`}
            d="M111 248H104V262H111V248ZM111 262H288V248H111V262Z"
            fill="#F5F0E1"
          />
        </g>
      </svg>
    </div>
  );
};

export default BurgerMenu;
