const version = "1.0.1";
const proxy_name = "Weibo QX Launch Ad Block";
console.log(`${proxy_name}: ${version}`);

const path1 = "/gdt_mview.fcg";
const path2 = "/interface/sdk/sdkad.php";
const path3 = "/api/fortune/decisionMaker";

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
  let temp = body.match(/\{.*\}/);
  if (!temp) return body;
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
  body = JSON.stringify(obj) + "OK";
}

if (url.indexOf(path3) != -1) {
  console.log(`匹配到 ${path3}`);
  let obj = JSON.parse(body);
  if (obj.popup) obj.popup = {
    data: [],
    popup_overtime: 0,
    ad_popup_cooltime: year,
    tencent_ad_popup_button_normal: "不看详情",
    tencent_ad_popup_button_download: "千万别体验",
    vip_enable: 1,
  };
  if (obj.launch) {
    obj.launch = {
      data: [],
      cool_time: year,
      coldboot_time: year,
      vip_enable: 1,
    };
  }
  body = JSON.stringify(obj);
}

$done({ body });
