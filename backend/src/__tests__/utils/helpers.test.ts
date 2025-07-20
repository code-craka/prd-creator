import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateSlug,
  generateShareToken,
  isValidEmail,
  maskEmail,
  getPaginationInfo,
} from '../../utils/helpers';

describe('Helper Functions', () => {
  describe('Password utilities', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify correct password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT utilities', () => {
    it('should generate valid JWT token', () => {
      const userId = 'test-user-id';
      const token = generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify valid JWT token', () => {
      const userId = 'test-user-id';
      const token = generateToken(userId);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userId);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid-token');
      }).toThrow();
    });
  });

  describe('Slug generation', () => {
    it('should generate slug from text', () => {
      const text = 'Test Team Name';
      const slug = generateSlug(text);

      expect(slug).toBe('test-team-name');
    });

    it('should handle special characters', () => {
      const text = 'Test & Team @ Name!';
      const slug = generateSlug(text);

      expect(slug).toBe('test-team-name');
    });

    it('should handle multiple spaces', () => {
      const text = 'Test    Team    Name';
      const slug = generateSlug(text);

      expect(slug).toBe('test-team-name');
    });

    it('should truncate long text', () => {
      const longText = 'a'.repeat(100);
      const slug = generateSlug(longText);

      expect(slug.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Token generation', () => {
    it('should generate share token', () => {
      const token = generateShareToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateShareToken();
      const token2 = generateShareToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('Email utilities', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('should mask email addresses', () => {
      expect(maskEmail('test@example.com')).toBe('t**t@example.com');
      expect(maskEmail('ab@example.com')).toBe('ab@example.com');
      expect(maskEmail('a@example.com')).toBe('a@example.com');
    });
  });

  describe('Pagination utilities', () => {
    it('should calculate pagination info correctly', () => {
      const result = getPaginationInfo(2, 10, 25);

      expect(result).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should handle first page', () => {
      const result = getPaginationInfo(1, 10, 25);

      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('should handle last page', () => {
      const result = getPaginationInfo(3, 10, 25);

      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it('should handle single page', () => {
      const result = getPaginationInfo(1, 10, 5);

      expect(result.pages).toBe(1);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });

    it('should handle empty results', () => {
      const result = getPaginationInfo(1, 10, 0);

      expect(result.pages).toBe(0);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });
});