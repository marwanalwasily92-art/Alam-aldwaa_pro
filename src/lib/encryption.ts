export const SALT = "pharma_world_secure_salt_2026";

/**
 * Obfuscates data before saving to localStorage.
 * Note: This is not true encryption (which requires a secure key exchange),
 * but it prevents casual snooping of the API key in the browser's DevTools.
 */
export const encryptData = (data: string): string => {
  try {
    // Encode the data with a salt and convert to Base64
    return btoa(encodeURIComponent(data + SALT));
  } catch (error) {
    console.warn("Encryption failed, falling back to raw data", error);
    return data;
  }
};

/**
 * De-obfuscates data loaded from localStorage.
 */
export const decryptData = (data: string): string => {
  try {
    // Decode from Base64 and remove the salt
    const decoded = decodeURIComponent(atob(data));
    if (decoded.endsWith(SALT)) {
      return decoded.slice(0, -SALT.length);
    }
    // If it doesn't end with the salt, it might be old unencrypted data
    return data;
  } catch (error) {
    // If atob fails, it's likely old unencrypted data
    return data;
  }
};
