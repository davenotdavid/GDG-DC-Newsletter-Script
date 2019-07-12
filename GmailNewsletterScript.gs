// TODO: Plan which other newsletter emails to query for this script - i.e. GCP Newsletter, Firebase newsletter, Google Developers blog, and etc.

// TODO: Potential things to include for the next (August) newsletter:
// - DevFestDC recap videos/content (https://www.youtube.com/watch?v=oYQh0ZR0Lec for starters)
// - Google I/O recap videos
// - Android Summit 2019 (https://www.androidsummit.org/ ; 50% DISCOUNT courtesty of WWCODE https://www.eventbrite.com/e/android-summit-2019-tickets-59378886849?discount=wwcode50)
// - Google Cloud Next video recordings (most likely on YouTube)
// - ... and of course some other relevant content from the previous newsletter drafts

// Despite Apps Script being based on JS, classes aren't supported 
// yet (as of now) on this engine. That said, here's an anonymous 
// "class" used instead.
var Post = function(url, title, description) {
  this.url = url;
  this.title = title;
  this.description = description;

  this.logPost = function() {
    var logStr = Utilities.formatString("url: %s\ntitle: %s\ndescription: %s\n", 
                                        this.url, 
                                        this.title, 
                                        this.description
                                       );
    Logger.log(logStr);
  }
};

// The following constants ("const" modifier not included in Apps Script) 
// serve as a part of the newsletter draft template.
var jared = "jaredasheehan@gmail.com";
var chida = "schida@gmail.com";
var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
var disclaimer = "\/\*\* This draft was initially run and created by Google Apps Script \*\*\/";
var greeting = "Greetings Fellow Googlers,";
var callForTalksHeader = "Call for Talks";
var mainEventsHeader = "Main Affiliated Upcoming Events";
var otherEventsHeader = "Other Upcoming Events";
var newsMediaHeader = "News/Media";
var callForTalksBody = "What\'s first is first - if you\'re ever interested in giving a talk on a Google-related technology sometime soon, please don\'t hesitate to ask! We\'re very open about it.";
var salutation = "Best,";
var sender = "GDG-DC Organizers";
var gdgDcHandle = "@gdevdc";
var gdgDcFacebook = "GDG-DC Facebook";
var gdgDcYouTube = "GDG-DC YouTube";
var gdgDcHandleUrl = "https://twitter.com/gdevdc";
var gdgDcFacebookUrl = "https://www.facebook.com/devfestdc";
var gdgDcYouTubeUrl = "https://www.youtube.com/channel/UCtjVe7bsiUVegFYR6gOnCew";

// Android Weekly:
// Match starting from the following headers succeeding with all chars 
// and white space chars up until a double line break (the paragraph 
// spacing for this newsletter).
var artAndTutRegexAndroid = /(\*\* Articles & Tutorials[\s\S]*?)(?:\r?\n){3}/;
var newsRegexAndroid = /(\*\* News[\s\S]*?)(?:\r?\n){3}/;
var specialsRegexAndroid = /(\*\* Specials[\s\S]*?)(?:\r?\n){3}/;

// TODO: Not the prettiest regexs for the Flutter Weekly newsletter, but gets the job done for now
var announcementRegexFlutter = /\*\* Announcements[\s\S]*?\*\* Articles and tutorials/;
var artAndTutRegexFlutter = /\*\* Articles and tutorials[\s\S]*?\*\* Videos and media/;

// URL regex, and a regex for the title of a post (matches sequential
// text excluding what looks like a URL), respectively.
var urlRegex = /(http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/[^ \)]*)?/;
var titleRegex = /(?:^|\s+)((?:(?!:\/\/).)*)(?=\s|$)/;

// Two separate arrays since we wanna prioritize announcements over  
// media (i.e. articles and tutorials) within the same "News/Media" 
// header.
var announcementArray = [];
var mediaArray = [];

// Initiates all of the essential functions in order to create a draft
// template consisting of HTML-encoded, formatted news/media content: 
// 
// searchAndroidWeekly() -> searchFlutterWeekly() -> createDraft()
// 
// Basically, this whole script assumes that you're subscribed to at 
// least one of the weekly newsletters - Android and/or Flutter Weekly - 
// in order to get a compiled newsletter draft template as a result
// instead of an empty one.
function main() {
  searchAndroidWeekly();
  searchFlutterWeekly();
  
  createDraft();
}

