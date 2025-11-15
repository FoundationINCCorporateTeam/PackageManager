import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export const sanitizeMarkdown = (markdown: string): string => {
  const html = marked(markdown);
  
  return sanitizeHtml(html as string, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title'],
      a: ['href', 'name', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
};

export const validateMimeType = (mimeType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.some((allowed) => {
    if (allowed.endsWith('/*')) {
      return mimeType.startsWith(allowed.slice(0, -1));
    }
    return mimeType === allowed;
  });
};

export const DEFAULT_ALLOWED_MIME_TYPES = [
  'application/zip',
  'application/x-tar',
  'application/gzip',
  'application/x-gzip',
  'application/x-compressed',
  'application/octet-stream',
  'application/x-executable',
  'application/x-mach-binary',
  'application/vnd.debian.binary-package',
  'application/x-rpm',
  'application/x-ms-dos-executable',
];
