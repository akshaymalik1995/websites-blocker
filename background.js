// Listen for changes in storage (when options page saves)
chrome.storage.onChanged.addListener(function(changes, namespace) {
    // Check if blockedSites changed in the sync storage area
    if (namespace === 'sync' && changes.blockedSites) {
        // Use the new value, or an empty array if it was removed/cleared
        const newBlockedSites = changes.blockedSites.newValue || [];
        console.log('Storage changed, updating rules...');
        updateDeclarativeNetRequestRules(newBlockedSites);
    }
});

// Update declarativeNetRequest rules based on the blocked sites list
async function updateDeclarativeNetRequestRules(blockedSites) {
    let currentRules;
    try {
        currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    } catch (error) {
        console.error("Error getting current dynamic rules:", error);
        return; // Cannot proceed without current rules
    }

    const currentRuleIds = currentRules.map(rule => rule.id);

    // Ensure blockedSites is an array
    const sitesToBlock = Array.isArray(blockedSites) ? blockedSites : [];

    const newRules = sitesToBlock
        .filter(site => typeof site === 'string' && site.trim() !== '') // Filter out invalid entries
        .map((site, index) => ({
            id: index + 1, // Rule IDs must be positive integers
            priority: 1,
            action: {
                type: "block"
                // To redirect instead:
                // type: "redirect",
                // redirect: { extensionPath: "/blocked.html" }
            },
            condition: {
                // requestDomains handles the domain and all subdomains (e.g., example.com, www.example.com)
                // It's case-insensitive by default.
                requestDomains: [site.trim()],
                resourceTypes: [
                  "main_frame" // Block top-level navigation
                ]
            }
        }));

    const newRuleIds = newRules.map(rule => rule.id);

    // Calculate IDs to remove: existing IDs not present in the new set
    // Note: Since we regenerate IDs starting from 1, this comparison might not be
    // strictly necessary if we always remove all old rules first.
    const ruleIdsToRemove = currentRuleIds; // Simpler: just remove all existing dynamic rules

    try {
         // Remove all existing dynamic rules first
         if (ruleIdsToRemove.length > 0) {
             await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIdsToRemove
             });
             console.log('Removed old rules:', ruleIdsToRemove);
         } else {
             console.log('No old rules to remove.');
         }


         // Add all new rules if there are any
         if (newRules.length > 0) {
             await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: newRules
             });
             console.log('Added new rules:', newRules.map(r => r.id));
         } else {
             console.log('No new rules to add.');
         }

         console.log('DeclarativeNetRequest rules updated successfully.');
         console.log('Current blocked domains:', sitesToBlock);

    } catch (error) {
        // Log the error and potentially provide user feedback if possible
        console.error('Failed to update declarativeNetRequest rules:', error);
        // Consider using chrome.notifications API here if appropriate
    }
}

// Helper function to load sites and update rules
async function loadSitesAndUpdateRules() {
    try {
        const data = await chrome.storage.sync.get({ blockedSites: [] });
        console.log('Loaded blocked sites from storage:', data.blockedSites);
        await updateDeclarativeNetRequestRules(data.blockedSites);
    } catch (error) {
        console.error('Error loading blocked sites on startup/install:', error);
    }
}

// Initial load of rules when the service worker starts (e.g., browser startup)
chrome.runtime.onStartup.addListener(() => {
    console.log('Browser startup detected, loading blocked sites...');
    loadSitesAndUpdateRules();
});

// Also load rules when the extension is first installed or updated
chrome.runtime.onInstalled.addListener((details) => {
     console.log(`Extension ${details.reason}, loading blocked sites...`);
     loadSitesAndUpdateRules();
});

// Optional: Load rules immediately when the script context is created.
// This can sometimes run earlier than onStartup/onInstalled depending on timing.
// console.log('Service worker initializing, loading blocked sites...');
// loadSitesAndUpdateRules(); // Call directly as well