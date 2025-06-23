// ==UserScript==
// @name         Garmin Addons
// @namespace    http://tampermonkey.net/
// @version      2025-06-22
// @description  Adds some convenience stuff to Garmin Connect
// @author       wullxz
// @match        https://connect.garmin.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=garmin.com
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js 
// @grant        none
// ==/UserScript==

var weightLossAvgDone = false;

(function () {
    'use strict';

    console.log("Trying to add new event handler for notifications removal link...");
    var ivid = setInterval(() => {
        try {
            var notifications_menu = document.querySelector('a[data-original-title="Requests & Notifications"]');
            notifications_menu.addEventListener("click", addRemoveLink);
            clearInterval(ivid);
        } catch (error) {
            console.log("Trying again to add notification removal link soon...");
        }

    }, 500);

    if (location.href.startsWith("https://connect.garmin.com/modern/weight")) {
        console.log("Calculating avg weight loss per week in displayed date range...");
        addAverageWeeklyWeightLossWaiter();
    }

    waitForElement('div.header-nav', addLikeAllButton);
})();

// ------------- General functions ------------- //

function waitForElement(selector, callback) {
    var interval = setInterval(() => {
        var element = document.querySelector(selector);
        if (element) {
            clearInterval(interval);
            callback(element);
        }
    }, 500);
}

// ------------- End General functions ------------- //

// ------------- Like All Button ------------- //

function getOwnProfileGUID(profileIcon) {
    var profileIcon = document.querySelector('div.header-nav-item.user-profile');
    var profileLink = profileIcon ? profileIcon.querySelector('a') : null;
    var profileGUID = profileLink ? profileLink.getAttribute('href').split('/').pop() : null;
    console.log("Own Profile GUID: " + profileGUID);
    return profileGUID;
}

function addLikeAllButton() {
    var likeAllButton = $('<div class="like-all-nav-item header-nav-item" style="height: 60px; width: 50px;"><a href="#" class="header-nav-link icon-heart" aria-label="Like All" data-original-title="Like All" data-rel="tooltip"></a></div>');
    likeAllButton.on('click', likeAll);
    var headerNav = document.querySelector('div.header-nav');
    if (headerNav) {
        $(headerNav).prepend(likeAllButton[0]);
    }

}

function likeAll() {
    // Get the own profile GUID
    var profileGUID = getOwnProfileGUID();
    console.log("Like all activities in feed!");

    // Like in newsfeed
    if (window.location.href.startsWith("https://connect.garmin.com/modern/newsfeed")) {
        document.querySelectorAll('div[class*="ActivityCard_activityContainer"]').forEach((activity) => {
            var activityName = activity.querySelector('a[href^="/modern/activity/"] > p').textContent;
            var activityUser = $(activity).find('a[href^="/modern/profile/').attr('title');

            //console.log("Processing activity: " + activityName + " by user: " + activityUser);

            var activityProfileGUID = $(activity).find('a[href^="/modern/profile/').attr('href').split('/').pop();
            if (activityProfileGUID === profileGUID) {
                return;
            }
            var likeButton = activity.querySelector('button[aria-label="Like"]:not([class*="like-link"])');
            if (likeButton) {
                console.log("Found like button for activity: " + activityName + " by user: " + activityUser);
                likeButton.click();

            }
        });
    }
    // Like in profile feed
    else if (window.location.href.startsWith("https://connect.garmin.com/modern/profile/")) {
        if (window.location.href.split('/').pop() == profileGUID) {
            // we don't like ourselves!
            return;
        }
        $('div[class*="Activity_activityWrapper"]').each((index, activity) => {
            var activityName = $(activity).find('div[class*="Activity_activityTitle"]').text();
            var activityUser = $(activity).find('a[href^="/modern/profile/"]').text();

            console.log("Processing activity: " + activityName + " by user: " + activityUser);

            $(activity).find('div[class*="SocialItem_socialFeedItemFooter"]').find('button.like-link[aria-label="Like"]').click();
        });
    }
}