// Debugging purposes: Logs a class' properties/functions/etc. 
// since Apps Script lacks some attributes compared to JS.
function getOwnPropertyNames() {
  Logger.log(Object.getOwnPropertyNames(String.prototype));
}

// Region Newsletter Search Queries that "locally" queries and searches the 
// runner's (of this script) inbox for news/media from weekly newsletter 
// subscriptions (Android and Flutter Weekly) for the past 30 days to 
// eventually push the Posts into their respective arrays by using Gmail 
// Service's (https://developers.google.com/apps-script/reference/gmail) 
// relevant classes and functions to retrieve a thread/message/body, and 
// complex regexes to match patterns against news/media content worth 
// considering.

// This function will basically store the top article & tutorial of each 
// Android Weekly newsletter while prioritizing and storing all of the 
// news onto the draft template.
function searchAndroidWeekly() {
  var query = "in:inbox subject:(Android Weekly) newer_than:30d";
  var threads = GmailApp.search(query);
  
  for each (thread in threads) {    
    var messages = thread.getMessages();
    var body = messages[0].getPlainBody();
    
    var containsArtAndTut = artAndTutRegexAndroid.test(body);
    if (containsArtAndTut) {
      var matches = artAndTutRegexAndroid.exec(body);
      var elements = matches[0].split("\n");
      var filteredElements = getFilteredElementsAndroid(elements);
      
      pushPostIntoMedia(filteredElements, mediaArray);
    }
    
    var containsNews = newsRegexAndroid.test(body);
    if (containsNews) {
      var matches = newsRegexAndroid.exec(body);
      var elements = matches[0].split("\n");
      var filteredElements = getFilteredElementsAndroid(elements);
      
      pushPostsIntoAnnouncements(filteredElements, announcementArray);
    }
    
    var containsSpecials = specialsRegexAndroid.test(body);
    if (containsSpecials) {
      var matches = specialsRegexAndroid.exec(body);
      var elements = matches[0].split("\n");
      var filteredElements = getFilteredElementsAndroid(elements);
      
      pushPostsIntoAnnouncements(filteredElements, announcementArray);
    }
  }
}

// If any, this function will basically store the top article & tutorial  
// while prioritizing and storing all announcements from each Flutter 
// Weekly newsletter.
function searchFlutterWeekly() {
  var query = "in:inbox subject:(Flutter Weekly) newer_than:30d";
  var threads = GmailApp.search(query);
  
  for each (thread in threads) {    
    var messages = thread.getMessages();
    var body = messages[0].getPlainBody();
    
    var containsAnnouncements = announcementRegexFlutter.test(body);
    if (containsAnnouncements) {
      var matches = announcementRegexFlutter.exec(body);
      var elements = matches[0].split("\n");
      var filteredElements = getFilteredElementsFlutter(elements);      
      
      pushPostsIntoAnnouncements(filteredElements, announcementArray);
    }
    
    var containsArtAndTut = artAndTutRegexFlutter.test(body);
    if (containsArtAndTut) {
      var matches = artAndTutRegexFlutter.exec(body);
      var elements = matches[0].split("\n");
      var filteredElements = getFilteredElementsFlutter(elements);
      
      pushPostIntoMedia(filteredElements, mediaArray);
    }
  }
}

// End Region

// Region Draft Creation

// Invoked after all of the functions (responsible for pushing 
// out the relevant Posts consisting of the relevant news/media content 
// initially retrieved from the weekly newsletters mentioned throughout 
// the script) are completed. With these Posts, this function will 
// basically encode its properties into an HTML-encoded template body 
// prior to actually creating the Gmail draft.
function createDraft() {
  var date = new Date();
  var month = "";
  if (date.getMonth() === monthNames.length - 1) { // Iterates back to January when reaching the end
    month = monthNames[0];
  } else { // Otherwise, assigns the next upcoming month
    month = monthNames[date.getMonth() + 1];
  }
  var subject = Utilities.formatString("GDG-DC %s Newsletter Draft", month);
  
  // Here's where the magic happens.
  GmailApp.createDraft(jared, subject, "Body to be replaced", {
    cc: chida,
    htmlBody: getEncodedHtml()
  });
}

