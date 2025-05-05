// Listen for changes in storage (when options page saves)
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && changes.blockedSites) {
        const newBlockedSites = changes.blockedSites.newValue || [];
        updateDeclarativeNetRequestRules(newBlockedSites);
    }
});

// Update declarativeNetRequest rules based on the blocked sites list
async function updateDeclarativeNetRequestRules(blockedSites) {
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const currentRuleIds = currentRules.map(rule => rule.id);

    const newRules = blockedSites.map((site, index) => ({
        id: index + 1, // Rule IDs must be unique integers
        priority: 1,
        action: {
            type: "block" // Or "redirect" as shown below
            /*
            // Option 2: Redirect to a custom blocked page
            "type": "redirect",
            "redirect": {
              "extensionPath": "/blocked.html" // Path to your blocked page
            }
            */
        },
        condition: {
            // Use requestDomains to match the domain and all its subdomains
            requestDomains: [site],
            resourceTypes: [
              "main_frame" // Only block the main document request
              // You could add other types like "script", "image", etc. if needed
            ]
        }
    }));

    const newRuleIds = newRules.map(rule => rule.id);

    // Determine rules to remove (those no longer in the new list)
    const ruleIdsToRemove = currentRuleIds.filter(id => !newRuleIds.includes(id));

    // Determine rules to add (those in the new list that aren't current)
    // This requires a bit more logic to handle updates properly.
    // A simpler approach is to remove all dynamic rules and add the new set.
    // This is fine for a list of this size.

    try {
         // Remove all existing dynamic rules
         await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: currentRuleIds
         });

         // Add all new rules
         if (newRules.length > 0) {
             await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: newRules
             });
         }
         console.log('DeclarativeNetRequest rules updated.');
         console.log('Blocked sites:', blockedSites);

    } catch (error) {
        console.error('Failed to update declarativeNetRequest rules:', error);
    }
}

// Initial load of rules when the service worker starts
// This handles cases where the browser was closed and reopened
chrome.runtime.onStartup.addListener(() => {
    console.log('Service worker starting up, loading blocked sites...');
     chrome.storage.sync.get({blockedSites: []}, function(data) {
        updateDeclarativeNetRequestRules(data.blockedSites);
    });
});

// Also load rules when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
     console.log('Extension installed or updated, loading blocked sites...');
     chrome.storage.sync.get({blockedSites: []}, function(data) {
        updateDeclarativeNetRequestRules(data.blockedSites);
    });
});

// Initial load when the service worker *might* become active (e.g., first browser window opened)
// Although onStartup and onInstalled cover most cases, adding this is belt-and-suspenders.
// chrome.storage.sync.get({blockedSites: []}, function(data) {
//    updateDeclarativeNetRequestRules(data.blockedSites);
// }); // This line is potentially redundant with onStartup/onInstalled but doesn't hurt.