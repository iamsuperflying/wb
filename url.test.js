// ^https://api.weibo.cn/2/(search|profile)/(finder|container_timeline|me) url script-response-body https://raw.githubusercontent.com/iamsuperflying/wb/master/index.js
// # ^https://api.weibo.cn/2/search/finder url script-response-body https://raw.githubusercontent.com/iamsuperflying/wb/master/index.js

const url = "https://api.weibo.cn/2/profile/me/dfdsf/";
const hot = new RegExp("search/(finder|container_timeline)").test(url);
const profileTimeline = new RegExp("profile/container_timeline").test(url);
const profileMe = new RegExp("profile/me").test(url);
console.log("hot: " + hot);
console.log("profileTimeline: " + profileTimeline);
console.log("profileMe: " + profileMe);
