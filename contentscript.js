/*
 * Copyright (c) 2014-2015, AlvinHKH
 * http://alvinhkh.com
 * All rights reserved.
 */

// TO-DO: Clear really old playlistid data
// TO-DO: full-screen support

var extension_name = typeof chrome.i18n == "object" ? chrome.i18n.getMessage('extension_name') : "ALVINHKH";
var extension_name_log = '[' + extension_name.toUpperCase() + ']';

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

ytrp = {};

ytrp = {
	debug: (localStorage['yt-reverseplaylist-debug'] == 'true' ? true : false),
	
	/*
	 * Function to get locale strings from each message.json file
	 * Limitation: Cannot idenfity placeholder in message.json
	 */
	localeFetch: function (locale, prefix) {
		locale = locale.replace("-", "_");
		var messages = chrome.i18n.getMessage;
		var path = chrome.extension.getURL('');
		var file = path + "_locales/" + locale + "/messages.json";
		prefix = prefix ? prefix + "_" : "script_";
		var return_message = {};
		var xhr = new XMLHttpRequest();
		xhr.open("GET", file, false);
		xhr.onreadystatechange = function() {
			if(this.status == 200 && this.readyState == 4 && this.responseText != "") {
				var messages = JSON.parse(this.responseText);
				var return_array = {};
				for (var name in messages) {
					var regex = new RegExp("^" + prefix + "(.*)$", "g");
					if (name.match(regex)) {
						var attr = name.replace(regex, "$1");
						if (attr && messages[name] && messages[name].message != null) {
							return_array[attr] = messages[name].message;
						}
					}
				}
				return_message = return_array;
			}
		};
		try {
			xhr.send();
		}
		catch (e) {
		}
		return return_message;
	},
	
	getCorrectLocale: function (lang) {
		lang = lang.replace(/-/g,'_');
		switch (lang) {
		case "zh_HK":
			return "zh_TW";
			break;
		case "zh":
			return "zh_CN";
			break;
		default:
			return lang;
		}
	},
	
	i18n: function (s) {
		// Initialise i18n Variables
		if (ytrp.i18n == undefined)
			ytrp.i18n = {};
		if (ytrp.i18n['en'] == undefined)
			ytrp.i18n['en'] = {};
		if (Object.keys(ytrp.i18n['en']).length < 1)
			ytrp.i18n['en'] = ytrp.localeFetch("en");
		if (ytrp.lang != undefined) {
			if (ytrp.i18n[ytrp.lang] == undefined)
				ytrp.i18n[ytrp.lang] = {};
			if (ytrp.lang && Object.keys(ytrp.i18n[ytrp.lang]).length < 1)
				ytrp.i18n[ytrp.lang] = ytrp.localeFetch(ytrp.lang);
		}
		// Translate
		var r = '';
		if (r = ytrp.i18n[ytrp.lang][s]) {
			return r;
		} else if (ytrp.i18n[ytrp.lang][s] == '') {
			return '';
		} else if (r = ytrp.i18n['en'][s]) {
			return r;
		} else {
			return '';
		}
	},
	
	initialiseVariables: function () {
		ytrp.button = null;
		ytrp.button_container_class = null;
		ytrp.button_class = null;
		ytrp.button_id = 'nav-reverse-playlist';
		ytrp.playlist_tray = null;
		ytrp.getReadyTimes = 0;
		ytrp.lang = null;
		ytrp.behavior_previous = null;
		ytrp.behavior_next = null;
		ytrp.button_shuffle = null;
		sessionStorage['yt-playlist-id'] = '0';
		sessionStorage['yt-playlist-reversed'] = 'false';
		if (!localStorage['yt-reverseplaylist-record']) {
			localStorage['yt-reverseplaylist-record'] = JSON.stringify({});
		}
	},

	setReverseState: function(bool) {
		if (ytrp.playlist_tray == undefined) {
			// Reset reverse state if playlist not exist
			bool = false;
		}
		var records = {};
		var playlist = ytrp.getPlaylistId();
		var timestamp = new Date().getTime();
		if (localStorage['yt-reverseplaylist-record']) {
			records = JSON.parse(localStorage['yt-reverseplaylist-record']);
		}
		if (bool == true) {
			records[playlist] = timestamp;
			sessionStorage['yt-playlist-reversed'] = 'true';
		} else {
			records[playlist] = 'false';
			sessionStorage['yt-playlist-reversed'] = 'false';
		}
		localStorage['yt-reverseplaylist-record'] = JSON.stringify(records);
		if (ytrp.debug) console.log(extension_name_log, 'setReverseState:', sessionStorage['yt-playlist-reversed']);
		ytrp.getStoredReverseState();
	},
	
	removeReverseState: function (id) {
		id = id ? id : ytrp.getPlaylistId();
		var records = {};
		if (localStorage['yt-reverseplaylist-record']) {
			records = JSON.parse(localStorage['yt-reverseplaylist-record']);
		}
		return delete records[id];
	},
	
	getReverseState: function() {
		return sessionStorage['yt-playlist-reversed'] && sessionStorage['yt-playlist-reversed'].toString() == 'true' ? true : false;
	},
	
	getStoredReverseState: function() {
		var playlist = ytrp.getPlaylistId();
		var value = {};
		if (localStorage['yt-reverseplaylist-record']) {
			value = JSON.parse(localStorage['yt-reverseplaylist-record']);
		}
		sessionStorage['yt-playlist-reversed'] = value[playlist] ? (value[playlist] != 'false') : 'false';
	},
	
	setVariables: function () {
		ytrp.lang = document.documentElement.getAttribute("lang");
		ytrp.lang = ytrp.getCorrectLocale(ytrp.lang);
		
		if (document.getElementsByClassName('playlist-videos-list').length > 0) {
			ytrp.playlist_tray = document.getElementsByClassName('playlist-videos-list')[1];
		}
		
		if (ytrp.playlist_tray == null) {
			if (ytrp.debug) console.log(extension_name_log, 'Playlist does not exist.');
			return;
		}
		
		if (document.getElementsByClassName('prev-playlist-list-item').length > 0)
		ytrp.behavior_previous = document.getElementsByClassName('prev-playlist-list-item')[0];
		if (document.getElementsByClassName('next-playlist-list-item').length > 0)
		ytrp.behavior_next = document.getElementsByClassName('next-playlist-list-item')[0];
		if (document.getElementsByClassName('playlist-nav-controls').length > 0)
		ytrp.button_container_class = document.getElementsByClassName('playlist-nav-controls')[0];
		if (document.getElementsByClassName('toggle-autoplay').length > 0)
		ytrp.button_class = document.getElementsByClassName('toggle-autoplay')[0].className.replace(/( )?toggle-autoplay/, '');
		else if (document.getElementsByClassName('next-playlist-list-item').length > 0)
		ytrp.button_class = document.getElementsByClassName('next-playlist-list-item')[0].className.replace(/( )?next-playlist-list-item/, '');
		if (document.getElementsByClassName('shuffle-playlist').length > 0)
		ytrp.button_shuffle = document.getElementsByClassName('shuffle-playlist')[0];
		
		sessionStorage['yt-playlist-id'] = ytrp.getPlaylistId();

		try {
			ytrp.getStoredReverseState();
		} catch (e) {
			if (ytrp.debug) console.error(extension_name_log, e.message);
		}
	},
	
	setButton: function () {
		if (ytrp.button != null) return;
		if (ytrp.button_container_class == null) return false;
		if (ytrp.button_class == null) return false;
		var p = ytrp.button_container_class.childNodes[ytrp.button_container_class.childNodes.length-2];
		if (p == null) {
			p = ytrp.button_container_class.childNodes[0];
		}
		var button = document.createElement('button'),
			icon_wrapper = document.createElement('span'),
			icon = document.createElement('img')
		button.setAttribute('title', ytrp.i18n('reverse_playlist'));
		button.setAttribute('id', ytrp.button_id);
		button.setAttribute('class', ytrp.button_class);
		button.setAttribute('data-button-toggle', 'true');
		button.setAttribute('type', 'button');
		button.setAttribute('role', 'button');
		button.setAttribute('onclick', ';return false;');
		icon_wrapper.className = 'yt-uix-button-icon-wrapper';
		icon.setAttribute('id', 'reverse-playlist-icon');
		icon.setAttribute('class', 'yt-uix-button-icon yt-uix-button-icon-watch-appbar-reverse-video-list yt-sprite');
		icon.setAttribute('src','data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');
		icon_wrapper.appendChild(icon);
		button.appendChild(icon_wrapper);
		button.addEventListener ('click', ytrp.buttonAction);
		// Remove existing reverse button to prevent duplicate buttons created
		var existing_button = document.querySelectorAll('#' + ytrp.button_id);
		for (var i = 0; i < existing_button.length; i++) {
			existing_button[i].remove();
		}
		// Insert Reverse Button
		p.parentNode.insertBefore(button, p);
		// Assign created button to variable ytrp.button
		ytrp.button = document.getElementById(ytrp.button_id);
	},
	
	buttonAction: function () {
		if (ytrp.isShuffle() == true && ytrp.button_shuffle) {
			ytrp.button_shuffle.click();
		}
		return ytrp.reverseList();
	},
	
	buttonDisplay: function (b) {
		ytrp.button.className = ytrp.button.className.replace(/( )?yt-uix-button-toggled/g, '');
		if ((b == null && ytrp.getReverseState() == true && ytrp.isShuffle() != true) || b == true) {
			ytrp.button.className += ' yt-uix-button-toggled';
		}
	},
	
	setEventListener: function () {
		if (ytrp.playlist_tray) {
			var button = ytrp.playlist_tray.getElementsByTagName('button');
			if (ytrp.debug) console.log(extension_name_log, 'number of videos with remove button:', button.length);
			for (var i = 0; i < button.length; i++) {
				button[i].addEventListener('click', ytrp.removeVideoFromPlaylistAction, false);	
			}
		}
	},
	
	/*
	 * Action that relabel counts in playlist
	 */
	removeVideoFromPlaylistAction: function (e) {
		if (ytrp.isReversed() == true) {
			clearTimeout(ytrp.recount);
			ytrp.recount = setTimeout(function() {
				if (document.querySelectorAll('[data-index]').length > 0) {
					var count = document.querySelectorAll('[data-index]');
					for (var i = 0; i < count.length; i++) {
						document.querySelectorAll('[data-index]')[i].setAttribute('data-index', (count.length - i));
					}
				} else {
					return;
				}
			}, 500);
		}
	},
	
	reverseList: function () {
		// Reverse Playlist Tray
		var list = ytrp.playlist_tray;
		if (list == null) return false;
		if (ytrp.behavior_previous == null || ytrp.behavior_next == null) return false;
		// Reverse elements' order
		for (i = 0 ; i < list.childNodes.length; ++i) {
			list.childNodes[i].parentNode.insertBefore(list.childNodes[i], list.childNodes[0]);
		}
		// Set Navigate links
		var temp_next_link = ytrp.behavior_next.href;
		ytrp.behavior_next.setAttribute('href', ytrp.behavior_previous.href);
		ytrp.behavior_previous.setAttribute('href', temp_next_link);
		// Save current state
		ytrp.setReverseState(ytrp.isReversed() == true);
		// Scroll list to current playing item or top of the list
		if (document.getElementsByClassName('currently-playing').length > 0) {
			ytrp.playlist_tray.scrollTop = document.getElementsByClassName('currently-playing')[0].offsetTop;
		} else {
			ytrp.playlist_tray.scrollTop = 0;
		}
	},
	
	isReversed: function () {
		// Return true if in reverse order
		if (document.querySelectorAll('[data-index]').length > 0) {
			var count = document.querySelectorAll('[data-index]');
			if (count.length > 2 && (parseInt(count[0].getAttribute('data-index')) > parseInt(count[1].getAttribute('data-index')) || parseInt(count[0].getAttribute('data-index')) > parseInt(count[2].getAttribute('data-index')) || parseInt(count[1].getAttribute('data-index')) > parseInt(count[2].getAttribute('data-index')))) {
				// Compare first items in playlist to avoid playing item
				return true;
			} else if (count.length == 2 && ( parseInt(count[1].getAttribute('data-index')) == 1 || parseInt(count[0].getAttribute('data-index')) == 2 )) {
				return true;
			}
			return false;
		}
		return false;
	},
	
	isShuffle: function () {
		if (ytrp.button_shuffle && ytrp.button_shuffle.className.match(/yt-uix-button-toggled/g)) {
			return true;
		}
		return false;
	},
	
	ShuffleButtonAction: function (e) {
		// autoClick: click by script or user
		var autoClick = (e.clientX == 0 && e.clientY == 0);
		if (!ytrp.isShuffle() == true) {
			if (ytrp.button.className.match(/yt-uix-button-toggled/g) != null) {
				ytrp.buttonDisplay(false);
			}
		} else if (autoClick == false) {
			if (ytrp.isReversed() != null && ytrp.isReversed() != ytrp.getReverseState()) {
				ytrp.reverseList();
			}
			ytrp.buttonDisplay();
		}
		return;
	},
	
	getUrlParameters: function(s) {
		var v = {};	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,k,e) { v[k] = e;	});	return v[s];
	},
	
	getPlaylistId: function () {
		if (document.getElementsByClassName('playlist-header-content').length > 0) {
			var id = document.getElementsByClassName('playlist-header-content')[0].getAttribute('data-full-list-id');
			if (ytrp.debug) console.info(extension_name_log, 'Playlist ID:', id);
			return id;
		} else if (ytrp.getUrlParameters('list')) {
			var id = ytrp.getUrlParameters('list');
			if (ytrp.debug) console.info(extension_name_log, 'Playlist ID:', id);
			return id;
		}
		if (ytrp.debug) console.error(extension_name_log, 'Unable to get playlist ID.');
		return "0";
	},
	
	update: function () {
		if (ytrp.isReversed() != null && ytrp.isReversed() != ytrp.getReverseState() && ytrp.isShuffle() == false) {
			ytrp.reverseList();
		}
		ytrp.buttonDisplay();
	},
	
	getReady: function () {
		ytrp.getReadyTimes += 1;
		try {
			ytrp.setButton();
			ytrp.buttonDisplay();
		} catch (error) {
			if (ytrp.debug) console.error(extension_name_log, 'getReady -', error.message);
		} finally {
			if (ytrp.getReadyTimes > 100) {
				if (ytrp.debug) console.error(extension_name_log, 'Something blocked to get ready.');
				if (ytrp.button) ytrp.button.disabled = true;
				return;
			}
			if (ytrp.button == null) {
				// Retry if button is not initiate
				setTimeout(function(){
					ytrp.getReady();
				}, 500);
			} else {
				if (ytrp.button_shuffle) {
					ytrp.button_shuffle.removeEventListener('click', ytrp.ShuffleButtonAction, false);
					ytrp.button_shuffle.addEventListener('click', ytrp.ShuffleButtonAction, false);
				}

				ytrp.update();
			}
		}
	},
};

