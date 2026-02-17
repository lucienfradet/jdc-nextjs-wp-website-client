import Image from "next/image";

export default function WPImage({ image, className, forceFullSize = false }) {
  if (!image || typeof image !== 'object') {
    return (
      <div className={className ? `image-wrapper ${className}` : 'image-wrapper'}>
        <div className="image-placeholder">
          Image manquante...
        </div>
      </div>
    );
  }

  const { alt, sizes } = image;

  return (
    <div className={className ? `image-wrapper ${className}` : 'image-wrapper'}>
      <Image
        src={image.full}
        alt={alt || "Image"}
        width={sizes.full?.width || 600}
        height={sizes.full?.height || 400}
        sizes={forceFullSize ? undefined : "(max-width: 320px) 150px, (max-width: 768px) 300px, (max-width: 1200px) 600px, 100vw"}
        srcSet={forceFullSize ? undefined : Object.values(sizes)
          .map(size => `${size.source_url} ${size.width}w`)
          .join(", ")}
        className="image-content"
        priority
      />
    </div>
  );
}
