// Content code gets injected automatically into every page you go onto in Google Chrome.
import findAndReplaceDOMText from 'findandreplacedomtext';
import { getUniqueLocationsFromCurrentPage } from './api.js';
import { insertTooltips } from './tooltip';

function googleGeometryAPIGet(location) {
    return new Promise((resolve, reject) => {
        const Http = new XMLHttpRequest();
        Http.responseType = 'json';
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?key=AIzaSyANvkYDq_yLEJVS0t_auv5afE8iHCuKnt8&input=${encodeURI(
            location,
        )}&inputtype=textquery&fields=geometry`;
        Http.open('GET', url);
        Http.onloadend = () => {
            if (Http.status === 200) {
                resolve(
                    Http.response.candidates.length === 0
                        ? { lat: null, lng: null }
                        : Http.response.candidates[0].geometry.location,
                );
            } else {
                reject(Error(Http.status));
            }
        };
        // Handle network errors
        Http.onerror = () => {
            reject(Error('Network Error'));
        };
        Http.send();
    });
}

function addGeometryToObject({ spot, ...rest }) {
    return (
        googleGeometryAPIGet(spot)
            .then(response => ({
                name: spot,
                lat: response.lat,
                lng: response.lng,
                ...rest,
            }))
            // an error will be raised here if there is a Network Error or
            // if the response code from the Google Places API is not a 200
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.log(error);
                return {
                    name: spot,
                    lat: null,
                    lng: null,
                    ...rest,
                };
            })
    );
}

function activatePage() {
    return getUniqueLocationsFromCurrentPage()
        .then(results => Promise.all(results.map(addGeometryToObject)))
        .then((results) => {
            if (results.length !== 0) {
                results.forEach((result) => {
                    const wrapClass = `${result.name.replace(' ', '_')}_tooltip`;
                    findAndReplaceDOMText(document.body, {
                        find: result.name,
                        wrap: 'span',
                        wrapClass,
                    });
                    insertTooltips(
                        {
                            title: result.name,
                            link: result.lod.wikipedia,
                            image: result.image.thumbnail,
                            summary: result.abstract,
                        },
                        wrapClass,
                    );
                });
            } else {
                alert("Sorry we couldn't find any results for this page.");
            }
            return results;
        })
        .catch((error) => {
            alert(error);
            return [];
        });
}

// ***************** EXECUTE THIS ON PAGE LOAD ***************** //
// eslint-disable-next-line no-console
console.log('Activating Wanderland');
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    // add a results box to the top of the page
    // add an event listener to wait for a button press of the
    // activate button in the extension.js code.
    if (request.message === 'ACTIVATE') {
        activatePage()
            .then(results => sendResponse({
                message: 'SUCCESS',
                placesScraped: results,
            }))
            .catch(() => sendResponse({
                message: 'FAILED',
                placesScraped: [],
            }));
    }
    return true;
});
