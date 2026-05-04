/**
 * Simple sanitizer utilities for request data
 */
export const sanitizer = {
  /**
   * Trim whitespace from string
   */
  trim: (val: any): any => {
    if (typeof val === 'string') return val.trim();
    if (Array.isArray(val)) return val.map(sanitizer.trim);
    if (typeof val === 'object' && val !== null) {
      const result: any = {};
      for (const key in val) {
        result[key] = sanitizer.trim(val[key]);
      }
      return result;
    }
    return val;
  },

  /**
   * Lowercase string
   */
  lowercase: (val: any): any => {
    if (typeof val === 'string') return val.toLowerCase();
    return val;
  },

  /**
   * Strip HTML tags from string
   */
  stripHtml: (val: any): any => {
    if (typeof val === 'string') {
      // Simple regex to strip HTML tags
      return val.replace(/<[^>]*>?/gm, '');
    }
    return val;
  },
};