function getEncodedHtml() {
  var html = '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head><body style="font-family: Verdana, sans-serif; font-size: 9pt; line-height: 1.15;">%s</body></html>';
  
  var encodedBody = Utilities.formatString("<i>%s</i><br />%s<br /><b>%s</b><br />%s<br /><b>%s</b><br /><i>// TODO: Fill out manually</i><br /><b>%s</b><br /><i>// TODO: Fill out manually</i><br /><b>%s</b><br />", 
                                    disclaimer,
                                    greeting, 
                                    callForTalksHeader, 
                                    callForTalksBody,
                                    mainEventsHeader, 
                                    otherEventsHeader, 
                                    newsMediaHeader
                                   );
  
  for each (post in announcementArray) {
    var htmlEncoding = Utilities.formatString(
      "\-<a href=%s>%s</a>: %s<br />", 
      post.url || "", 
      post.title || "", 
      post.description || ""
    );
    
    encodedBody += htmlEncoding;
  }

  for each (post in mediaArray) {
    var htmlEncoding = Utilities.formatString(
      "\-<a href=%s>%s</a>: %s<br />", 
      post.url || "", 
      post.title || "", 
      post.description || ""
    );
    
    encodedBody += htmlEncoding;
  }
  
  var salutationTxt = Utilities.formatString("%s<br />%s<br><a href=%s>%s</a><br><a href=%s>%s</a><br><a href=%s>%s</a>", 
                                             salutation, 
                                             sender, 
                                             gdgDcHandleUrl, 
                                             gdgDcHandle, 
                                             gdgDcFacebookUrl, 
                                             gdgDcFacebook, 
                                             gdgDcYouTubeUrl, 
                                             gdgDcYouTube
                                            );
  encodedBody += salutationTxt;
  
  var encodedHtml = Utilities.formatString(html, encodedBody);
  Logger.log('Encoded HTML: ' + encodedHtml);
  
  return encodedHtml;
}

// End Region

// Region Helper Functions for retrieving a filtered array of regex-splitted
// elements from a Gmail thread of the respective newsletter

function getFilteredElementsAndroid(elements) {
  var filteredElements = elements.filter(function(item) {
    var startCharRegex = /^[a-zA-Z]/;
    var startsWithChar = startCharRegex.test(item);
        
    // Just because simply String equality doesn't suffice 
    // here.
    var sponsRegex = /Sponsored/;
    var containsSponsTxt = sponsRegex.test(item);
        
    var isLegitimatePost = startsWithChar && !containsSponsTxt
    return isLegitimatePost;
  });
  
  return filteredElements;
}

function getFilteredElementsFlutter(elements) {
  var filteredElements = elements.filter(function(item) {

    // Asterisk literal is an exception here since all plain message posts 
    // are bold headers.
    var startCharRegex = /^[a-zA-Z\*]/;
    var startsWithChar = startCharRegex.test(item);
    
    // Excludes the "Announcements" header that was originally part of the 
    // regex match.
    var announcementHeadRegex = /\*\* Announcements/;
    var containsAnnouncementHead = announcementHeadRegex.test(item);    
        
    // Excludes the header that was originally part of the regex match.
    var artAndTutHeadRegex = /\*\* Articles and tutorials/;
    var containsArtAndTutHead = artAndTutHeadRegex.test(item);
        
    // Just because simply String equality doesn't suffice 
    // here.
    var sponsRegex = /Sponsored/;
    var containsSponsTxt = sponsRegex.test(item);
        
    var isLegitimatePost = startsWithChar && !containsAnnouncementHead && !containsArtAndTutHead && !containsSponsTxt
    return isLegitimatePost;
  });
  
  return filteredElements;
}

// End Region

// Region Helper Functions for pushing a top article/tutorial and every 
// announcement from a thread into the respective array, respectively

function pushPostIntoMedia(filteredElements, array) {
  var post = new Post();
  for each (element in filteredElements) {
    var containsUrl = urlRegex.test(element);
    if (containsUrl) { // Assuming it contains a title as well
      post.url = urlRegex.exec(element)[0];
      
      var containsTitle = titleRegex.test(element);
      if (containsTitle) {
        post.title = titleRegex.exec(element)[0];
      }
    } else { // Assuming it's a description instead
      post.description = element;
      
      mediaArray.push(post);
      
      break;
    }
  }
}

function pushPostsIntoAnnouncements(filteredElements, array) {
  var post = new Post();
  for each (element in filteredElements) {
    var containsUrl = urlRegex.test(element);
    if (containsUrl) { // Assuming it contains a title as well
      post.url = urlRegex.exec(element)[0];
      
      var containsTitle = titleRegex.test(element);
      if (containsTitle) {
        post.title = titleRegex.exec(element)[0];
      }
    } else { // Assuming it's a description instead
      post.description = element;
      
      announcementArray.push(post);
      
      post = new Post();
    }
  }
}

// End Region
