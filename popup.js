function appendResults(sr_arr) {
 for (i = 0; i < 5 && i < sr_arr.length; i++) {
  var div = document.createElement('section');
  div.setAttribute("id", sr_arr[i].sr_name);
  var br = document.createElement("br");
  var sr = document.createElement("sr");
  sr.innerHTML = sr_arr[i].sr_name;
//set up detail request button attributes
  var box = document.createElement("button");
  box.innerHTML = "detail";
  box.setAttribute("type","button");
  box.setAttribute("value", sr_arr[i].sr_name);
  box.setAttribute("style", "float: right;");
//set up XHR form attributes
//  var form = document.createElement("form");
//  form.setAttribute("action","www.reddit.
//  form.appendChild(box);
  div.appendChild(sr);
  div.appendChild(box);
  div.appendChild(br);
  document.body.appendChild(div);
 }
} 

function recommendSubreddit() { 
 var srNameList = localStorage.subreddit;
 if (srNameList === undefined) srNameList = 'uwaterloo'; 
 var req = new XMLHttpRequest();
 req.open("GET", "http://www.reddit.com/api/recommend/sr/" + srNameList, false);
 req.onload = function () {
  if (this.status == 200) appendResults(JSON.parse(this.responseText));
 }
 req.send();
}

document.addEventListener('DOMContentLoaded', function() {
 recommendSubreddit();
 var srList = document.getElementsByTagName("sr");
 for (i = 0; i < srList.length; i++) {
  (function () {
    var srName = srList[i].innerHTML;
    srList[i].onclick = function() {
     chrome.tabs.create({
      url: "http://www.reddit.com/r/" + srName
     });
    }
   })();
 }
 var btList = document.getElementsByTagName("button");
 for (i = 0; i < btList.length; i++) {
  (function () {
    var srName = btList[i].value;
    btList[i].onclick = function() {
     var req = new XMLHttpRequest();
     req.open("GET", "http://www.reddit.com/r/" + srName + "/about.json", false);
     req.send();
     var result = (req.status == 200) ? JSON.parse(req.responseText) : undefined;
     var detail = document.createElement("div");
     if (result != undefined) {
      var desc = document.createElement("p");
      desc.innerHTML = result.data.public_description;
      if (desc.innerHTML == "") desc.innerHTML = "**No public description**";
      var active = document.createElement("p");
      active.innerHTML = "active: " + result.data.accounts_active;
      active.setAttribute("style", "float: right;");
      detail.appendChild(desc);
      if (result.data.header_img != null) {
       var img = document.createElement("img")
       img.setAttribute("src", result.data.header_img);
       img.setAttribute("style", "float: left;");
       detail.appendChild(img);
      }
      detail.appendChild(active);
     } 
    document.getElementById(srName).appendChild(detail);
    this.disabled = true;
   }
  })();
 }
});
