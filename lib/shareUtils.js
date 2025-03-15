export function sharePost(title, url) {
  if (navigator.share) {
    navigator.share({
      title: title,
      url: url
    })
    .then(() => console.log('Successfully shared'))
    .catch((error) => console.log('Error sharing:', error));
  } else {
    // Fallback for browsers that don't support the Web Share API
    navigator.clipboard.writeText(url)
      .then(() => alert('Link copied to clipboard!'))
      .catch(() => alert('Unable to copy link. Please copy the URL manually.'));
  }
}
