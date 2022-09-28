const version = "1.0.0.5";
const name = "Weibo Ad Block";
console.log("Weibo Ad Block: " + version);

var body = $response.body;
var url = $request.url;

function noop(items) {
  return items;
}

function promiseItems(data) {
  return new Promise((resolve, reject) => {
    if (data && data.items) {
      resolve(data.items);
    } else {
      reject("data is null");
    }
  });
}

/**
 * @description: 区分不同的 url
 */
function diffUrl() {

  // 热搜
  const hot = new RegExp("search/(finder|container_timeline)").test(url)
  // 其他人的 profile 页
  const profileTimeline = new RegExp("profile/container_timeline").test(url);
  // 我的
  const profileMe = new RegExp("profile/me").test(url);

  if (hot) {
    return rwHotItems;
  } else if (profileTimeline) {
    return rwProfile;
  } else if (profileMe) {
    return rwProfileMe;
  } else {
    return noop;
  }
}

/**
 * @description: 热搜页面
 */
function rwHotItems(items) {

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
function rwProfile(items) {
  return items.filter((item) => {
    if (!item.data) {
      return true;
    }
    // item.data.mblogtypename === '广告'
    // item.data.content_auth_info.content_auth_title === '广告' | '热推'
    // item.data.promotion.recommend === '广告' | '热推

    const { mblogtypename, content_auth_info, promotion } = item.data;
    if (mblogtypename) {
      return mblogtypename !== "广告";
    } else if (content_auth_info) {
      return (
        content_auth_info.content_auth_title !== "广告" &&
        content_auth_info.content_auth_title !== "热推"
      );
    } else if (promotion) {
      return promotion.recommend !== "广告" && promotion.recommend !== "热推";
    } else {
      return true;
    }
  });
}

/**
 * @description: 解析我的
 */
function rwProfileMe(items) {
  returns
}



if (body) {
  var data = JSON.parse($response.body);
  promiseItems(data).then((items) => {
    const rw = diffUrl();
    data.items = rw(items);
    $done({ body: JSON.stringify(data) });
  }).catch((_error) => {
    $done({ body });
  });

  // console.log("------------");

  // console.log("url: " + url);

  // if (url.includes("search")) {
  //   obj.items = parseItems(obj.items);
  //   // obj.items = parseItems(obj.items);
  // } else if (url.includes("profile")) {
  //   if (url.includes("me")) {
  //     // 我的

  //   } else if (url.includes.container_timeline) {
  //     obj.items = parseProfile(obj);
  //   }
  // }

  // $done({ body: JSON.stringify(obj) });
} else {
  $done({});
}
