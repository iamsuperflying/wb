const version = "1.0.1";
const proxy_name = "Weibo QX Launch Ad Block";
console.log(`${proxy_name}: ${version}`);

const path1 = "/gdt_mview.fcg";
const path2 = "/interface/sdk/sdkad.php";

const year = 60 * 60 * 24 * 365;

const url = $request.url;
let body = $response.body;

console.log(`url: ${url}`);

if (url.indexOf(path1) != -1) {
  console.log(`匹配到 ${path1}`);

  let obj = JSON.parse(body);
  if (obj.reqinterval) obj.reqinterval = year;
  if (obj.last_ads) obj.last_ads = {};
  if (obj.data) obj.data = {};
  body = JSON.stringify(obj);
}

if (url.indexOf(path2) != -1) {
  console.log(`匹配到 ${path2}`);
  /**
   {
  "needlocation": false,
  "show_push_splash_ad": false,
  "code": 200,
  "background_delay_display_time": 86400000,
  "lastAdShow_delay_display_time": 1800,
  "realtime_ad_video_stall_time": 300,
  "realtime_ad_timeout_duration": 1000,
  "client_ip": "103.192.227.197",
  "realtime_stop_conf": {
    "api_timeout": 1000,
    "request_interval": 7200
  },
  "ads": []
}
   */
  let temp = data.match(/\{.*\}/);
  if (!temp) return data;
  let obj = JSON.parse(temp);
  if (obj.ads) obj.ads = [];
  // if (data.background_delay_display_time)
  //   data.background_delay_display_time = 60 * 60 * 24 * 1000;
  if (obj.show_push_splash_ad) obj.show_push_splash_ad = false;
  if (obj.realtime_ad_video_stall_time) obj.realtime_ad_video_stall_time = 0;
  if (obj.lastAdShow_delay_display_time) obj.lastAdShow_delay_display_time = year;
  if (obj.realtime_ad_timeout_duration) obj.realtime_ad_timeout_duration = 0;
  if (obj.realtime_stop_conf)
    obj.realtime_stop_conf = {
      api_timeout: 0,
      request_interval: year,
    };
  return JSON.stringify(obj) + "OK";
}

$done({ body });