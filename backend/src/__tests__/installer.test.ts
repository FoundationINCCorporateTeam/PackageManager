import { generateInstallCommand, generateMnCommand } from '../services/installer';

describe('Installer Service', () => {
  describe('generateInstallCommand', () => {
    it('should generate Linux install command', () => {
      const cmd = generateInstallCommand(
        'owner',
        'package',
        '1.0.0',
        'linux',
        'x64',
        'https://example.com/asset',
        'abc123'
      );
      expect(cmd).toContain('curl');
      expect(cmd).toContain('sh');
    });

    it('should generate Windows install command', () => {
      const cmd = generateInstallCommand(
        'owner',
        'package',
        '1.0.0',
        'windows',
        'x64',
        'https://example.com/asset',
        'abc123'
      );
      expect(cmd).toContain('iwr');
      expect(cmd).toContain('iex');
    });

    it('should generate macOS install command', () => {
      const cmd = generateInstallCommand(
        'owner',
        'package',
        '1.0.0',
        'darwin',
        'x64',
        'https://example.com/asset',
        'abc123'
      );
      expect(cmd).toContain('curl');
      expect(cmd).toContain('sh');
    });
  });

  describe('generateMnCommand', () => {
    it('should generate mn add command', () => {
      const cmd = generateMnCommand('owner', 'package', '1.0.0');
      expect(cmd).toBe('mn add owner/package@1.0.0');
    });
  });
});
