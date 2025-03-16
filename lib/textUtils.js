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

export function createMetaDescription(htmlContent, maxLength = 160) {
  if (!htmlContent) {
    return null;
  }
  
  // Remove all HTML tags
  const textContent = htmlContent
    .replace(/<[^>]*>/g, ' ') // Replace tags with space to avoid word joining
    .replace(/\s+/g, ' ')     // Normalize spaces
    .trim();
  
  // Return null if no text content
  if (!textContent) {
    return null;
  }
  
  // If content is already shorter than max length, return it
  if (textContent.length <= maxLength) {
    return textContent;
  }
  
  // Find a good breakpoint - preferably at the end of a sentence
  let breakpoint = textContent.lastIndexOf('.', maxLength - 4); // -4 to account for " (...)"
  
  // If no sentence end found, try for end of a phrase (comma)
  if (breakpoint === -1 || breakpoint < maxLength / 2) {
    breakpoint = textContent.lastIndexOf(',', maxLength - 4);
  }
  
  // If still no good breakpoint, just find the last space before the limit
  if (breakpoint === -1 || breakpoint < maxLength / 2) {
    breakpoint = textContent.lastIndexOf(' ', maxLength - 4);
  }
  
  // If we couldn't find any good breakpoint, just cut at the max length
  if (breakpoint === -1) {
    breakpoint = maxLength - 4;
  }
  
  // Return the truncated text with ellipsis
  return textContent.substring(0, breakpoint + 1) + ' (...)';
}
