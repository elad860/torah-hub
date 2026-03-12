/**
 * Converts sharing links (Google Drive, Dropbox) into direct streaming URLs.
 * Returns the original URL if no conversion is needed.
 */
export function toDirectAudioUrl(url: string): string {
  if (!url) return url;

  // Google Drive: drive.google.com/file/d/ID/view  →  drive.google.com/uc?export=download&id=ID
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (gdriveMatch) {
    return `https://drive.google.com/uc?export=download&id=${gdriveMatch[1]}`;
  }

  // Google Drive: drive.google.com/open?id=ID
  const gdriveOpen = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (gdriveOpen) {
    return `https://drive.google.com/uc?export=download&id=${gdriveOpen[1]}`;
  }

  // Dropbox: www.dropbox.com/...?dl=0  →  ?dl=1
  if (url.includes("dropbox.com")) {
    return url.replace(/[?&]dl=0/, "?dl=1").replace(/[?&]dl=0/, "");
  }

  return url;
}

/**
 * Validates whether a URL looks like it could be an audio source.
 */
export function isLikelyAudioUrl(url: string): boolean {
  if (!url) return false;
  // After conversion, any URL is potentially valid (we can't know without fetching)
  // But flag obviously bad ones
  if (url.startsWith("http://") || url.startsWith("https://")) return true;
  return false;
}
