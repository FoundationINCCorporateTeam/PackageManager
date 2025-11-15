import { validateMimeType, DEFAULT_ALLOWED_MIME_TYPES } from '../utils/sanitize';

describe('Sanitize Utils', () => {
  describe('validateMimeType', () => {
    it('should accept allowed mime types', () => {
      expect(validateMimeType('application/zip', DEFAULT_ALLOWED_MIME_TYPES)).toBe(true);
      expect(validateMimeType('application/x-tar', DEFAULT_ALLOWED_MIME_TYPES)).toBe(true);
    });

    it('should reject disallowed mime types', () => {
      expect(validateMimeType('text/html', DEFAULT_ALLOWED_MIME_TYPES)).toBe(false);
      expect(validateMimeType('application/javascript', DEFAULT_ALLOWED_MIME_TYPES)).toBe(false);
    });

    it('should handle wildcard patterns', () => {
      const patterns = ['image/*', 'video/*'];
      expect(validateMimeType('image/png', patterns)).toBe(true);
      expect(validateMimeType('video/mp4', patterns)).toBe(true);
      expect(validateMimeType('application/json', patterns)).toBe(false);
    });
  });
});
