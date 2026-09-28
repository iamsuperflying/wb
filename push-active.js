// /2/push/active 下发的是全局配置；只移除明确标记的广告浮窗。
const adFloatingWindowTypes = new Set([
  "ad_launch",
  "ad",
  "ad_red_packet",
  "ad_vision_float_home",
  "ad_vision_float",
]);

const originalBody = $response.body;
let body = originalBody;

if (typeof originalBody === "string") {
  try {
    const config = JSON.parse(originalBody);
    if (config && typeof config === "object" && !Array.isArray(config)) {
      let changed = false;

      if (Array.isArray(config.floating_windows)) {
        const filtered = config.floating_windows.filter(
          (item) => !adFloatingWindowTypes.has(item?.subtype),
        );
        if (filtered.length !== config.floating_windows.length) {
          config.floating_windows = filtered;
          changed = true;
        }
      }

      if (Array.isArray(config.floating_windows_force_show)) {
        const filtered = config.floating_windows_force_show.filter(
          (item) => item !== "ad_launch",
        );
        if (filtered.length !== config.floating_windows_force_show.length) {
          config.floating_windows_force_show = filtered;
          changed = true;
        }
      }

      if (changed) body = JSON.stringify(config);
    }
  } catch (error) {
    console.log("push/active: invalid JSON (" + error.message + ")");
  }
}

$done(typeof body === "string" ? { body } : {});
