// ==UserScript==
// @name         PoE-Profile-Filter
// @namespace    https://github.com/custompro12
// @version      1.0
// @description  Filters characters by league on pathofexile.com
// @author       custompro12
// @require      https://code.jquery.com/jquery-3.2.1.min.js
// @match        http://www.pathofexile.com/account/view-profile/*
// @match        https://www.pathofexile.com/account/view-profile/*
// ==/UserScript==


$(document).ready(function() {
    // Get the last used league selection
    let filterLeague = localStorage.getItem('PoE-Profile-Filter');

    // Create a new select element
    let $selectNode = $('<select></select>');
    $selectNode.attr('id', 'select-filter');
    $selectNode.css('display', 'block');
    $selectNode.css('width', '265px');
    $selectNode.css('color', '#BEB698');
    $selectNode.css('background-color', 'rgba(42, 42, 42, 0.9)');

    let $defaultOption = $('<option selected disabled>Choose a league...</option>');
    $selectNode.append($defaultOption);

    // Add it to the page
    $('div.container-inner > div > h2').append($selectNode);

    // Intercept the XHR requests for the character data
    let oldOpen = XMLHttpRequest.prototype.open;

    function onStateChange(event) {
        // Only continue if the request was for character data
        let urlRegex = /https*:\/\/www.pathofexile.com\/character-window\/get-characters/;
        if (this.responseURL.match(urlRegex)) {
            let $select = $('#select-filter');

            // Don't update the list multiple times
            if ($select.children().length === 1) {
                try {
                    let charList = JSON.parse(this.response);

                    if (charList && typeof charList === "object") {
                        let leagueList = charList.map(x=>x.league);

                        // Filter out duplicates
                        leagueList = leagueList.filter((v,i,s)=> s.indexOf(v)===i);

                        // Build the options list
                        leagueList.forEach(element=> {
                            $select.append(
                                $('<option></option>').val(element).html(element)
                            );
                        });
                    }

                    if (filterLeague) {
                        $('#select-filter').val(filterLeague).change();
                    }
                } catch (err) {
                    console.error('Filter-PoE: The page received an XHR response that didn\'t return proper JSON');
                }
            }
        }
    }

    XMLHttpRequest.prototype.open = function() {
        this.addEventListener("readystatechange", onStateChange);

        oldOpen.apply(this, arguments);
    };

    // When a selection is chosen, hide all characters from other leagues
    $('#select-filter').change(function() {
        let filterLeague = this.options[this.selectedIndex].text;
        let $charList = $('#profile-inventory-controls > div.inventoryManagerMenu > div > ul > li');
        //console.log($charList);

        $charList.each(function(index, character) {
            if ($(character).children().last().text() === filterLeague + " League") {
                $(character).show();
            } else {
                $(character).hide();
            }
        });

        localStorage.setItem('PoE-Profile-Filter', filterLeague);
    });

    $('body').on('DOMNodeInserted', 'li', function(element) {
        let $character = $(element.target);
        if ($character.prop('tagName') === 'LI' && filterLeague) {
            if ($character.children().last().text() === filterLeague + " League") {
                console.log($character.children().last().text());
                $character.show();
            } else {
                $character.hide();
            }
        }
    });
});

