import parser from 'html-react-parser';

function containsHtmlTags(str) {
  // List of block elements to detect
  const blockTags = /<\/?(p|div|h[1-6]|ul|ol|li|table|thead|tbody|tr|td|th|blockquote|pre|section|article|aside|header|footer|nav|figure|figcaption|main|address)[\s>]/i;
  return blockTags.test(str);
}

export function convertLineBreaksToHtml(content) {
  if (!content) return '';
  return content.replace(/(?:\r\n|\r|\n)/g, '<br>');
}

export function renderContent(content, className = "") {
  if (!content) return null;

  if (containsHtmlTags(content)) {
    // Wrap raw text without tags inside a <p> and parse the whole string
    const parsedContent = parser(content, {
      replace: (domNode) => {
        if (
          domNode.type === "text" &&
          domNode.data.trim() !== "" &&
          !domNode.parent
        ) {
          return <p className={className}>{domNode.data}</p>;
        }
      },
    });

    return <div className={className}>{parsedContent}</div>;
  }

  // Otherwise, assume plain text and render within a <p> tag
  return <p className={className} dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(content) }}></p>;
}