// Check whether new version is installed
if (typeof ( chrome.runtime ) == 'object') {
	var thisVersion = chrome.runtime.getManifest().version;
	// Check to show changelog or not
	try {
		chrome.storage.onChanged.addListener(function(changes, namespace) {
			for (key in changes) {
				var storageChange = changes[key];
				switch(key) {
					case 'option_show_changelog':
						localStorage['yt-reverseplaylist-show-changelog'] = storageChange.newValue == 'false' ? false : true;
						break;
				}
			}
		});
		chrome.storage.sync.get(null, function(value){ 
			localStorage['yt-reverseplaylist-show-changelog'] = value['option_show_changelog'] ? ( value['option_show_changelog'] == 'false' ? false : true ) : true;
		});
	} catch (e) {
		localStorage['yt-reverseplaylist-show-changelog'] = true;
	}
	if (localStorage['yt-reverseplaylist-show-changelog'] == "true" && localStorage['yt-reverseplaylist-version'] && localStorage['yt-reverseplaylist-version'] != thisVersion.toString()) {
		// check version number, if they are different, show changelog
		var changelog_url = "http://reverseplaylistforyoutube.alvinhkh.com/changelog/updated";
		window.open(changelog_url, "changelogWindow");
	}
	// save current extension version
	localStorage['yt-reverseplaylist-version'] = thisVersion;
}

