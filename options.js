const blockedSitesList = document.getElementById('blocked-sites-list');
const siteInput = document.getElementById('site-input');
const addBtn = document.getElementById('add-btn');
const messageElement = document.getElementById('message');
let messageTimeout = null; // Variable to hold the timeout ID

// Load blocked sites from storage when the options page opens
document.addEventListener('DOMContentLoaded', loadBlockedSites);

// Add site when the button is clicked or Enter is pressed in the input
addBtn.addEventListener('click', addSite);
siteInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addSite();
    }
});

// Function to load blocked sites from storage
async function loadBlockedSites() { // Make async
    try {
        // Use Promise-based API
        const data = await chrome.storage.sync.get({ blockedSites: [] });
        renderBlockedSites(data.blockedSites);
    } catch (error) {
        console.error("Error loading blocked sites:", error);
        displayMessage("Failed to load blocked sites list.", true);
        // Clear the loading indicator in case of error
        blockedSitesList.innerHTML = '<li>Error loading list.</li>';
    }
}

// Function to render the list of blocked sites in the UI
function renderBlockedSites(blockedSites) {
    blockedSitesList.innerHTML = ''; // Clear current list (including loading indicator)
    if (!Array.isArray(blockedSites) || blockedSites.length === 0) {
        const li = document.createElement('li');
        li.textContent = "No sites blocked yet.";
        blockedSitesList.appendChild(li);
        return;
    }
    blockedSites.forEach(site => {
        const li = document.createElement('li');

        const siteSpan = document.createElement('span');
        siteSpan.textContent = site; // Display the site as stored
        li.appendChild(siteSpan);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.classList.add('remove-btn');
        removeBtn.setAttribute('aria-label', `Remove ${site}`); // Accessibility
        removeBtn.addEventListener('click', () => removeSite(site));

        li.appendChild(removeBtn);
        blockedSitesList.appendChild(li);
    });
}

// Function to add a new site to the blocked list
async function addSite() { // Make function async
    // Keep original casing from input, just trim whitespace
    let siteToAdd = siteInput.value.trim();

    if (!siteToAdd) {
        displayMessage('Please enter a website domain.', true);
        return;
    }

    // Improved domain validation (allows IDNs, basic structure check)
    // This regex is a reasonable balance, not foolproof for all edge cases.
    const domainPattern = /^(?:[a-z0-9\u00a1-\uffff](?:[a-z0-9\u00a1-\uffff-]{0,61}[a-z0-9\u00a1-\uffff])?\.)+[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff-]{0,61}[a-z0-9\u00a1-\uffff]$/i;
    if (!domainPattern.test(siteToAdd)) {
         displayMessage('Invalid domain format (e.g., example.com or sub.example.co.uk).', true);
         return;
    }

    try { // Use try/catch with async/await
        // Use the Promise-based version of storage API
        const data = await chrome.storage.sync.get({ blockedSites: [] });
        const blockedSites = data.blockedSites || []; // Ensure it's an array

        // Check for duplicates using case-insensitive comparison
        if (blockedSites.some(existingSite => existingSite.toLowerCase() === siteToAdd.toLowerCase())) {
            // Use the user's input casing in the message
            displayMessage(`"${siteToAdd}" is already on the blocked list.`, true);
            return;
        }

        // Add the original input casing
        const updatedBlockedSites = [...blockedSites, siteToAdd];

        await chrome.storage.sync.set({ blockedSites: updatedBlockedSites });
        displayMessage(`"${siteToAdd}" added successfully!`);
        siteInput.value = ''; // Clear input
        renderBlockedSites(updatedBlockedSites); // Re-render list immediately
        // Background script will automatically update rules via storage listener
    } catch (error) {
        console.error("Error adding site:", error);
        displayMessage('Error saving site. See console for details.', true);
    }
}

// Function to remove a site from the blocked list
async function removeSite(siteToRemove) { // Make function async
     try { // Use try/catch with async/await
        // Use the Promise-based version of storage API
        const data = await chrome.storage.sync.get({ blockedSites: [] });
        let blockedSites = data.blockedSites || []; // Ensure it's an array

        const initialLength = blockedSites.length;
        // Filter based on case-insensitive comparison for removal
        const updatedBlockedSites = blockedSites.filter(site => site.toLowerCase() !== siteToRemove.toLowerCase());

        if (updatedBlockedSites.length < initialLength) {
             await chrome.storage.sync.set({ blockedSites: updatedBlockedSites });
             displayMessage(`"${siteToRemove}" removed successfully.`);
             renderBlockedSites(updatedBlockedSites); // Re-render list immediately
             // Background script will automatically update rules via storage listener
        } else {
            // This case should ideally not happen if the button corresponds to an existing item
            console.warn(`Attempted to remove "${siteToRemove}" but it was not found.`);
            displayMessage(`"${siteToRemove}" was not found in the list.`, true);
        }
     } catch (error) {
        console.error("Error removing site:", error);
        displayMessage('Error removing site. See console for details.', true);
     }
}

// Function to display messages and automatically clear them
function displayMessage(message, isError = false) {
    // Clear any existing timeout to prevent message flickering
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }

    messageElement.textContent = message;
    // Use distinct classes for styling success and error messages
    messageElement.className = isError ? 'error' : 'success';

    // Set timeout to clear the message after 3 seconds
    messageTimeout = setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = ''; // Clear class
        messageTimeout = null; // Reset timeout ID
    }, 3000); // 3000 milliseconds = 3 seconds
}