// ----------------- End Like All Button ------------- //

/**
 * Adds a listener to the page that waits for the weight table to be loaded.
 * Once the table is loaded, it will call addAverageWeeklyWeightLoss with the table body.
 * This function might need a new trigger if the page structure changes.
 */
function addAverageWeeklyWeightLossWaiter() {
    var tablebodySelector = 'table[class^="WeightsTables_weightsTable"] > tbody';
    var tbody;
    var waitForTable = setInterval(() => {
        console.log("Checking if weight table is already loaded!");
        tbody = document.querySelector(tablebodySelector);
        if (tbody) {
            clearInterval(waitForTable);
            addAverageWeeklyWeightLoss(tbody);
        }
    }, 500);
}

/**
 * Calculates the average weekly weight change from the given table body and 
 * inserts a new row displaying this average at the top of the table.
 * 
 * TODO: This function works best when displaying the weight table of last years data.
 * It calculates correctly in shorter timespans but displays awkwardly.
 *
 * @param {HTMLElement} tbody - The table body containing weight data rows.
 */

function addAverageWeeklyWeightLoss(tbody) {
    if (weightLossAvgDone) {
        return;
    }
    else {
        weightLossAvgDone = true;
    }
    var selectorDecrease = 'td[class*="WeightsTables_noWrapCell"]:has(i[class*="WeightsTables_weightDecreaseIcon"])';
    var selectorIncrease = 'td[class*="WeightsTables_noWrapCell"]:has(i[class*="WeightsTables_weightIncreaseIcon"])';
    var selectorNoChange = 'td[class*="WeightsTables_noWrapCell"]:has(i[class*="WeightsTables_weightDeltaIcon"])';
    var allChanges = 0;
    var countChanges = 0;
    document.querySelectorAll(selectorNoChange).forEach((diff) => {
        var d = Number.parseFloat(diff.textContent.replace(' kg', ''));
        if (diff.querySelector('i[class*="WeightsTables_weightDecreaseIcon"]')) {
            allChanges = allChanges - d;
        }
        else if (diff.querySelector('i[class*="WeightsTables_weightIncreaseIcon"]')) {
            allChanges = allChanges + d;
        }

        countChanges += 1;
    });
    var weeklyDiff = Number.parseFloat(allChanges / countChanges).toFixed(2);

    const row = document.createElement("tr");
    for (let i = 0; i < 8; i++) {
        const td = document.createElement("td");
        if (i === 0) {
            td.colSpan = 2;
            td.textContent = "Weekly average:";
        }
        if (i === 2) {
            if (weeklyDiff > 0) {
                td.style.backgroundColor = "lightcoral";
            }
            else if (weeklyDiff < 0) {
                td.style.backgroundColor = "lightgreen";
            }
            td.textContent = `${weeklyDiff} kg`;
        }
        row.appendChild(td);
    }
    tbody.insertBefore(row, tbody.firstChild);

    console.log("All Changes: " + allChanges + "\nNumber of Weeks: " + countChanges + "\nWeekly average diff");

}

function addRemoveLink() {
    var ivid = setInterval(() => {
        try {
            var noti_header = document.querySelector('div.notifications-header');
            /*var link = '<a href="#" id="remove-all-notifications" class="section-name">Remove all notifications!</a>';
            var div = document.createElement('div');
            div.classList.add('section-header');
            div.classList.add('header-nav-menu-section');
            div.innerHTML = link; */
            var link = document.createElement('a');
            link.setAttribute('href', '#');
            link.classList.add('section-name');
            link.setAttribute('id', 'remove-all-notifications');
            link.innerText = "Clear all!";
            noti_header.appendChild(link);
            document.getElementById("remove-all-notifications").addEventListener("click", removeNotifications);
            clearInterval(ivid);
        } catch (error) {
            console.log("Waiting for notifications to be shown...");
        }
    }, 500);
}

function removeNotifications() {
    var notif = document.querySelector('div.notifications');
    notif.querySelectorAll('button.icon-dismiss').forEach((el) => { el.click() });
}