/*
 * Copyright (c) 2014, AlvinHKH
 * http://alvinhkh.com
 * All rights reserved.
 */

to_be_translate = {
	"title": {
		"type": "title",
		"i18n": "extension_name",
		"html": false,
	},
	"extension-name": {
		"type": "id",
		"i18n": "extension_name",
		"html": false,
	},
	"translations": {
		"type": "id",
		"i18n": "text_translations",
		"html": false,
	},
	"support": {
		"type": "id",
		"i18n": "text_support",
		"html": true,
	},
	"promotion-title": {
		"type": "id",
		"i18n": "title_more_extension",
		"html": false,
	},
	"feedback-title": {
		"type": "id",
		"i18n": "title_feedback",
		"html": false,
	},
	"feedback-text": {
		"type": "id",
		"i18n": "text_feedback",
		"html": false,
	},
	"chrome-web-store": {
		"type": "id",
		"i18n": "chrome_web_store",
		"html": false,
	},
	"share-title": {
		"type": "id",
		"i18n": "title_share",
		"html": false,
	},
	"twitter": {
		"type": "twitter",
		"i18n": "text_tweet",
		"html": false,
	},
	"changelog-title": {
		"type": "id",
		"i18n": "title_changelog",
		"html": false,
	},
	"extension-name-text": {
		"type": "id",
		"i18n": "extension_name",
		"html": false,
	},
	"by-text": {
		"type": "id",
		"i18n": "text_by",
		"html": false,
	},
	"version-text": {
		"type": "id",
		"i18n": "text_version",
		"html": false,
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

window.addEventListener ('DOMContentLoaded', function() {
	translation(to_be_translate);

	// Links
	var extension_id = "phmkjpaalnpngdifcgejpakhfleamlag";
	document.getElementById('extension-name').href = 'https://chrome.google.com/webstore/detail/'+ extension_id;
	document.getElementById('support-page').href = 'https://chrome.google.com/webstore/support/'+ extension_id;
	document.getElementById('chrome-web-store-reviews').href = 'https://chrome.google.com/webstore/detail/'+ extension_id + '/reviews';

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