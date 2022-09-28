const version = "1.0.0.3";
const name = "Weibo Ad Block";
console.log("Weibo Ad Block: " + version);

var body = $response.body;
var url = $request.url;

/**
 * @description: 解析 items
 */
function parseItems(items) {
  if (!items) {
    return;
  }

  // "card_type": 118, // 118: 轮播图
  // "card_type": 19, // 19: 热聊/找人/热议/直播/本地......
  return items.filter((item) => {
    if (item.category !== "card") {
      return true;
    }

    console.log("card_type: " + item.data["card_type"]);
    const type = typeof item.data["card_type"];

    console.log("typeof card_type: " + type);

    return item.data["card_type"] !== 118 && item.data["card_type"] !== 19;
  });
}

/**
 * @description: 解析 profile 页
 */
function parseProfile(data) {
  if (!data) {
    return;
  }

  const items = data.items;
  if (!items) {
    return;
  }

  return items.filter((item) => {
    // item.data.mblogtypename === '广告'
    // item.data.content_auth_info.content_auth_title === '广告' | '热推'
    // item.data.promotion.recommend === '广告' | '热推

    console.log("mblogtypename: " + item.data["mblogtypename"]);

    return item.data["mblogtypename"] !== "广告";

    // const { mblogtypename, content_auth_info, promotion } = item.data;
    // if (mblogtypename) {
    //   return mblogtypename !== "广告";
    // } else if (content_auth_info) {
    //   return content_auth_info.content_auth_title !== "广告" && content_auth_info.content_auth_title !== "热推";
    // } else if (promotion) {
    //   return promotion.recommend !== "广告" && promotion.recommend !== "热推";
    // } else {
    //   return true;
    // }
  });
}

if (body) {
  var obj = JSON.parse($response.body);

  console.log("------------");

  console.log("url: " + url);

  if (url.includes("search")) {
    obj.items = parseItems(obj.items);
    // obj.items = parseItems(obj.items);
  } else if (url.includes("profile")) {
    obj.items = parseProfile(obj);
  }

  $done({ body: JSON.stringify(obj) });
} else {
  $done({});
}
