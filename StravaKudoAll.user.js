// ==UserScript==
// @name         Kudo All
// @namespace    http://schnitzelspecht.de
// @version      2026-11-01
// @description  Kudo all activities loaded
// @author       wullxz
// @match        https://www.strava.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=strava.com
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @updateURL    https://github.com/wullxz/tampermonkey-scripts/raw/refs/heads/main/StravaKudoAll.user.js
// @downloadURL  https://github.com/wullxz/tampermonkey-scripts/raw/refs/heads/main/StravaKudoAll.user.js
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    const kudo_pattern = 'svg[data-testid="unfilled_kudos"]';
    const activity_pattern = 'div[class^="FeedEntry_entryContainer__"]';
    const athlete_in_activity_pattern = 'div[class^="HeaderWithOwnerMetadata_nameBoosted__"] > a';
    const header_nav_pattern = 'nav[aria-label="Main"] > ul:nth-child(2)';
    const my_athlete_id = $('#athlete-menu').attr('href');

    function add_nav_button() {
        setTimeout(() => {
            console.log("Trying to add kudo all button!");

            var kudoAllButton = $('<li><a href="#" id="kudo-all" aria-label="Kudo All" data-original-title="Kudo All" data-rel="tooltip">Kudo All!</button></li>');
            kudoAllButton.on('click', kudo_all);

            var headerNav = $(header_nav_pattern);
            var li_class = $(headerNav).find('li').first().attr('class');
            var btn_class = $(headerNav)
            .find('li > a[class^="Button_btn__"]')
            .attr('class')
            .split(/\s+/)
            .filter(cls => cls.startsWith("Button_btn__") || cls.startsWith("Button_default__"));

            $(kudoAllButton).attr('class', li_class);
            $(kudoAllButton).find('#kudo-all').addClass(btn_class);

            console.log(headerNav);
            $(headerNav).first().prepend(kudoAllButton);
        }, 500);
    }

    function get_activity_athlete(elem) {
        console.log(elem);
        return $(elem).find(athlete_in_activity_pattern).attr('href');
    }

    function get_all_activities() {
        var activities = $(activity_pattern);
        console.log(activities);
        console.log(typeof activities);
        return activities;
    }

    function find_and_trigger_kudo(activity) {
        console.log("Checking...");
        console.log(activity);
        var athlete_id = get_activity_athlete(activity)

        console.log(athlete_id + " == " + my_athlete_id + " => " + (athlete_id == my_athlete_id));
        if (athlete_id == "undefined") {
            console.log("Couldn't find athlete ID for activity");
            return;
        }

        if (athlete_id == my_athlete_id) {
            console.log("Activity is mine! Not kudoing");
            return;
        }

        var kudo = $(activity).find(kudo_pattern);
        console.log(kudo);
        console.log($(kudo).find(already_kudoed_pattern));
        if (kudo) {
            console.log("kudoing...");
            $(kudo).parent().trigger('click');
            return;
        }

        // already kudoed
        console.log("Activity already kudoed or kudo button not found");
    }

    function kudo_all() {
        get_all_activities().each((idx, activity) => {
            find_and_trigger_kudo(activity);
        });
    }

    add_nav_button();
    console.log(my_athlete_id);
})();
