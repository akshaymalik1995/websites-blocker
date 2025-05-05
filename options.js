const blockedSitesList = document.getElementById('blocked-sites-list');
const siteInput = document.getElementById('site-input');
const addBtn = document.getElementById('add-btn');
const messageElement = document.getElementById('message');

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
function loadBlockedSites() {
    chrome.storage.sync.get({blockedSites: []}, function(data) {
        const blockedSites = data.blockedSites;
        renderBlockedSites(blockedSites);
    });
}

// Function to render the list of blocked sites in the UI
function renderBlockedSites(blockedSites) {
    blockedSitesList.innerHTML = ''; // Clear current list
    if (blockedSites.length === 0) {
        const li = document.createElement('li');
        li.textContent = "No sites blocked yet.";
        blockedSitesList.appendChild(li);
        return;
    }
    blockedSites.forEach(site => {
        const li = document.createElement('li');
        li.textContent = site;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.classList.add('remove-btn');
        removeBtn.addEventListener('click', () => removeSite(site));

        li.appendChild(removeBtn);
        blockedSitesList.appendChild(li);
    });
}

// Function to add a new site to the blocked list
function addSite() {
    let siteToAdd = siteInput.value.trim().toLowerCase();

    // Remove www. prefix if present
    if (siteToAdd.startsWith('www.')) {
        siteToAdd = siteToAdd.substring(4);
    }

    if (!siteToAdd) {
        displayMessage('Please enter a valid website.', true);
        return;
    }

    // Basic validation: check if it looks like a domain
    if (!siteToAdd.includes('.') || siteToAdd.startsWith('.') || siteToAdd.endsWith('.')) {
         displayMessage('Please enter a domain name (e.g., example.com).', true);
         return;
    }

    chrome.storage.sync.get({blockedSites: []}, function(data) {
        const blockedSites = data.blockedSites;

        if (blockedSites.includes(siteToAdd)) {
            displayMessage(`"${siteToAdd}" is already on the blocked list.`, true);
            return;
        }

        blockedSites.push(siteToAdd);

        chrome.storage.sync.set({blockedSites: blockedSites}, function() {
            displayMessage(`"${siteToAdd}" added successfully!`);
            siteInput.value = ''; // Clear input
            renderBlockedSites(blockedSites); // Re-render list
            // The background script listens for storage changes to update blocking rules
        });
    });
}

// Function to remove a site from the blocked list
function removeSite(siteToRemove) {
    chrome.storage.sync.get({blockedSites: []}, function(data) {
        let blockedSites = data.blockedSites;

        const initialLength = blockedSites.length;
        blockedSites = blockedSites.filter(site => site !== siteToRemove);

        if (blockedSites.length < initialLength) {
             chrome.storage.sync.set({blockedSites: blockedSites}, function() {
                displayMessage(`"${siteToRemove}" removed successfully.`);
                renderBlockedSites(blockedSites); // Re-render list
                // The background script listens for storage changes to update blocking rules
            });
        } else {
             displayMessage(`Error: "${siteToRemove}" not found in the list.`, true);
        }
    });
}

// Function to display messages to the user
function displayMessage(message, isError = false) {
    messageElement.textContent = message;
    messageElement.className = isError ? 'error' : '';
    // Optional: Clear message after a few seconds
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = '';
    }, 3000);
}