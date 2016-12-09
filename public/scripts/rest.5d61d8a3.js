"use strict";angular.module("rest",[]).config(["$httpProvider",function(a){a.interceptors.push("AuthInterceptor")}]).run(["$rootScope","REST_EVENTS","AuthService",function(a,b,c){a.$on(b.AUTHENTICATE_PASSWORD,function(a,b,d,e){c.loginWithPassword(b,d,e)}),a.$on(b.AUTHENTICATE_CLIENT_SECRET,function(){c.loginWithClientCredentials()}),a.$on(b.LOGOUT,function(){c.logout()}),window.hasOwnProperty("TEST_MODE")&&window.TEST_MODE||c.initializeRefresh()}]).config(["$provide",function(a){a.decorator("$q",["$delegate",function(a){var b=a.defer;return a.defer=function(){var a=b();return a.promise.success=function(b){return a.promise.then(_.ary(b,1)),a.promise},a.promise.error=function(b){return a.promise.then(null,_.ary(b,1)),a.promise},a},a}])}]),function(){angular.module("rest").constant("LOG_AUTH_DATA",!1).constant("INTELLOGO_API_LOCATION","https://production.intellogo.com").provider("API_LOCATION",function(){this.$get=["INTELLOGO_API_LOCATION","$log",function(a,b){return b.warn("API_LOCATION is deprecated. Use ServiceUtils for URL construction instead"),a}]})}(),angular.module("rest").constant("REST_EVENTS",{AUTHENTICATE_PASSWORD:"event:authenticatePassword",AUTHENTICATE_CLIENT_SECRET:"event:authenticateClientSecret",AUTHENTICATION_FAILURE:"event:authenticationFailure",AUTHENTICATION_SUCCESS:"event:authenticationSuccess",LOGOUT:"event:logout",SMART_FOLDER_ADDED:"event:smartFolderAdded",SMART_FOLDER_UPDATED:"event:smartFolderUpdated",CATEGORY_UPDATED:"event:categoryUpdated"}),angular.module("rest").factory("AuthService",["$rootScope","$http","$window","$timeout","$injector","TokenHandler","API_LOCATION","LOG_AUTH_DATA","REST_EVENTS",function(a,b,c,d,e,f,g,h,i){function j(){return e.get("OAUTH_CLIENT_ID")}function k(){return e.get("OAUTH_CLIENT_SECRET")}function l(b,c){h&&console.log("recv ",b),f.setToken(b.access_token),f.setRefreshToken(b.refresh_token);var d=b.expires_in,e=(new Date).getTime()+1e3*d;f.setTokenExpiration(e),s(),c&&a.$broadcast(i.AUTHENTICATION_SUCCESS)}function m(a){var d=c.$.param(a);return b.post(g+"/oauth/revoke",d,{headers:{"Content-Type":"application/x-www-form-urlencoded"}})}function n(a){h&&console.log("send",a);var d=c.$.param(a);return b.post(g+"/oauth/token",d,{headers:{"Content-Type":"application/x-www-form-urlencoded"}})}function o(){function b(a){console.error(a),alert("Your session has expired ! Please reload the page")}var c=f.getRefreshToken();if(!c)return console.log("No refresh token available."),void a.$broadcast(i.LOGOUT);var d={grant_type:"refresh_token",client_id:j(),client_secret:k(),refresh_token:c};n(d).success(function(a,c){c<200||c>299?b("Could not get a refresh token. Probably there is a communication problem with the server?"):l(a)}).error(b)}function p(b,c,d){function e(b,c,d){a.$broadcast(i.AUTHENTICATION_FAILURE,b,c,d)}var f={username:b,password:c,grant_type:"password",client_id:j(),client_secret:k()};d&&(f.forceLogin=d),n(f).error(function(a,b){e(a,b,f)}).success(function(a,b){b<200||b>299?e("Could not log you in. Probably there is a communication problem with the server?"):l(a,!0)})}function q(){function b(b){a.$broadcast(i.AUTHENTICATION_FAILURE,b)}var c={grant_type:"client_credentials",client_id:j(),client_secret:k()};n(c).error(b).success(function(a,c){c<200||c>299?b("Could not log you in. Probably there is a communication problem with the server?"):l(a,!0)})}function r(){var a={tokenToRevoke:f.getToken()};f.resetTokens();var b="Logout unsuccessful !";m(a).error(_.partial(alert,b)).success(function(a,c){(c<200||c>299)&&console.error(b)})}function s(){var b=30,c=(new Date).getTime(),e=f.getTokenExpiration(),g=e-1e3*b;if(f.getToken()){if(u&&d.cancel(u),!e||c>=g)return console.log("Access token expired."),void a.$broadcast(i.LOGOUT);console.log("Token valid until "+new Date(e)+". Will refresh it at "+new Date(g));var h=g-c;u=d(function(){console.log("Initiating token renewal. "+new Date),o()},h)}}function t(){return f.getTokenExpiration()>(new Date).getTime()}var u;return{loginWithPassword:p,loginWithClientCredentials:q,logout:r,initializeRefresh:s,refresh:o,isLoggedIn:t}}]),angular.module("rest").factory("CaptionsService",["$http","API_LOCATION",function(a,b){function c(){return a.get(b+"/api/captions/channels")}function d(c){var d={source:"Youtube",channelId:c.id};return a.post(b+"/api/contents/delete",{metadataFilter:d})}return{deleteChannel:d,getAllChannels:c}}]),angular.module("rest").factory("CategoryService",["$http","$rootScope","API_LOCATION","REST_EVENTS","ServiceUtils",function(a,b,c,d,e){function f(b){b=b||{};var c={};b.search&&(c.search=b.search),b.statusFilter&&(c.status=JSON.stringify(b.statusFilter));var d=a.get(e.constructServiceUrl("categories","all",e.constructQueryParameters(c)));return d}function g(b){_.isArray(b)||(b=[b]);var c=e.constructServiceUrl("categories","info");return a.post(c,b)}function h(){return a.get(c+"/api/categories/count")}function i(){return a.get(c+"/api/categories/restrictions")}function j(a){return _.map(a,function(a){return{categoryId:a.categoryId,samples:a.samples||[],testSamples:a.testSamples||[]}})}function k(b){return _.isArray(b)||(b=[b]),a.post(c+"/api/categories/assign",j(b))}function l(b){return _.isArray(b)||(b=[b]),a.post(c+"/api/categories/unassign",j(b))}function m(b){_.isArray(b)||(b=[b]);var d=_.map(b,function(a){return{name:a}});return a.post(c+"/api/categories/create",d)}function n(e){_.isArray(e)||(e=[e]);var f=a.post(c+"/api/categories/update",e);return f.success(function(){b.$broadcast(d.CATEGORY_UPDATED)}),f}function o(b){return _.isArray(b)||(b=[b]),b=_.pluck(b,"categoryId"),a.post(c+"/api/categories/delete",b)}function p(b,d){var f={id:b};return angular.isDefined(d)&&(f.count=d),a.get(c+"/api/categories/contentImages"+e.constructQueryParameters(f))}function q(b,d){return a.post(c+"/api/categories/contents",[{categoryId:b,metadata:!0,collectionName:d}])}function r(b,c){return c=c?c:{},a.post(e.constructServiceUrl("categories","dynamic"),{searchTerm:b,displayName:c.displayName,description:c.description,numResults:c.numResults})}function s(b){return _.isArray(b)||(b=[b]),a.post(c+"/api/categories/invalidate",b)}function t(a,b,c){function d(a){return!a.categoryId}function e(a){a=_.clone(a),delete a.categoryId;var b=!_.find(p,a)&&(a.newContents&&a.newContents.length||a.dirtySamples&&a.dirtySamples.length||a.removedSamples&&a.removedSamples.length);return!!b}function f(a){return{contentId:a._id||a.contentId,positive:a.positive}}function g(a){if(p.length>0){var b=_.pluck(p,"name");m(b).success(function(b){_.each(b,function(a,b){p[b].categoryId=a._id}),a()})}else a()}function h(b){var c=_.filter(a,function(a){return a.newContents&&a.newContents.length||a.newTestContents&&a.newTestContents.length}),d=_.map(c,function(a){var b=_.map(a.newContents,f),c=_.map(a.newTestContents,f);return{categoryId:a.categoryId,samples:b,testSamples:c,invalidate:e(a)}});return d.length?void k(d).success(function(){b()}):void b()}function i(b){var c=_.filter(a,function(a){return a.dirtySamples&&a.dirtySamples.length||a.dirtyTestSamples&&a.dirtyTestSamples.length}),d=_.map(c,function(a){var b=_.map(a.dirtySamples,f),c=_.map(a.dirtyTestSamples,f);return{categoryId:a.categoryId,samples:b,testSamples:c,invalidate:e(a)}});return d.length?void k(d).success(function(){b()}):void b()}function j(b){var c=_.filter(a,function(a){return a.removedSamples&&a.removedSamples.length||a.removedTestSamples&&a.removedTestSamples.length}),d=_.map(c,function(a){var b=_.map(a.removedSamples,f),c=_.map(a.removedTestSamples,f);return{categoryId:a.categoryId,samples:b,testSamples:c,invalidate:e(a)}});return d.length?void l(d).success(function(){b()}):void b()}function o(c){var d=["name","description","autoupdate","displayName","productionReady","locked","useTSVD","tags","keywords","userTrained"],e=_(a).filter(function(a){var c=b[a.categoryId],d=p.indexOf(a)>=0,e=!_.isEqual(a,c);return e||d}).map(function(a){function c(a,b){return _.isEqual(e&&e[b],a)}var e=b[a.categoryId],f=_(a).pick(d).omit(c).value();return _.isEmpty(f)?null:(f.categoryId=a.categoryId,f)}).compact().value();return e.length?void async.each(e,function(a,b){n(a).success(function(){b(null)}).error(function(a){b(a||"Error")})},c):void c()}a||c(new Error("Categories not selected")),_.isArray(a)||(a=[a]);var p=_.filter(a,d);async.series([g,o,h,i,j],_.partial(c,_,p))}return{addNewCategories:m,associateContentsWithCategory:k,deAssociateContentsWithCategory:l,getAllCategories:f,getCategoriesMetadata:g,getCategoryImages:p,getCategoriesCount:h,getCategoriesRestrictions:i,getDynamicCategories:r,expandContentsInCategory:q,removeCategories:o,removeContentsFromCategory:l,saveCategoryChanges:n,saveCategoryDataChanges:t,invalidateCategories:s}}]),angular.module("rest").factory("ContentService",["$http","API_LOCATION","ServiceUtils",function(a,b,c){function d(d,e,f){function g(){var a=f.search;a&&(l.search=a)}function h(){var a=f.source;a&&(l.source=a)}function i(){f.channelId&&f.channelId.length&&(l.metadataFilter||(l.metadataFilter={}),l.metadataFilter.channelId=f.channelId)}function j(){f.acquisitionDate&&(l.metadataFilter||(l.metadataFilter={}),l.metadataFilter.acquisitionDate=f.acquisitionDate)}f=f||{};var k=b+"/api/contents/all",l={from:d,to:e};return g(),h(),i(),j(),k+=c.constructQueryParameters(l),a.get(k)}function e(b,d){return a.post(c.constructServiceUrl("contents/users","update"),{contentId:b,userIds:d})}function f(c){return a.post(b+"/api/contents/contentsBySourceId",{sourceId:c})}function g(c){var d=_.map(c,function(a){return{contentId:a}});return a.post(b+"/api/contents/metadata/all",d)}function h(c){_.isArray(c)||(c=[c]);var d=_.map(c,function(a){return{contentId:a._id}});return a.post(b+"/api/contents/delete",d)}function i(b){var d={contentId:b._id};return a.post(c.constructServiceUrl("contents","deleteTree"),d)}function j(){return a.get(b+"/api/contents/sources")}function k(){return a.get(b+"/api/contents/restrictions")}function l(){return a.get(b+"/api/contents/count")}function m(c){return a.post(b+"/api/contents/importArticles",c)}function n(c,d,e){return a.post(b+"/api/contents/initiateChannelImportTask",{channel:c,autoSub:d,refreshAll:e})}function o(c){return a.get(b+"/api/contents/taskStatus",{params:{taskId:c}})}function p(c){return a.get(b+"/api/contents/statusWithPayload",{params:{timeInterval:c}})}function q(d,e,f){var g={from:d,to:e};return f.search&&(g.search=f.search),f.source&&(g.source=f.source),a.get(b+"/api/contents/topLevel"+c.constructQueryParameters(g))}function r(d){var e={contentId:d};return a.get(b+"/api/contents/tree"+c.constructQueryParameters(e))}function s(c,d){var e={contentId:c,metadata:d};return a.post(b+"/api/contents/tree/metadata",e)}function t(){return b+"/api/contents/importEpub"}function u(){return c.constructServiceUrl("contents","importArticlesXls")}function v(b,d){return a.post(c.constructServiceUrl("contents","ingestedBySource"),{from:Math.floor(d.from/1e3),to:Math.floor(d.to/1e3),sources:b})}function w(b,d){return a.post(c.constructServiceUrl("contents","blacklistedBySource"),{from:Math.floor(d.from/1e3),to:Math.floor(d.to/1e3),sources:b})}return{getAllContentSources:j,getAllContentsInCategories:d,getAllTopLevelContents:q,getContentDescendants:r,getContentsByIds:g,getContentsBySourceId:f,getContentsCount:l,getIngestedContentBySources:v,getBlacklistedContentBySources:w,getContentsRestrictions:k,getEpubImportEndpoint:t,getImportArticlesEndpoint:u,getStatusWithPayload:p,getTaskStatus:o,importArticles:m,importCaptions:n,removeContentTree:i,removeContents:h,updateContentTreeMetadata:s,updateContentUsers:e}}]),angular.module("rest").factory("FeedSourcesService",["$http","API_LOCATION",function(a,b){function c(a){return b+"/api/feedSources/"+a}function d(){return a.get(c(""))}function e(b){return a.post(c("add"),b)}function f(b){return a.post(c("update"),b)}function g(b){return a["delete"](c(b))}function h(b){return a.post(c("collect"),{url:b})}return{getSources:d,addSource:e,updateSource:f,removeSource:g,collectFeeds:h}}]),angular.module("rest").service("FileDownloadDialogService",["UrlUtils","$window",function(a,b){function c(c){b.open(a.addAccessTokenToUrl(c))}return{downloadFileInNewWindow:c}}]),angular.module("rest").factory("AuthInterceptor",["UrlUtils","$location","$q","TokenHandler",function(a,b,c,d){return{request:function(b){function c(a){return 0!==a.indexOf("views/")&&a.indexOf(".html")<=0&&a.indexOf(".svg")<=0}return c(b.url)&&(b.url=a.addAccessTokenToUrl(b.url)),b},responseError:function(a){return 401===a.status&&(console.log("Unauthorized, redirecting to login page."),d.resetTokens(),b.path("/login")),c.reject(a)}}}]),angular.module("rest").factory("LiveConfigService",["$http","API_LOCATION",function(a,b){function c(){return a.get(b+"/api/admin/config")}function d(c){return a.post(b+"/api/admin/config",c)}function e(){return a.post(b+"/api/admin/config/restoreDefaults")}return{getConfig:c,saveConfig:d,restoreDefaults:e}}]),angular.module("rest").factory("LocalStorageBackedVariable",function(){function a(){var a;return{getValue:function(){return a},setValue:function(b){a=b}}}function b(a){return void 0!==a?JSON.stringify(a):""}function c(a){if(a&&""!==a){var b;try{b=JSON.parse(a)}catch(c){b=a}return b}}function d(a){var d=localStorage.getItem(a);return d=c(d),{getValue:function(){return d},setValue:function(c){var e=b(c);b(d)!==e&&localStorage.setItem(a,e),d=c}}}function e(){return window.hasOwnProperty("TEST_MODE")&&window.TEST_MODE}return{createHolder:function(){return e()?a.apply(this,arguments):d.apply(this,arguments)}}}),angular.module("rest").factory("RatingService",["$http","ServiceUtils","FileDownloadDialogService",function(a,b,c){function d(a){return b.constructServiceUrl("rating",a)}function e(c,e){if(_.isArray(c))throw new Error("Only one category is supported.");var f={categoryId:c,"content.source":e.source,"content.sourceGroup":e.sourceGroups,"content.acquisitionDate":e.date,runId:e.runId,from:e.from,to:e.to};e.channelId&&e.channelId.length&&(f["content.channelId"]=e.channelId);var g=d("categoryBest")+b.constructQueryParameters(f);return a.get(g)}function f(a,e){if(_.isArray(a))throw new Error("Only one category is supported.");var f={categoryId:a};e&&(f.source=e);var g=d("categoryBestCSV")+b.constructQueryParameters(f);c.downloadFileInNewWindow(g)}function g(b){_.isArray(b)||(b=[b]);var c=_.map(b,function(a){return{ratingId:a._id}});return a.post(d("delete"),c)}function h(a){var b=a.value||[0,100],c=b[0],d=b[1],e={min:c,max:d};return a.categoryId?e.categoryId=a.categoryId:a.contentId?e.contentId=a.contentId:e={error:"Item doesn't contain any id!"},e}function i(c,d,e,f,g,h){var i=k(c,d,e,f,g,h),j=b.constructServiceUrl("smartFolders","ratings",b.constructQueryParameters(i));return a.get(j)}function j(a,d,e,f,g,h){var i=k(a,d,e,f,g,h),j=b.constructServiceUrl("smartFolders","ratingsCSV",b.constructQueryParameters(i));c.downloadFileInNewWindow(j)}function k(a,b,c,d,e,f){var g,i=d&&d.recommendationSources,j=d&&d.acquisitionDate,k=d&&d.channelId,l=a._id;if(b)g={smartFolderId:l,cacheType:c};else{var m=_.map(a.items,h);g={smartFolderItem:m}}return g.useCache=b,i&&(g["metadataFilter.source"]=i),j&&(g["metadataFilter.acquisitionDate"]=j),_.isArray(k)&&k.length&&(g["metadataFilter.channelId"]=k),g.from=e,g.to=f,g}function l(c,d,e,f){var g=k(c,d,e,f),h=b.constructServiceUrl("smartFolders","ratingsCount",b.constructQueryParameters(g));return a.get(h)}function m(c){var d=k(c),e=b.constructServiceUrl("smartFolders","ratingsCountIndividual",b.constructQueryParameters(d));return a.get(e)}function n(c,e,f,g,h){var i={contentId:c};angular.isDefined(e)&&null!==e&&(i.productionReady=e),angular.isNumber(f)&&(i.from=f),angular.isNumber(g)&&(i.to=g),angular.isNumber(h)&&(i.minScore=h);var j=d("contentCategoryRatings")+b.constructQueryParameters(i),k=a.get(j).success(function(a){_.each(a,function(a){a.category&&(a.tags=a.category.tags)})});return k}function o(c,d,e,f){var g={profileId:c,contentIds:d,productionReady:f,minScore:e},h=b.constructServiceUrl("rating","contentsCategoryRatingsMap"),i=a.post(h,g);return i}function p(b){var c=d("contentBest"),e={contentId:b.contentId};return(b.recommendationsSource||b.acquisitonDate)&&(e.contentsToRate={}),b.recommendationsSource&&(e.contentsToRate.source=b.recommendationsSource,_.isArray(b.channelId)&&b.channelId.length&&(e.contentsToRate.channelId=b.channelId)),b.acquisitonDate&&(e.contentsToRate.acquisitionDate=b.acquisitionDate),b.includeLastRated&&(e.includeLastRated=b.includeLastRated),b.itemsToRate&&(e.itemsToRate=b.itemsToRate),b.from>=0&&b.to>=0&&(e.from=b.from,e.to=b.to),a.post(c,e)}function q(c){var e=d("contentBest"),f={};return c.contentId&&(f.contentId=c.contentId),c.from>=0&&c.to>=0&&(f.from=c.from,f.to=c.to),c.recommendationsSource&&(f["contentsToRate.source"]=c.recommendationsSource),c.recommendationsSourceGroup&&(f["contentsToRate.sourceGroup"]=c.recommendationsSourceGroup),_.isArray(c.channelId)&&c.channelId.length&&(f["contentsToRate.channelId"]=c.channelId),c.recommendationsAcquisitionDate&&(f["contentsToRate.acquisitionDate"]=c.recommendationsAcquisitionDate),c.itemsToRate&&(f.itemsToRate=c.itemsToRate),c.includeLastRated&&(f.includeLastRated=c.includeLastRated),a.get(e+b.constructQueryParameters(f))}function r(c){var e=d("contentBest"),f={contentId:c};return a["delete"](e+b.constructQueryParameters(f))}function s(){var b=d("removeAllContentBest");return a.post(b)}function t(b,c){var e=d("categoryToContent"),f={contentIds:b,categoryIds:c};return a.post(e,f)}return{countRatingsForSmartFolder:l,countIndividualRatingsForSmartFolder:m,getCategoryRatingsForContent:n,getCategoryRatingMapForContents:o,getContentRatingsForContent:q,getContentRatingsForContentInitiateTraining:p,getRatings:e,getRatingsAsCSV:f,getRatingsForSmartFolder:i,getRatingsForSmartFolderCSV:j,removeContentRatingsForContent:r,removeAllContentToContentRatings:s,removeRatings:g,getContentRatingsInCategories:t}}]),angular.module("rest").service("ReadingProfilesService",["$http","RatingService","ServiceUtils","API_LOCATION",function(a,b,c,d){function e(a,b){function c(a){f(a).success(function(c){a._id?i(a._id).success(function(a){j.categoryId=a.categoryId,b(null,j)}):(_.isArray(c)&&c[0]&&(c=c[0],j._id=c),b(null,j))}).error(b)}var d=_.pluck(a.assignedContents,"_id"),e=_.pluck(a.unassignedContents,"_id"),g=d.length>0||e.length>0,h=a.originalName!==a.name,j=_.clone(a);if(j.assignedContents=[],j.unassignedContents=[],j.originalName=j.name,a._id&&!g&&!h)return void b(null,a);var k={_id:a._id,name:a.name,contentIdsToAssign:d.length>0?d:[],contentIdsToUnassign:e.length>0?e:[]};c(k)}function f(a){if(a._id)return j(a);var b={name:a.name,contents:a.contentIdsToAssign};return h(b)}function g(b){return _.isArray(b)||(b=[b]),a.post(d+"/api/profiles/remove",b)}function h(b){return a.post(d+"/api/profiles/add",[b])}function i(b){var d=c.constructServiceUrl("profiles","contentsCount")+c.constructQueryParameters({profileId:b});return a.get(d)}function j(b){var c={profileId:b._id,profileData:{name:b.name,contentIdsToUnassign:b.contentIdsToUnassign,contentIdsToAssign:b.contentIdsToAssign}};return a.post(d+"/api/profiles/update",c)}function k(){return a.get(d+"/api/profiles/all")}function l(b,d,e,f){var g={profileId:b,metadata:d,from:e,to:f},h=c.constructServiceUrl("profiles","contents")+c.constructQueryParameters(g);return a.get(h)}function m(a,c,d){var e,f;return a._id?e=a._id:f=_.pluck(a.contents,"_id"),b.getCategoryRatingMapForContents(e,f,c,d)}function n(b,d){d=_.clone(d,!0),b._id?d.profileId=b._id:d.contentIds=_.pluck(b.contents,"_id");var e=c.constructServiceUrl("profiles","categoryCombinations");return a.post(e,d)}function o(b){var d={profileId:b._id},e=c.constructServiceUrl("profiles","contentsCount")+c.constructQueryParameters(d);return a.get(e)}return{saveProfileWithCategory:e,loadProfiles:k,loadProfileContents:l,getProfileContentsCount:o,analyzeProfile:m,removeProfiles:g,categoryCombinations:n}}]),angular.module("rest").factory("RunService",["$http","API_LOCATION","ServiceUtils",function(a,b,c){function d(){return a.get(b+"/api/runs")}function e(c){return a["delete"](b+"/api/runs/"+c)}function f(d){return a.get(b+"/api/runs"+c.constructQueryParameters({categoryId:d}))}function g(){return a.get(b+"/api/runs/categoriesWithFinishedRuns")}return{getAllCategoriesWithFinishedRuns:g,getAllRuns:d,getRunsForCategory:f,removeRun:e}}]),angular.module("rest").factory("ServiceUtils",["INTELLOGO_API_LOCATION",function(a){function b(a,b){return _.chain(b).map(function(b,e){var f;return f=_.isObject(b)?c(a,b):d(a,b),(0===e?"":"&")+f}).reduce(function(a,b){return a+b}).value()}function c(a,b){return encodeURIComponent(a)+"="+encodeURIComponent(JSON.stringify(b))}function d(a,b){return encodeURIComponent(a)+"="+encodeURIComponent(b)}function e(a,e,f){var g;return g=_.isArray(e)?b(a,e):_.isObject(e)?c(a,e):d(a,e),(f?"?":"&")+g}function f(a){return _.chain(a).pairs().filter(function(a){var b=a[1],c=0===b||!!b,d=_.isArray(b)&&!b.length;return c&&!d}).map(function(a,b){return e.call(this,a[0],a[1],0===b)}).reduce(function(a,b){return a+b},"").value()}function g(b){var c=a,d="/"===c[c.length-1]?c:c+"/",e="/"===b[0]?b.slice(1):b;return d+"api/"+e}function h(a,b,c){var d;return d=b?a+"/"+b:a,g(d)+(c||"")}return{constructQueryParameters:f,constructServiceUrlByPath:g,constructServiceUrl:h}}]),angular.module("rest").factory("SmartFoldersService",["$q","$http","$rootScope","API_LOCATION","REST_EVENTS",function(a,b,c,d,e){function f(b,c){if(c){var d=a.defer();return d.reject(),d.promise}return a.when(b)}function g(a){return d+"/api/smartFolders/"+a}function h(a){function b(a){var b={min:a.value[0],max:a.value[1]};return a.categoryId?b.categoryId=a.categoryId:a.contentId?b.contentId=a.contentId:console.error("No id for the item specified!"),b}return _.map(a,function(a){var c={_id:a._id};return a.metadata&&(c.metadata=_.clone(a.metadata)),_.isArray(a.items)&&(c.items=_.map(a.items,b)),c})}function i(a){var c=d+"/api/smartFolders";return b.get(c,{params:{categoryId:a}})}function j(a){var c=d+"/api/smartFolders/image/"+a;return b.get(c)}function k(a){return b["delete"](g(a))}function l(a){var d;return a?(Array.isArray(a)||(a=[a]),a=h(a),d=b.post(g("update"),a),d.success(function(){c.$broadcast(e.SMART_FOLDER_UPDATED)})):d=f(null,"No smart folders given."),d}function m(a){Array.isArray(a)||(a=[a]),a=h(a);var d=b.post(g("create"),a);return d.success(function(){c.$broadcast(e.SMART_FOLDER_ADDED)}),d}return{getAllSmartFolders:i,deleteSmartFolder:k,updateSmartFolders:l,addSmartFolder:m,getSmartFolderImage:j}}]),angular.module("rest").factory("TokenHandler",["LocalStorageBackedVariable",function(a){var b=a.createHolder("token"),c=a.createHolder("refresh_token"),d=a.createHolder("expiration");return{setToken:b.setValue,setTokenExpiration:d.setValue,getTokenExpiration:d.getValue,setRefreshToken:c.setValue,getToken:b.getValue,getRefreshToken:c.getValue,resetTokens:function(){b.setValue(null),c.setValue(null),d.setValue(0)}}}]),angular.module("rest").factory("TrainingService",["$http","ServiceUtils",function(a,b){function c(c,d,e){var f={categoryId:c};return d&&(_.isArray(d)||(d=[d]),f.contentSource=d),e&&(f.combinations=e),a.post(b.constructServiceUrl("trainings","initiate"),f)}function d(c,d,e){var f={timeInterval:c,includeTaskResults:!!e};return _.isArray(d)&&d.length>0&&(f.taskTypes=d),a.get(b.constructServiceUrl("trainings","status"),{params:f})}function e(c){return a.get(b.constructServiceUrl("trainings","taskStatus"),{params:{taskId:c}})}function f(c,d){var e,f=b.constructServiceUrl("trainings","cancel"),g={taskId:c};return d&&(g.requestId=d),e={taskIds:[g]},a.post(f,e)}return{cancelTask:f,getStatus:d,getTaskById:e,initiateTraining:c}}]),angular.module("rest").factory("TrainingSetService",["$http","API_LOCATION","ServiceUtils",function(a,b,c){function d(){var c=b+"/api/trainingSets/all";return a.get(c)}function e(d){var e=b+"/api/trainingSets/generate"+c.constructQueryParameters({categoryId:d});return a.post(e)}return{generateTrainingSets:e,getAllTrainingSets:d}}]),angular.module("rest").factory("UrlUtils",["TokenHandler",function(a){function b(b){var c=b.indexOf("?")>0?"&":"?",d=a.getToken();return d?b+c+"access_token="+d:b}return{addAccessTokenToUrl:b}}]),angular.module("rest").factory("UserDataHandler",["LocalStorageBackedVariable",function(a){var b=a.createHolder("content_sources"),c=a.createHolder("default_source"),d=a.createHolder("categories"),e=a.createHolder("user_type"),f=a.createHolder("image_path"),g=a.createHolder("eula_accepted");return{setContentSourcesRestriction:b.setValue,getContentSourcesRestriction:b.getValue,setDefaultSource:c.setValue,getDefaultSource:c.getValue,setCategoriesRestriction:d.setValue,getCategoriesRestriction:d.getValue,setUserImagePath:f.setValue,getUserImagePath:f.getValue,setUserType:e.setValue,getUserType:e.getValue,setEULAAccepted:g.setValue,getEULAAccepted:g.getValue,resetValues:function(){e.setValue(null),b.setValue([]),d.setValue([]),c.setValue(null),f.setValue(null)}}}]),angular.module("rest").factory("UserDataService",["$http","$q","UserDataHandler","API_LOCATION",function(a,b,c,d){function e(){var e=b.defer(),f=a.get(d+"/api/currentUser/info");return f.success(function(a){c.setUserType(a.userType),c.setContentSourcesRestriction(a.sourcesRestriction),c.setDefaultSource(a.defaultSource),c.setCategoriesRestriction(a.categoriesRestriction),c.setUserImagePath(a.image),e.resolve()}),f.error(function(a){e.reject(a)}),e.promise}function f(){c.resetValues()}return{loadUserData:e,resetUserData:f}}]);