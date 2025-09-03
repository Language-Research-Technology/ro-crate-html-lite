/*Copyright 2025 Lean Rada.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the “Software”), to deal in the Software without restriction, including
without limitation therights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.
  THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/
if (
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1" ||
  location.hostname === "[::1]"
) {
  const interval = Number(document.currentScript?.dataset.interval || 1000);
  const debug = document.currentScript?.hasAttribute("data-debug") || false;

  let watching = new Set();
  watch(location.href);

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      watch(entry.name);
    }
  }).observe({ type: "resource", buffered: true });

  function watch(urlString) {
    if (!urlString) return;
    const url = new URL(urlString);
    if (url.origin !== location.origin) return;

    if (watching.has(url.href)) return;
    watching.add(url.href);

    if (debug) {
      console.log("[simple-live-reload] watching", url.href);
    }

    let focused = false;
    let etag, lastModified, contentLength;
    let request = { method: "head", cache: "no-store" };

    async function check() {
      try {
        if (document.hidden) return;
        if (focused) return;
      } finally {
        focused = document.hasFocus();
      }

      const res = await fetch(url, request);
      if (res.status === 405 || res.status === 501) {
        request.method = "get";
        request.headers = {
          Range: "bytes=0-0",
        };
        return check();
      }

      const newETag = res.headers.get("ETag");
      const newLastModified = res.headers.get("Last-Modified");
      const newContentLength = res.headers.get("Content-Length");

      if (
        (etag && etag !== newETag) ||
        (lastModified && lastModified !== newLastModified) ||
        (contentLength && contentLength !== newContentLength)
      ) {
        if (debug) {
          console.log("[simple-live-reload] change detected in", url.href);
        }
        try {
          location.reload();
        } catch (e) {
          location = location;
        }
      }

      etag = newETag;
      lastModified = newLastModified;
      contentLength = newContentLength;
    }

    check();
    setInterval(check, interval);
    document.addEventListener(
      "visibilitychange",
      () => !document.hidden && check()
    );
  }
}