if (ytrp.bodyObserver) ytrp.bodyObserver.disconnect();
ytrp.bodyObserver = new MutationObserver(function (mutations) {
	mutations.forEach(function (mutation) {
		if (mutation.attributeName && mutation.attributeName == 'class') {
			var host = document.location.host;
			var isYouTube_host = (host.substr(host.length - 11) == 'youtube.com' && host != 'm.youtube.com');
			var isYouTube_target = ((mutation.target.baseURI).match("youtube.com") != null);
			if (mutation && mutation.target && isYouTube_host && isYouTube_target) {
				if ((mutation.target.baseURI).match("watch\\?") != null) {
					if (mutation.target.className.match('page-loaded') != null) {
						if (sessionStorage['yt-playlist-body-class'] == undefined || sessionStorage['yt-playlist-body-class'].match('page-loaded') == null) {
							if (ytrp.debug) console.log(extension_name_log, 'Initialise');
							ytrp.initialiseVariables();
							ytrp.setVariables();
							ytrp.setEventListener();
							if (ytrp.playlist_tray == null) {
								if (ytrp.debug) console.log(extension_name_log, 'Playlist does not exist.');
								return;
							}
							ytrp.getReady();
						}
					}
					sessionStorage['yt-playlist-body-class'] = mutation.target.className;
				} else {
					if (ytrp.debug) console.log(extension_name_log, 'This is not a video page');
					ytrp.initialiseVariables();
				}
			} else {
				if (ytrp.debug) console.log(extension_name_log, 'NOT YOUTUBE.COM');
			}
		}
	});
});
ytrp.bodyObserver.observe(document.body, { attributes: true, subtree: false });
