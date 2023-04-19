const version = "1.0.0.40";
const proxy_name = "Weibo Ad Block";
console.log(`${proxy_name}: ${version}`);

const path1 = "/v1/ad/preload";
const path2 = "/wbapplua/wbpullad.lua";

const url = $request.url;
let body = $response.body;

if (url.indexOf(path1) != -1) {
  let obj = JSON.parse(body);
  if (obj.realtime_video_stall_time) obj.realtime_video_stall_time = 0;
  if (obj.ads) obj.ads = [];
  if (obj.last_ad_show_interval) obj.last_ad_show_interval = 0;
  if (obj.realtime_api_timeout) obj.realtime_api_timeout = 0;
  if (obj.realtime_stop_conf) obj.realtime_stop_conf = {
    "api_timeout": 0,
    "request_interval": 60 * 60 * 24 * 365
  };

  if (obj.background_interval) obj.background_interval = 60 * 60 * 24 * 365;

  body = JSON.stringify(obj)
}

if (url.indexOf(path2) != -1) {
  let obj = JSON.parse(body);
  if (obj.cached_ad && obj.cached_ad.ads) obj.cached_ad.ads = [];
  if (obj.cached_ad && obj.cached_ad.delete_days) obj.delete_days = 0;
  body = JSON.stringify(obj);
}

$done({ body });