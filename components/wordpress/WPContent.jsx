import React from 'react';
import styles from '@/styles/wordpress/WPContent.module.css';

const WPContent = ({ content, className = '' }) => {
  if (!content) return null;
  
  return (
    <div 
      className={`${styles.wpContent} ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}; 

export default WPContent;
