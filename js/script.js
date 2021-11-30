// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  query,
  orderBy,
  where,
} from "https://www.gstatic.com/firebasejs/9.5.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.5.0/firebase-storage.js";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBfFdykewNgDaAQ1RfQ7YM0dNQUjl7HoM4",
  authDomain: "fastcampus-img-site.firebaseapp.com",
  projectId: "fastcampus-img-site",
  storageBucket: "fastcampus-img-site.appspot.com",
  messagingSenderId: "87873787380",
  appId: "1:87873787380:web:eb1c41bfc84950fa2a55a1",
  measurementId: "G-G873GWGEHB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore();
const data_storage = getStorage(app);

// 메뉴 이동
setMenu = function (_menu) {
  var filterButtons = document.querySelectorAll("nav li");
  filterButtons.forEach(function (filterButton) {
    filterButton.classList.remove("on");
  });
  document.querySelector("nav li." + _menu).classList.add("on");
  document.querySelector("main").className = _menu;
};

// 정렬 방식
var sorts = {
  recent: function (a, b) {
    return a.idx > b.idx ? -1 : 1;
  },
  like: function (a, b) {
    return a.likes > b.likes ? -1 : 1;
  },
};

// 현재 선택된 정렬
var sort = sorts.recent;

// 정렬 설정 & 적용
setSort = function (_sort) {
  var sortButtons = document.querySelectorAll("#sorts li");
  sortButtons.forEach(function (sortButton) {
    sortButton.classList.remove("on");
  });
  document.querySelector("#sorts ." + _sort).classList.add("on");
  sort = sorts[_sort];
  showPhotos();
};

// 필터 방식
var filters = {
  all: function (it) {
    return true;
  },
  mine: function (it) {
    return it.user_id === my_info.id;
  },
  like: function (it) {
    return my_info.like.indexOf(it.idx) > -1;
  },
  follow: function (it) {
    return my_info.follow.indexOf(it.user_id) > -1;
  },
};

// 현재 선택된 필터
var filter = filters.all;

// 필터 설정 & 적용
setFilter = function (_filter) {
  var filterButtons = document.querySelectorAll("#filters li");
  filterButtons.forEach(function (filterButton) {
    filterButton.classList.remove("on");
  });
  document.querySelector("#filters ." + _filter).classList.add("on");
  filterName = _filter;
  loadPhotos();
};

// 사진들 새로 보여주기
function showPhotos() {
  // 현재 화면의 사진들 삭제
  var existingNodes = document.querySelectorAll(
    "#gallery article:not(.hidden)"
  );
  existingNodes.forEach(function (existingNode) {
    existingNode.remove();
  });

  // 갤러리 div 선택
  var gallery = document.querySelector("#gallery");

  // 필터 & 정렬 적용
  // var filtered = photos.filter(filter);

  var filtered = photos;
  filtered.sort(sort);

  // 필터된 사진들 화면에 나타내기
  filtered.forEach(function (photo) {
    var photoNode = document.querySelector("article.hidden").cloneNode(true);
    photoNode.classList.remove("hidden");
    photoNode.querySelector(".author").innerHTML = photo.user_name;
    photoNode.querySelector(".desc").innerHTML = photo.description;
    photoNode.querySelector(".like").innerHTML = photo.likes;
    photoNode.querySelector(".like").addEventListener("click", function () {
      toggleLike(photo.idx);
    });
    photoNode.querySelector(".photo").style.backgroundImage =
      "url('" + photo.url + "')";

    if (my_info.like.indexOf(photo.idx) > -1) {
      photoNode.querySelector(".like").classList.add("on");
    }

    if (my_info.follow.indexOf(photo.user_id) > -1) {
      var followSpan = document.createElement("span");
      followSpan.innerHTML = "FOLLOW";
      photoNode.querySelector(".author").append(followSpan);
    }

    photoNode.querySelector(".author").addEventListener("click", function () {
      toggleFollow(photo.user_id);
    });

    photoNode.addEventListener("click", function () {
      selectedPhoto = photo;
      document.querySelector("main").className = "detail";

      var detailSection = document.querySelector("#detail");
      detailSection.querySelector(".photo").style.backgroundImage =
        "url('" + photo.url + "')";
      detailSection.querySelector(".author").innerHTML = photo.user_name;
      detailSection.querySelector(".desc").innerHTML = photo.description;

      loadComments();
    });

    gallery.appendChild(photoNode);
  });
}

function toggleFollow(user_id) {
  if (my_info.follow.indexOf(user_id) === -1) {
    my_info.follow.push(user_id);
  } else {
    my_info.follow = my_info.follow.filter(function (it) {
      return it !== user_id;
    });
  }

  const myInfoCollection = doc(db, "my_info", my_info.docId);
  updateDoc(myInfoCollection, {
    follow: my_info.follow,
  }).then(function () {
    loadPhotos();
  });
}

// 사진의 좋아요 토글
function toggleLike(idx) {
  if (my_info.like.indexOf(idx) === -1) {
    my_info.like.push(idx);
    for (var i = 0; i < photos.length; i++) {
      if (photos[i].idx === idx) {
        photos[i].likes++;
        toggleLikeOnDB(photos[i]);
        break;
      }
    }
  } else {
    my_info.like = my_info.like.filter(function (it) {
      return it !== idx;
    });
    for (var i = 0; i < photos.length; i++) {
      if (photos[i].idx === idx) {
        photos[i].likes--;
        toggleLikeOnDB(photos[i]);
        break;
      }
    }
  }
  // showPhotos();
}

// 사진올리기의 사진설명 길이 표시
setDescLength = function () {
  document.querySelector(".descLength").innerHTML =
    document.querySelector("input.description").value.length + "/20";
};

