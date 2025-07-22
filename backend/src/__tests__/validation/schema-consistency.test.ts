import { describe, it, expect } from '@jest/globals';
import { authSchemas as backendAuthSchemas } from '../../schemas/validationSchemas';
import { authSchemas as frontendAuthSchemas } from 'prd-creator-shared';

/**
 * Validation Consistency Tests
 * 
 * These tests ensure that frontend (Zod) and backend (Joi) validation schemas
 * maintain consistent rules. Any changes to validation logic should be reflected
 * in both frontend and backend schemas.
 */

describe('Validation Schema Consistency', () => {
  describe('Auth Schemas', () => {
    describe('Login Schema', () => {
      it('should validate valid login data consistently', () => {
        const validLoginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        // Test backend validation (Joi)
        const backendResult = backendAuthSchemas.login.validate(validLoginData);
        expect(backendResult.error).toBeUndefined();

        // Test frontend validation (Zod)
        const frontendResult = frontendAuthSchemas.login.safeParse(validLoginData);
        expect(frontendResult.success).toBe(true);
      });

      it('should reject invalid email consistently', () => {
        const invalidEmailData = {
          email: 'invalid-email',
          password: 'password123'
        };

        // Test backend validation (Joi)
        const backendResult = backendAuthSchemas.login.validate(invalidEmailData);
        expect(backendResult.error).toBeDefined();
        expect(backendResult.error?.details[0].path).toContain('email');

        // Test frontend validation (Zod)
        const frontendResult = frontendAuthSchemas.login.safeParse(invalidEmailData);
        expect(frontendResult.success).toBe(false);
        if (!frontendResult.success) {
          expect(frontendResult.error.issues[0].path).toContain('email');
        }
      });

      it('should reject missing password consistently', () => {
        const missingPasswordData = {
          email: 'test@example.com'
        };

        // Test backend validation (Joi)
        const backendResult = backendAuthSchemas.login.validate(missingPasswordData);
        expect(backendResult.error).toBeDefined();

        // Test frontend validation (Zod)
        const frontendResult = frontendAuthSchemas.login.safeParse(missingPasswordData);
        expect(frontendResult.success).toBe(false);
      });
    });

    describe('Register Schema', () => {
      it('should validate valid registration data consistently', () => {
        const validRegisterData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        };

        // Test backend validation (Joi)
        const backendResult = backendAuthSchemas.register.validate(validRegisterData);
        expect(backendResult.error).toBeUndefined();

        // Test frontend validation (Zod)
        const frontendResult = frontendAuthSchemas.register.safeParse(validRegisterData);
        expect(frontendResult.success).toBe(true);
      });

      it('should reject short name consistently', () => {
        const shortNameData = {
          name: 'J',
          email: 'john@example.com',
          password: 'password123'
        };

        // Test backend validation (Joi)
        const backendResult = backendAuthSchemas.register.validate(shortNameData);
        expect(backendResult.error).toBeDefined();
        expect(backendResult.error?.details[0].path).toContain('name');

        // Test frontend validation (Zod)
        const frontendResult = frontendAuthSchemas.register.safeParse(shortNameData);
        expect(frontendResult.success).toBe(false);
        if (!frontendResult.success) {
          expect(frontendResult.error.issues[0].path).toContain('name');
        }
      });

      it('should reject short password consistently', () => {
        const shortPasswordData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: '123'
        };

        // Test backend validation (Joi)
        const backendResult = backendAuthSchemas.register.validate(shortPasswordData);
        expect(backendResult.error).toBeDefined();
        expect(backendResult.error?.details[0].path).toContain('password');

        // Test frontend validation (Zod)
        const frontendResult = frontendAuthSchemas.register.safeParse(shortPasswordData);
        expect(frontendResult.success).toBe(false);
        if (!frontendResult.success) {
          expect(frontendResult.error.issues[0].path).toContain('password');
        }
      });
    });

    describe('Register with Confirm Schema', () => {
      it('should validate matching passwords consistently', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        };

        // Frontend has registerWithConfirm schema
        const frontendResult = frontendAuthSchemas.registerWithConfirm.safeParse(validData);
        expect(frontendResult.success).toBe(true);
      });

      it('should reject non-matching passwords consistently', () => {
        const mismatchedData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'different123'
        };

        // Frontend validation
        const frontendResult = frontendAuthSchemas.registerWithConfirm.safeParse(mismatchedData);
        expect(frontendResult.success).toBe(false);
        if (!frontendResult.success) {
          expect(frontendResult.error.issues.some(issue => 
            issue.path.includes('confirmPassword')
          )).toBe(true);
        }
      });
    });
  });

  describe('Schema Completeness', () => {
    it('should have equivalent auth schemas between frontend and backend', () => {
      // Check that both have register and login schemas
      expect(backendAuthSchemas.register).toBeDefined();
      expect(backendAuthSchemas.login).toBeDefined();
      expect(frontendAuthSchemas.register).toBeDefined();
      expect(frontendAuthSchemas.login).toBeDefined();
      expect(frontendAuthSchemas.registerWithConfirm).toBeDefined();
    });
  });

  describe('Error Message Consistency', () => {
    it('should provide similar error contexts for email validation', () => {
      const invalidEmail = { email: 'not-an-email', password: 'password123' };

      const backendResult = backendAuthSchemas.login.validate(invalidEmail);
      const frontendResult = frontendAuthSchemas.login.safeParse(invalidEmail);

      expect(backendResult.error).toBeDefined();
      expect(frontendResult.success).toBe(false);
      
      // Both should identify email as the problematic field
      expect(backendResult.error?.details[0].path[0]).toBe('email');
      if (!frontendResult.success) {
        expect(frontendResult.error.issues[0].path[0]).toBe('email');
      }
    });
  });

  describe('Password Requirements Alignment', () => {
    it('should enforce same minimum password length', () => {
      const shortPassword = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '12345' // 5 characters, should fail 6 minimum
      };

      const backendResult = backendAuthSchemas.register.validate(shortPassword);
      const frontendResult = frontendAuthSchemas.register.safeParse(shortPassword);

      expect(backendResult.error).toBeDefined();
      expect(frontendResult.success).toBe(false);
    });

    it('should accept minimum valid password length', () => {
      const validPassword = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123456' // 6 characters, should pass
      };

      const backendResult = backendAuthSchemas.register.validate(validPassword);
      const frontendResult = frontendAuthSchemas.register.safeParse(validPassword);

      expect(backendResult.error).toBeUndefined();
      expect(frontendResult.success).toBe(true);
    });
  });
});
