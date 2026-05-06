export default {
  icon: '<i class="fa-solid fa-arrows-rotate fa-lg"></i>',
  name: {
    en: "Prevent Facebook feed auto-refresh",
    vi: "Chặn Facebook tự làm mới bảng tin",
  },
  description: {
    en: "Reduce Facebook News Feed reloads when switching back to the tab by keeping the page visibility state active.",
    vi: "Giảm lỗi Facebook tự tải lại bảng tin khi quay lại tab bằng cách giữ trạng thái trang luôn hoạt động.",
  },
  whiteList: ["https://*.facebook.com/*"],

  pageScript: {
    onDocumentStart: () => {
      if (window.__ufsPreventFbFeedRefreshInstalled) return;
      window.__ufsPreventFbFeedRefreshInstalled = true;

      const defineVisibilityProperty = (target, property, value) => {
        try {
          Object.defineProperty(target, property, {
            configurable: true,
            get: () => value,
          });
        } catch (error) {
          console.debug(
            `[UFS] Cannot patch ${property} for Facebook feed refresh prevention`,
            error
          );
        }
      };

      const keepPageVisible = () => {
        defineVisibilityProperty(document, "hidden", false);
        defineVisibilityProperty(document, "visibilityState", "visible");
        defineVisibilityProperty(document, "webkitHidden", false);
        defineVisibilityProperty(document, "webkitVisibilityState", "visible");
      };

      keepPageVisible();

      const blockedEvents = new Set([
        "visibilitychange",
        "webkitvisibilitychange",
        "blur",
        "focus",
        "pagehide",
        "pageshow",
      ]);

      const stopLifecycleEvent = (event) => {
        event.stopImmediatePropagation();
      };

      blockedEvents.forEach((eventName) => {
        window.addEventListener(eventName, stopLifecycleEvent, true);
        document.addEventListener(eventName, stopLifecycleEvent, true);
      });

      const patchAddEventListener = (prototype, label) => {
        const originalAddEventListener = prototype.addEventListener;
        if (!originalAddEventListener || originalAddEventListener.__ufsPatched) {
          return;
        }

        function patchedAddEventListener(type, listener, options) {
          if (blockedEvents.has(type)) {
            console.debug(
              `[UFS] Blocked Facebook ${label} listener: ${type}`
            );
            return undefined;
          }

          return originalAddEventListener.call(this, type, listener, options);
        }

        patchedAddEventListener.__ufsPatched = true;
        prototype.addEventListener = patchedAddEventListener;
      };

      patchAddEventListener(Document.prototype, "document");
      patchAddEventListener(Window.prototype, "window");
    },
  },
};
