const item = "https://weibo.com/6356104116/4901947448230404"
const reg = /https:\/\/weibo.com\/(\d+)\/(\d+)/;
const match = item.match(reg);
// if (match) {
//   return {
//     uid: match[0],
//     mid: match[1],
//   };
// } else {
//   return null;
// }
console.log(match)
