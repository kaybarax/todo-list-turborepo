import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ariaAttr, dataAttr, mergeRefs, isFocusable } from '../a11y';

describe('a11y utilities', () => {
  describe('ariaAttr', () => {
    it('should return "true" for truthy values', () => {
      expect(ariaAttr(true)).toBe('true');
      expect(ariaAttr(1 as any)).toBe('true');
      expect(ariaAttr('test' as any)).toBe('true');
    });

    it('should return undefined for falsy values', () => {
      expect(ariaAttr(false)).toBeUndefined();
      expect(ariaAttr(null)).toBeUndefined();
      expect(ariaAttr(undefined)).toBeUndefined();
      expect(ariaAttr(0 as any)).toBeUndefined();
      expect(ariaAttr('' as any)).toBeUndefined();
    });
  });

  describe('dataAttr', () => {
    it('should return empty string for truthy values', () => {
      expect(dataAttr(true)).toBe('');
      expect(dataAttr(1 as any)).toBe('');
      expect(dataAttr('test' as any)).toBe('');
    });

    it('should return undefined for falsy values', () => {
      expect(dataAttr(false)).toBeUndefined();
      expect(dataAttr(null)).toBeUndefined();
      expect(dataAttr(undefined)).toBeUndefined();
      expect(dataAttr(0 as any)).toBeUndefined();
      expect(dataAttr('' as any)).toBeUndefined();
    });
  });

  describe('mergeRefs', () => {
    it('should handle callback refs', () => {
      const ref1 = vi.fn();
      const ref2 = vi.fn();
      const mergedRef = mergeRefs(ref1, ref2);
      const element = document.createElement('div');

      mergedRef(element);

      expect(ref1).toHaveBeenCalledWith(element);
      expect(ref2).toHaveBeenCalledWith(element);
    });

    it('should handle object refs', () => {
      const ref1: { current: HTMLDivElement | null } = { current: null };
      const ref2: { current: HTMLDivElement | null } = { current: null };
      const mergedRef = mergeRefs(ref1, ref2);
      const element = document.createElement('div');

      mergedRef(element);

      expect(ref1.current).toBe(element);
      expect(ref2.current).toBe(element);
    });

    it('should handle mixed ref types', () => {
      const callbackRef = vi.fn();
      const objectRef: { current: HTMLDivElement | null } = { current: null };
      const mergedRef = mergeRefs<HTMLDivElement>(callbackRef, objectRef);
      const element = document.createElement('div');

      mergedRef(element);

      expect(callbackRef).toHaveBeenCalledWith(element);
      expect(objectRef.current).toBe(element);
    });

    it('should handle undefined refs', () => {
      const ref1 = vi.fn();
      const mergedRef = mergeRefs(ref1, undefined, null as any);
      const element = document.createElement('div');

      expect(() => mergedRef(element)).not.toThrow();
      expect(ref1).toHaveBeenCalledWith(element);
    });

    it('should handle readonly object refs gracefully', () => {
      const readonlyRef = Object.freeze({ current: null as HTMLDivElement | null });
      const normalRef = vi.fn();
      const mergedRef = mergeRefs(readonlyRef, normalRef);
      const element = document.createElement('div');

      expect(() => mergedRef(element)).not.toThrow();
      expect(normalRef).toHaveBeenCalledWith(element);
    });
  });

  describe('isFocusable', () => {
    beforeEach(() => {
      // Mock getComputedStyle
      Object.defineProperty(window, 'getComputedStyle', {
        value: vi.fn(() => ({
          visibility: 'visible',
          display: 'block',
        })),
        writable: true,
      });
    });

    it('should return false for null element', () => {
      expect(isFocusable(null)).toBe(false);
    });

    it('should return true for focusable elements', () => {
      const button = document.createElement('button');
      expect(isFocusable(button)).toBe(true);

      const input = document.createElement('input');
      expect(isFocusable(input)).toBe(true);

      const link = document.createElement('a');
      link.href = 'https://example.com';
      expect(isFocusable(link)).toBe(true);

      const select = document.createElement('select');
      expect(isFocusable(select)).toBe(true);

      const textarea = document.createElement('textarea');
      expect(isFocusable(textarea)).toBe(true);
    });

    it('should return false for disabled elements', () => {
      const button = document.createElement('button');
      button.disabled = true;
      expect(isFocusable(button)).toBe(false);

      const input = document.createElement('input');
      input.disabled = true;
      expect(isFocusable(input)).toBe(false);
    });

    it('should return false for hidden input elements', () => {
      const input = document.createElement('input');
      input.type = 'hidden';
      expect(isFocusable(input)).toBe(false);
    });

    it('should return false for elements with disabled attribute', () => {
      const div = document.createElement('div');
      div.setAttribute('disabled', '');
      expect(isFocusable(div)).toBe(false);
    });

    it('should return false for hidden elements', () => {
      (window.getComputedStyle as any).mockReturnValue({
        visibility: 'hidden',
        display: 'block',
      });

      const button = document.createElement('button');
      expect(isFocusable(button)).toBe(false);
    });

    it('should return false for elements with display none', () => {
      (window.getComputedStyle as any).mockReturnValue({
        visibility: 'visible',
        display: 'none',
      });

      const button = document.createElement('button');
      expect(isFocusable(button)).toBe(false);
    });

    it('should return true for elements with tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');
      expect(isFocusable(div)).toBe(true);
    });

    it('should return false for non-focusable elements', () => {
      const div = document.createElement('div');
      expect(isFocusable(div)).toBe(false);

      const span = document.createElement('span');
      expect(isFocusable(span)).toBe(false);
    });
  });
});
