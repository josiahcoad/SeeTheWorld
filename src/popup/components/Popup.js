// Root Component for the Popup that appears when you click the extension icon
// in the chrome browser.
import React, { Component } from 'react';
import Loader from './Loader';
import PopupNavbar from './Navbar';
import ResultsPage from './results/ResultsPage';
import FeedbackForm from './FeedbackForm';
import AboutTeam from './aboutUs/AboutPage';
import './Popup.css';
import { PAGE_SCAN, PAGE_SCAN_SUCCESS, PAGE_SCAN_FAILED } from '../../extensionMessageTypes';
import { sendMessageToCurrentTab } from '../../googleMessaging';

const pages = {
    FEEDBACK: 'FEEDBACK',
    RESULTS: 'RESULTS',
    ABOUT_US: 'ABOUTUS',
};

class Popup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            placesScraped: [],
            selectedPlace: {},
            loading: true,
            reloadNeeded: false,
            currentPage: pages.RESULTS,
        };
        this.setLastPlacesScraped = this.setLastPlacesScraped.bind(this);
        this.setSelectedPlace = this.setSelectedPlace.bind(this);
        this.setPage = this.setPage.bind(this);
        this.sendMessageToScrapePage = this.sendMessageToScrapePage.bind(this);
        this.renderPage = this.renderPage.bind(this);
    }

    componentDidMount() {
        // A little hack workaround that allows the page to load
        // immediatly when the user clicks the poup icon.
        // For the first 300 ms, the loader icon shows.
        setTimeout(() => {
            this.setState({ loading: false });
        }, 300);

        chrome.storage.local.get(['lastPlacesScraped'], (result) => {
            if (result.lastPlacesScraped !== undefined && result.lastPlacesScraped !== null) {
                this.setState({ placesScraped: result.lastPlacesScraped });
            }
        });
    }

    setSelectedPlace(place) {
        this.setState({ selectedPlace: place });
    }

    setPage(currentPage) {
        this.setState({ currentPage });
    }

    setLastPlacesScraped(placesScraped) {
        this.setState({ placesScraped });
        chrome.storage.local.set({ lastPlacesScraped: placesScraped });
    }

    // Use google's extension api to send an "PAGE_SCAN" to the page/tab you're currently on.
    // Wait for a reponse and if the reponse is a "SUCCESS" then set the button with id "activate"
    // to show "loaded". Until a response is received, set the button text to "loading".
    sendMessageToScrapePage() {
        this.setState({ loading: true });
        sendMessageToCurrentTab(PAGE_SCAN)
            .then((response) => {
                if (response.message === PAGE_SCAN_SUCCESS) {
                    this.setLastPlacesScraped(response.placesScraped);
                } else if (response.message === PAGE_SCAN_FAILED) {
                    // eslint-disable-next-line no-console
                    console.log('Error returned from content scripts!');
                } else {
                    // eslint-disable-next-line no-console
                    console.log(`Unknown message ${response} from content scripts!`);
                }
            })
            .catch(() => {
                this.setState({
                    reloadNeeded: true,
                });
            })
            .finally(() => {
                this.setState({ loading: false });
            });
    }

    renderPage() {
        const resultsPageProps = {
            setLastPlacesScraped: this.setLastPlacesScraped,
            setSelectedPlace: this.setSelectedPlace,
            onActivate: this.sendMessageToScrapePage,
            placesScraped: this.state.placesScraped,
            selectedPlace: this.state.selectedPlace,
            loading: this.state.loading,
            reloadNeeded: this.state.reloadNeeded,
        };

        switch (this.state.currentPage) {
            case pages.FEEDBACK:
                return <FeedbackForm />;
            case pages.ABOUT_US:
                return <AboutTeam />;
            default:
                // case RESULTS:
                return <ResultsPage {...resultsPageProps} />;
        }
    }

    render() {
        return (
            <div className="wanderland-popup">
                {this.state.loading ? <Loader /> : (
                    <div className={this.state.loading ? 'popup-loading' : ''}>
                        <PopupNavbar setPage={this.setPage} currentPage={this.state.currentPage} />
                        {this.renderPage()}
                    </div>
                )}
            </div>
        );
    }
}

export default Popup;
