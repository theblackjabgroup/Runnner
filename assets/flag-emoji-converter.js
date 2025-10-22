/**
 * Flag Emoji Converter
 * Converts ISO country codes (e.g., "US", "GB") to Unicode flag emojis (🇺🇸, 🇬🇧)
 * Usage: Include this script and call window.convertCountryFlagsToEmojis()
 */

(function() {
  'use strict';

  /**
   * Converts a 2-letter ISO country code to a flag emoji
   * @param {string} isoCode - The 2-letter ISO country code (e.g., "US", "GB")
   * @returns {string} The flag emoji or original code if invalid
   */
  function convertISOToFlagEmoji(isoCode) {
    if (!isoCode || isoCode.length !== 2) return isoCode;
    
    const codePoints = isoCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    return String.fromCodePoint(...codePoints);
  }

  /**
   * Converts all country flag ISO codes to emojis on the page
   * Targets all elements with class 'country-flag-emoji'
   */
  function convertCountryFlagsToEmojis() {
    document.querySelectorAll('.country-flag-emoji').forEach(flagElement => {
      const isoCode = flagElement.textContent.trim();
      if (isoCode.length === 2) {
        flagElement.textContent = convertISOToFlagEmoji(isoCode);
      }
    });
  }

  // Expose to global scope for use in theme
  window.convertISOToFlagEmoji = convertISOToFlagEmoji;
  window.convertCountryFlagsToEmojis = convertCountryFlagsToEmojis;

  // Auto-convert on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', convertCountryFlagsToEmojis);
  } else {
    // DOM already loaded, convert immediately
    convertCountryFlagsToEmojis();
  }

  // Also convert when Shopify sections are loaded/reloaded
  document.addEventListener('shopify:section:load', convertCountryFlagsToEmojis);
})();

