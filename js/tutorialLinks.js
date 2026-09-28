// Only direct YouTube video links. Coach PDF links can be added as tutorialUrl
// on the matching exercise in programData.js when the source PDF is available.
export function youtubeVideoUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    let id;
    if (host === "youtu.be") id = url.pathname.slice(1);
    else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else id = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})\/?$/)?.[1];
    }
    if (!/^[\w-]{11}$/.test(id || "")) return null;
    const result = new URL("https://www.youtube.com/watch");
    result.searchParams.set("v", id);
    const time = url.searchParams.get("t") || url.searchParams.get("start");
    if (time && /^(?:\d+|(?:\d+h)?(?:\d+m)?(?:\d+s)?)$/.test(time)) result.searchParams.set("t", time);
    return result.href;
  } catch { return null; }
}

export function validTutorialLinks(value) {
  return value === undefined || (value !== null && typeof value === "object" &&
    !Array.isArray(value) && Object.entries(value).every(([id, url]) =>
      /^p[12]_d[123]_[\w]+$/.test(id) && youtubeVideoUrl(url) !== null));
}
