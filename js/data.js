var my_info;
var init;
var setMenu;
var setFilter;
var setEditMyInfo;
var updateMyInfo;
var uploadFile;
var setDescLength;
var setSort;

var filterName = "all";
var getFilterParams = {
  all: function () {
    return ["idx", ">", 0];
  },
  mine: function () {
    return ["user_id", "==", my_info.id];
  },
  like: function () {
    return ["idx", "in", my_info.like];
  },
  follow: function () {
    return ["user_id", "in", my_info.follow];
  },
};
var photos = [];