updateMyInfo = function () {
  my_info.introduction = document.querySelector("#ip-intro").value;
  my_info.as = document.querySelector(
    "#myinfo input[type=radio]:checked"
  ).value;
  var interests = [];
  document
    .querySelectorAll("#myinfo input[type=checkbox]:checked")
    .forEach(function (checked) {
      interests.push(checked.value);
    });
  my_info.interest = interests;
  setEditMyInfo(false);
  // showMyInfo();
  updateMyInfoOnDB();
};

function showMyInfo() {
  document.querySelector("#myInfoId").innerHTML = my_info.id;
  document.querySelector("#myInfoUserName").innerHTML = my_info.user_name;
  document.querySelector("#sp-intro").innerHTML = my_info.introduction;
  document.querySelector("#ip-intro").value = my_info.introduction;
  document.querySelector(
    "#myinfo input[type=radio][value=" + my_info.as + "]"
  ).checked = true;
  document
    .querySelectorAll("#myinfo input[type=checkbox]")
    .forEach(function (checkbox) {
      checkbox.checked = false;
    });
  my_info.interest.forEach(function (interest) {
    document.querySelector(
      "#myinfo input[type=checkbox][value=" + interest + "]"
    ).checked = true;
  });
}

setEditMyInfo = function (on) {
  document.querySelector("#myinfo > div").className = on ? "edit" : "non-edit";
  document.querySelectorAll("#myinfo input").forEach(function (input) {
    input.disabled = !on;
  });
  // 취소했을 때 원상복구하기 위해
  showMyInfo();
};

// 화면이 처음 로드되면 실행되는 함수
init = function () {
  // showPhotos();
  // showMyInfo();
  loadMyInfo();
  loadPhotos();
};

async function loadMyInfo() {
  const querySnapshot = await getDocs(collection(db, "my_info"));
  querySnapshot.forEach((doc) => {
    my_info = doc.data();
    my_info.docId = doc.id;

    showMyInfo();
  });
}

async function updateMyInfoOnDB() {
  const firebase_myInfo = doc(db, "my_info", my_info.docId);
  await updateDoc(firebase_myInfo, {
    introduction: my_info.introduction,
    as: my_info.as,
    interest: my_info.interest,
  }).then(function () {
    loadMyInfo();
  });
}

uploadFile = function () {
  var file = document.querySelector("input[type=file]").files[0];

  const storageRef = ref(data_storage, file.name);
  console.log("참조", storageRef);

  uploadBytes(storageRef, file).then((snapshot) => {
    console.log(snapshot);
    getDownloadURL(storageRef).then((url) => uploadPhotoInfo(url));
  });
};

async function uploadPhotoInfo(url) {
  var photoInfo = {
    idx: Date.now(),
    url: url,
    user_id: my_info.id,
    user_name: my_info.user_name,
    description: document.querySelector("input.description").value,
    likes: Math.round(Math.random() * 10),
  };

  try {
    const data = await setDoc(
      doc(db, "photos", String(photoInfo.idx)),
      photoInfo
    );
    document.querySelector("input[type=file]").value = "";
    document.querySelector("input.description").value = "";
    setMenu("gallery");
    loadPhotos();

    console.log(data);
  } catch (error) {
    throw error;
  }
}

async function loadPhotos() {
  let photosArray = [];
  // const q = query(collection(db, "photos"), orderBy("likes", "desc"));

  // const q = query(
  //   collection(db, "photos"),
  //   where("user_id", "==", "사기꾼")
  // );

  const q = query(
    collection(db, "photos"),
    where(
      getFilterParams[filterName]()[0],
      getFilterParams[filterName]()[1],
      getFilterParams[filterName]()[2]
    )
  );
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc) => {
    photosArray.push(doc.data());
  });

  photos = photosArray;
  showPhotos();
}

async function toggleLikeOnDB(photo) {
  try {
    const myInfoCollection = doc(db, "my_info", my_info.docId);
    await updateDoc(myInfoCollection, {
      like: my_info.like,
    });

    const photosCollection = doc(db, "photos", String(photo.idx));
    await updateDoc(photosCollection, {
      likes: photo.likes,
    });

    loadPhotos();
  } catch (error) {
    throw error;
  }
}

filterName = "all";
getFilterParams = {
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

uploadComment = async function () {
  var comment = {
    idx: Date.now(),
    photo_idx: selectedPhoto.idx,
    user_id: my_info.id,
    user_name: my_info.user_name,
    comment: document.querySelector("#comment-input").value,
  };

  await setDoc(doc(db, "comments", String(comment.idx)), comment)
    .then(() => {
      console.log("comment uploaded");
      loadComments();
    })
    .catch((err) => console.error(err));

  document.querySelector("#comment-input").value = "";
};

async function loadComments() {
  document.querySelector("#comments").innerHTML = "";
  const q = query(
    collection(db, "comments"),
    where("photo_idx", "==", selectedPhoto.idx)
  );
  const querySnapshot = await getDocs(q);

  var comments = [];
  querySnapshot.forEach((doc) => {
    comments.push(doc.data());
  });

  comments.sort(function (a, b) {
    return a.idx > b.idx ? -1 : 1;
  });

  comments.forEach(function (comment) {
    var commentArticle = document.createElement("article");
    var commentInfoDiv = document.createElement("div");

    commentInfoDiv.className = "comment-info";
    commentInfoDiv.innerHTML = comment.user_name;

    var dateSpan = document.createElement("span");
    dateSpan.innerHTML = new Date(comment.idx);

    commentInfoDiv.appendChild(dateSpan);

    var commentContentDiv = document.createElement("div");
    commentContentDiv.innerHTML = comment.comment;

    commentArticle.append(commentInfoDiv);
    commentArticle.append(commentContentDiv);

    document.querySelector("#comments").append(commentArticle);
  });
}
