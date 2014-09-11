// Context menu items

function onSearch(info, tab) {
 var taburl = "http://www.reddit.com/search?q=" + info.selectionText.replace(/\s/g, "+");
 chrome.tabs.create({url: taburl, selected: false});
}

function searchForSubreddit(info, tab) {
 var taburl = "http://www.reddit.com/subreddits/search?q=" + info.selectionText.replace(/\s/g, "+");
 chrome.tabs.create({url: taburl, selected: false});
}

function searchRandomPost(info, tab) {
 var req = new XMLHttpRequest();
 var searchUrl = "http://www.reddit.com/search.json?sort=top&q=" + info.selectionText.replace(/\s/g, "+");
 req.open("GET", searchUrl, false);
 req.send();
 var result;
 if (req.status == 200) result = JSON.parse(req.responseText);
 var len = result.data.children.length;
 var rand = Math.floor(Math.random() * len);
 var taburl = "http://www.reddit.com" + result.data.children[rand].data.permalink;
 chrome.tabs.create({url:taburl});
}
 
var searchReddit = chrome.contextMenus.create({
 "title": "Search on Reddit", 
 "contexts": ["selection"], 
 "onclick": onSearch
});

var searchSubreddit = chrome.contextMenus.create({
 "title": "Search for Subreddits", 
 "contexts": ["selection"], 
 "onclick": searchForSubreddit
});

var randomSearch = chrome.contextMenus.create({
 "title": "Find me..whatever",
 "contexts": ["selection"],
 "onclick": searchRandomPost
});

//Omnibox Search

var currentRequest = null;

function updateDefaultSuggestion(text) {
 if (text.trim()[0] == '#') {
  chrome.omnibox.setDefaultSuggestion({
   description: 'Search for Subreddit' + ': %s'
  });
 } else if (text.trim().substring(0,3) === "sr:") {
  chrome.omnibox.setDefaultSuggestion({
   description: "Go to Subreddit" + ": %s"
  });
 } else {
  chrome.omnibox.setDefaultSuggestion({
   description: 'Search on Reddit' + ': %s'
  });
 }
}

chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
 if (currentRequest != null) {
  currentRequest.onreadystatechange = null;
  currentRequest.abort();
  currentRequest = null;
 }
 updateDefaultSuggestion(text);
 if (text.length > 0 && text[0] != '#') {
  currentRequest = suggests(text, function(data) {
   var results = [];
   var query = text.replace(/@gg/g, '');
   var srIndex = query.trim().search("sr:");
   if (srIndex == -1) {
    for (i = 0; i < data.length; i++) {
     results.push({
      content: query.trim() + " sr:" + data[i].name,
      description: "Suggested Subreddit: " + data[i].name
     });
    }
   }  else {
    query = query.substring(0,srIndex-1);
    var desc;
    if (srIndex == 0) desc = "Go to Subreddit: ";
    else desc = "Search on Subreddit: ";
    for (i = 0; i < data.names.length; i++) {
     results.push({
      content: query.trim() + " sr:" + data.names[i],
      description: desc + data.names[i]
     });
    }
   } 
   suggest(results);
  });
 }
}); 

function resetDefaultSuggestion() {
 chrome.omnibox.setDefaultSuggestion({description: ' '});
}

resetDefaultSuggestion();
 
chrome.omnibox.onInputStarted.addListener(function() {
 updateDefaultSuggestion('');
});

chrome.omnibox.onInputCancelled.addListener(function() {
 chrome.omnibox.setDefalutSuggestion({
  description: ' '
 });
});
 
chrome.omnibox.onInputEntered.addListener(function(text) {
 var searchUrl;
 if (text.trim()[0] === '#') 
  searchUrl = "https://www.reddit.com/subreddits/search?q=" + text.substring(1);
 else { 
  var searchOnGoogle = text.match(/@gg/g);
  var srIndex = text.search("sr:");
  var searchString;
  if (searchOnGoogle === null) {
   var subreddit;
   var restrict = "";
   if (srIndex === -1) {
    subreddit = "";
    searchString = text.trim().replace(/\s/g, "+");
   } else {
    subreddit = "r/" + text.substring(srIndex+3) + '/';
    searchString = text.trim().substring(0,srIndex-1).replace(/\s/g, "+");
    restrict = "&restrict_sr=on";
   }
   if (searchString.length > 0) 
    searchUrl = "http://www.reddit.com/" + subreddit + 
                "search?q=" + searchString + restrict;
   else searchUrl = "http://www.reddit.com/" + subreddit;
  } else {
   var removeFlag = text.replace(/@gg/g, '');
   if (srIndex > -1) searchString = removeFlag.replace(/sr:/i, "site:www.reddit.com/r/");
   else searchString = removeFlag.trim() + " site:www.reddit.com";
   searchUrl = "https://www.google.com/search?q=" + searchString;
  }
 }
 chrome.tabs.update(null, {url: searchUrl});
});

function suggests(text, callback) {
 var req = new XMLHttpRequest();
 var query = text.replace(/@gg/g, '');
 var srIndex = query.search("sr:");
 if (srIndex === -1) { 
  req.open("GET", "http://www.reddit.com/api/subreddits_by_topic.json?query=" + query.trim(), true);
  req.onload = function() {
   if (this.status == 200) {
    callback(JSON.parse(this.responseText));
   }
  }
  req.send();
 }  else {
  query = query.substring(srIndex+3);
  req.open("POST", "http://www.reddit.com/api/search_reddit_names.json", true);
  req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
  req.onload = function() {
   if (this.status == 200) {
    callback(JSON.parse(this.responseText));
   }
  }
  req.send("query=" + query);
 }
}

//page action

function addToStorage(url) {
 if (url && url.search("www.reddit.com/r/") > -1) {
  var srIndex = url.search("/r/");
  var srName = url.substring(srIndex+3).split("/")[0];
  if (localStorage.subreddit === undefined) localStorage.subreddit = srName;
  else {
   srArr = localStorage.subreddit.split(',');
   if (srArr.indexOf(srName) > -1) return;
   if (srArr.length >= 2) {
    srArr.pop();
   }
   srArr.unshift(srName);
   localStorage.subreddit = srArr.join();
  }
 }
}

chrome.tabs.onCreated.addListener(function(tab) {
 addToStorage(tab.url);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
 addToStorage(tab.url);
});
