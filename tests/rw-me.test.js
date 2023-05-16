const data = require("../datas/profile/me.json");
/**
 * @description: 解析我的
 */
function rwProfileMe(items) {
  const filtereds = [
    "profileme_mine",
    "100505_-_top8",
    "100505_-_recentlyuser",
    "100505_-_manage",
  ];

  return items
    .filter(({ itemId }) => filtereds.includes(itemId))
    .map((item) => {
      if (item.itemId === "profileme_mine") {
        if (item.header && item.header.vipView) {
          item.header.vipView = null;
        }
      }

      if (item.itemId === "100505_-_top8") {
        const top4 = ["album", "like", "watchhistory", "draft"].map(
          (id) => `100505_-_${id}`
        );
        item.items = item.items.filter(({ itemId }) => top4.includes(itemId));

      }
      
      return item;
    });
}

const result = rwProfileMe(data.items);
console.log(result)