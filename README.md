# Custom Website Blocker Chrome Extension

A simple Chrome extension to block access to a user-defined list of websites.

## Features

*   **Block Custom Websites:** Add any website domain (e.g., `example.com`) to your blocklist.
*   **Simple Options Page:** Easily add or remove websites from the blocklist via the extension's options page.
*   **Efficient Blocking:** Uses Chrome's `declarativeNetRequest` API for efficient blocking without intercepting network requests directly.
*   **Persistence:** Your blocklist is saved using `chrome.storage.sync`, making it available across your synced browsers.

## Installation (for Development/Testing)

1.  **Download or Clone:** Get the extension files onto your local machine.
2.  **Open Chrome Extensions:** Open Google Chrome, navigate to `chrome://extensions/`.
3.  **Enable Developer Mode:** Toggle the "Developer mode" switch in the top-right corner.
4.  **Load Unpacked:** Click the "Load unpacked" button.
5.  **Select Folder:** Navigate to and select the directory containing the extension's files (the folder with `manifest.json`).
6.  The extension icon should now appear in your Chrome toolbar.

## Usage

1.  **Access Options:** Right-click the extension icon in your toolbar and select "Options", or navigate to `chrome://extensions/`, find the "Custom Website Blocker", click "Details", and then "Extension options".
2.  **Add a Site:** Enter the domain name of the website you want to block (e.g., `distracting-site.com`) into the input field and click "Add Site" or press Enter. The `www.` prefix is automatically handled.
3.  **Remove a Site:** Click the "Remove" button next to the site you want to unblock in the list.
4.  Changes take effect immediately. Blocked sites will be inaccessible.

## Project Files

*   `manifest.json`: The core file defining the extension's properties, permissions, and components.
*   `background.js`: The service worker that listens for changes in the blocklist (from `options.js`) and updates the blocking rules using the `declarativeNetRequest` API. It also loads the rules when the browser starts or the extension is installed/updated.
*   `options.html`: The structure for the extension's options page.
*   `options.js`: Handles the logic for the options page, allowing users to add/remove sites from the blocklist stored in `chrome.storage.sync`.
*   `blocked.html`: (Optional - currently commented out in `background.js`) A simple page that could be shown instead of the default browser error when a site is blocked.
*   `icons/`: Contains the extension icons for different sizes.

## Permissions Explained

*   `storage`: Required to save and retrieve the user's list of blocked websites using `chrome.storage.sync`.
*   `declarativeNetRequest`: Allows the extension to define rules for blocking network requests without needing to intercept and read the content of the requests, which is more performant and privacy-preserving.
*   `host_permissions: ["<all_urls>"]`: Necessary for the `declarativeNetRequest` API to apply blocking rules to *any* website the user might try to visit based on the blocklist. The extension does *not* read content from these sites; it only uses this permission to tell Chrome which sites *can* be subject to blocking rules.
