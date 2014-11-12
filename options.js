/*
 * Copyright (c) 2014, AlvinHKH
 * http://alvinhkh.com
 * All rights reserved.
 */

to_be_translate = {
	"title": {
		"type": "title",
		"i18n": "extension_name",
	},
	"extension-name": {
		"type": "id",
		"i18n": "extension_name",
	},
	"translations": {
		"type": "id",
		"i18n": "text_translations",
	},
	"support": {
		"type": "id",
		"i18n": "text_support",
		"html": true,
	},
	"options-title": {
		"type": "id",
		"i18n": "title_options",
	},
	"option-show-changelog": {
		"type": "option",
		"i18n": "option_show_changelog",
	},
	"promotion-title": {
		"type": "id",
		"i18n": "title_more_extension",
	},
	"feedback-title": {
		"type": "id",
		"i18n": "title_feedback",
	},
	"feedback-text": {
		"type": "id",
		"i18n": "text_feedback",
	},
	"chrome-web-store": {
		"type": "id",
		"i18n": "chrome_web_store",
	},
	"share-title": {
		"type": "id",
		"i18n": "title_share",
	},
	"twitter": {
		"type": "twitter",
		"i18n": "text_tweet",
	},
	"changelog-title": {
		"type": "id",
		"i18n": "title_changelog",
	},
	"full-changelog": {
		"type": "id",
		"i18n": "text_full_changelog",
	},
	"extension-name-text": {
		"type": "id",
		"i18n": "extension_name",
	},
	"by-text": {
		"type": "id",
		"i18n": "text_by",
	},
	"version-text": {
		"type": "id",
		"i18n": "text_version",
	},
}
/*
 * Function to translate to_be_translate
 */
var message = chrome.i18n.getMessage;
function translation(translate) {
	for (var element in translate) {
		var _element = null,
			type = translate[element].type,
			i18n = translate[element].i18n,
			isHtml = translate[element].html == true ? true : false;
		i18n = (i18n == null || i18n == "") ? element.toString() : i18n;
		switch (type) {
		case 'title':
			document.title = message(i18n);
			break;
		case 'twitter':
			_element = document.getElementById(element);
			_element.getElementsByClassName('twitter-share-button')[0].setAttribute('data-text', message(i18n));
			break;
		case 'option':
			_element = document.getElementById(element);
			if (_element && _element.parentElement)
			_element.parentElement.getElementsByTagName('span')[0].innerText = message(i18n);
			break;
		case 'id':
		default:
			_element = document.getElementById(element);
			if (isHtml) {
				_element.innerHTML = message(i18n);
			} else {
				_element.innerText = message(i18n);
			}
			break;
		}
	}
}

/*
 * Function to show save message
 */
function showMessage(msg) {
	msg = msg ? msg : message('message_saved');
	document.getElementById('message-text').innerText = msg;
	setTimeout(function (){document.getElementById('message-text').innerHTML = "&nbsp;";}, 1000);
}

// Get Options changes from Chrome-Sync via Chrome Storage API
try {
	chrome.storage.onChanged.addListener(function(changes, namespace) {
		for (key in changes) {
			var storageChange = changes[key];
			var newValue;
			if (storageChange.newValue) {
				newValue = storageChange.newValue.toString();
			}
			key = key.replace(/_/ig, '-');
			if (key == 'option-show-changelog' && document.getElementById(key))
				document.getElementById(key).checked = (newValue == 'true');
		}
	});
} catch (e) {
	console.log('ERROR: YOUR BROWSER DO NOT SUPPORT CHROME.STORAGE API');
}

window.addEventListener ('DOMContentLoaded', function() {

	if (self.location.search != '?embedded') {
		document.body.className = document.body.className.replace(/( )?embedded/g, '');
		var element = document.createElement("link");
		if (typeof(element) != "undefined") {
			element.setAttribute("rel", "stylesheet");
			element.setAttribute("type", "text/css");
			element.setAttribute("media", "all");
			element.setAttribute("href", "options_input.css");
			document.getElementsByTagName("head")[0].appendChild(element);
		}
	}

	translation(to_be_translate);

	// Get Options from Chrome-Sync via Chrome Storage API
	try {
		chrome.storage.sync.get(null, function(value){
			sessionStorage['option_show_changelog'] = value['option_show_changelog'] ? ( value['option_show_changelog']=='false' ? 'false' : 'true' ) : 'true';
			
			// Reset Sync Storage
			chrome.storage.sync.clear();
			chrome.storage.sync.set({
				option_show_changelog: sessionStorage['option_show_changelog']
			}, function(){});
		});
	} catch (e) {
		console.log('ERROR: YOUR BROWSER DO NOT SUPPORT CHROME.STORAGE API');
	}
	// Links
	document.getElementById('extension-name').href = 'http://reverseplaylistforyoutube.alvinhkh.com'
	document.getElementById('support-page').href = 'http://reverseplaylistforyoutube.alvinhkh.com/support';
	document.getElementById('author').href = 'http://www.alvinhkh.com';
	document.getElementById('chrome-web-store-reviews').href = 'https://chrome.google.com/webstore/detail/'+ 'phmkjpaalnpngdifcgejpakhfleamlag' + '/reviews';
	document.getElementById('full-changelog').href = 'http://reverseplaylistforyoutube.alvinhkh.com/changelog';

	// Click Actions - Save Options
	document.getElementById('option-show-changelog').addEventListener ('click', function(){
		var id = 'option-show-changelog',
			newValue = document.getElementById(id).checked;
		if (!document.getElementById(id)) return false;
		if (chrome.storage) chrome.storage.sync.set({option_show_changelog: newValue.toString()}, showMessage);
	}, false);
	
	if (typeof ( chrome.runtime ) == 'object' && typeof ( chrome.runtime.getManifest ) == 'function') {
		// Get Version Number
		document.getElementById('version-number').innerText = chrome.runtime.getManifest().version;
		document.getElementById('version-group').style.display = 'inline';
	}

	// Check whether new version is installed
	if (typeof ( chrome.runtime ) == 'object' && typeof( chrome.runtime.onInstalled.addListener ) == 'function') {
		chrome.runtime.onInstalled.addListener(function(details){
		    if (details.reason == "install") {
		        // First Install
		    } else if (details.reason == "update") {
				// Updated
		        var thisVersion = chrome.runtime.getManifest().version;
		        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
		    }
		});
	}

	// Google Plus One Button
	var _gponelang = 'en'; window.___gcfg = {lang: _gponelang}; (function() { var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true; po.src = 'https://apis.google.com/js/plusone.js'; var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s); })();
}, false);