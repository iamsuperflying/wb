// 读取 json 文件
const profile = require("./profile-ad.json");

function parseProfile(data) {
  if (!data) {
    return;
  }

  const items = data.items;
  if (!items) {
    return;
  }

  return items.filter((item) => {
    if (!item.data) {
      return true
    }

    const { mblogtypename, content_auth_info, promotion } = item.data;
    if (mblogtypename) {
      return mblogtypename !== "广告";
    } else if (content_auth_info) {
      return content_auth_info.content_auth_title !== "广告" && content_auth_info.content_auth_title !== "热推";
    } else if (promotion) {
      return promotion.recommend !== "广告" && promotion.recommend !== "热推";
    } else {
      return true;
    }
  });
}

const items = parseProfile(profile)
console.log(items)