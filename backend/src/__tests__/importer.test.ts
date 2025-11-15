import { validateImportUrl } from '../services/importer';

describe('Importer Service', () => {
  describe('validateImportUrl', () => {
    it('should accept allowed GitHub URLs', () => {
      expect(validateImportUrl('https://github.com/user/repo')).toBe(true);
    });

    it('should accept allowed GitLab URLs', () => {
      expect(validateImportUrl('https://gitlab.com/user/repo')).toBe(true);
    });

    it('should reject localhost URLs', () => {
      expect(() => validateImportUrl('http://localhost:8080/repo')).toThrow();
    });

    it('should reject private IP addresses', () => {
      expect(() => validateImportUrl('http://192.168.1.1/repo')).toThrow();
      expect(() => validateImportUrl('http://10.0.0.1/repo')).toThrow();
      expect(() => validateImportUrl('http://172.16.0.1/repo')).toThrow();
    });

    it('should reject non-allowed hosts', () => {
      expect(() => validateImportUrl('https://evil.com/repo')).toThrow('not allowed');
    });

    it('should accept non-allowed hosts with override', () => {
      expect(validateImportUrl('https://custom-git.com/repo', true)).toBe(true);
    });
  });
});
