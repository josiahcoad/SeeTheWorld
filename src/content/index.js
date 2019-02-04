// Content code gets injected automatically into every page you go onto in Google Chrome.
import { getUniqueLocationsFromCurrentPage, addGeometryToObject, extractPlaces } from './api.js';
import { createTooltips } from './tooltip.js';

function activatePage() {
    return getUniqueLocationsFromCurrentPage()
        .then(results => Promise.all(results.map(addGeometryToObject)))
        .then((results) => {
            if (results.length > 0) {
                createTooltips(results);
            } else {
                alert("Sorry we couldn't find any results for this page.");
            }
            return results;
        })
        .catch(error => alert(`Error! ${error}`));
}

function singlePlaceLookup(textData) {
    return new Promise((resolve) => {
        addGeometryToObject({ spot: textData }).then((result) => {
            if (result.lat && result.lng) {
                const singlePlaceResult = {
                    // Fill with dummy data
                    ...result,
                    lod: {
                        wikipedia: '',
                    },
                    abstract: '',
                    image: {
                        thumbnail: '',
                    },
                };
                createTooltips([singlePlaceResult]);
                resolve([singlePlaceResult]);
            }
            resolve([]);
        });
    });
}

function createTooltipsForText(textData) {
    return extractPlaces(textData)
        .then(results => Promise.all(results.map(addGeometryToObject)))
        .then((extractedResults) => {
            if (extractedResults.length > 0) {
                createTooltips(extractedResults);
            }
            singlePlaceLookup(textData)
                .then((singlePlaceResult) => {
                    const chosenResults = extractedResults.length > 0 ? extractedResults : singlePlaceResult;
                    if (chosenResults.length === 0) {
                        alert("Sorry we couldn't find any results for this selection.");
                    } else {
                        chrome.storage.local.get(['lastPlacesScraped'], (storageResults) => {
                            if (storageResults.lastPlacesScraped !== undefined) {
                                const updated = storageResults.lastPlacesScraped.concat(
                                    chosenResults,
                                );
                                chrome.storage.local.set({ lastPlacesScraped: updated });
                            }
                        });
                    }
                })
                .catch((error) => {
                    alert(error);
                });
        })
        .catch((error) => {
            alert(error);
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
    } else if (request.message === 'CREATE_TOOLTIPS') {
        const textData = request.data;
        createTooltipsForText(textData).catch((error) => {
            alert(error);
        });
    }
    return true;
});
