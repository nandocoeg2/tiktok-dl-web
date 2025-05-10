/**
 * Utility function to resolve TikTok shortened URLs
 */

// User agent for requests
const COMMON_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36';

/**
 * Resolves a TikTok URL, following redirects if it's a shortened URL
 * @param url The TikTok URL to resolve
 * @returns The resolved URL or the original URL if no redirection is needed
 */
export async function resolveTikTokUrl(url: string): Promise<string> {
  // Check if the URL is a shortened TikTok URL
  if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
    try {
      console.log(`[URL Resolver] Resolving shortened URL: ${url}`);

      // Make a HEAD request to follow redirects
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': COMMON_USER_AGENT,
        },
        redirect: 'follow',
      });

      // Get the final URL after redirects
      let finalUrl = response.url;

      if (finalUrl && finalUrl !== url) {
        // Remove query parameters from the URL
        try {
          const urlObj = new URL(finalUrl);
          // Keep only the essential parts of the URL
          finalUrl = `https://${urlObj.host}${urlObj.pathname}`;
          console.log(`[URL Resolver] Cleaned URL: ${finalUrl}`);
        } catch (parseError) {
          console.error(`[URL Resolver] Error parsing URL: ${parseError}`);
          // If URL parsing fails, just use the URL without cleaning
        }

        console.log(`[URL Resolver] Resolved to: ${finalUrl}`);
        return finalUrl;
      }

      console.log(`[URL Resolver] No redirection found, using original URL`);
      return url;
    } catch (error) {
      console.error(`[URL Resolver] Error resolving URL: ${error}`);
      // If there's an error, return the original URL
      return url;
    }
  }

  // If it's not a shortened URL, clean it anyway to remove query parameters
  try {
    const urlObj = new URL(url);
    const cleanUrl = `https://${urlObj.host}${urlObj.pathname}`;
    console.log(`[URL Resolver] Cleaned regular URL: ${cleanUrl}`);
    return cleanUrl;
  } catch (parseError) {
    console.error(`[URL Resolver] Error parsing regular URL: ${parseError}`);
    return url;
  }
}

/**
 * Validates if a string is a valid TikTok URL
 * @param url The URL to validate
 * @returns True if the URL is a valid TikTok URL
 */
export function isValidTikTokUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check if it's a TikTok URL
  if (!url.includes('tiktok.com')) {
    return false;
  }

  // Check if it's a valid TikTok URL format
  return (
    url.includes('tiktok.com/@') || // Regular user video
    url.includes('tiktok.com/t/') || // Shortened t format
    url.includes('vt.tiktok.com/') || // Shortened vt format
    url.includes('vm.tiktok.com/') // Shortened vm format
  );
}
