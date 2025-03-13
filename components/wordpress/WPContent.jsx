import styles from '@/styles/wordpress/WPContent.module.css';

export default function WPContent({ content, className = '' }) {
  return (
    <div 
      className={`${styles.wpContent} ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
