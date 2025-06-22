// Queue to manage sequential rule updates
let ruleUpdateQueue = Promise.resolve();

// Initialize blocked URLs from storage or set default
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['blockedUrls'], (result) => {
    if (!result.blockedUrls) {
      const defaultUrls = [
        "*://*.instagram.com/*"
      ];
      chrome.storage.sync.set({ blockedUrls: defaultUrls }, () => {
        queueRuleUpdate(defaultUrls);
      });
    } else {
      queueRuleUpdate(result.blockedUrls);
    }
  });
});

// Listen for changes to blocked URLs and update rules
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.blockedUrls) {
    queueRuleUpdate(changes.blockedUrls.newValue);
  }
});

// Function to queue rule updates to avoid concurrent modifications
function queueRuleUpdate(blockedUrls) {
  ruleUpdateQueue = ruleUpdateQueue.then(() => updateDeclarativeNetRequestRules(blockedUrls));
  return ruleUpdateQueue;
}

// Function to update declarativeNetRequest rules
async function updateDeclarativeNetRequestRules(blockedUrls) {
  try {
    // Get existing rule IDs
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map(rule => rule.id);

    // Clear existing rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeRuleIds
    });

    // Generate new rules with unique IDs, starting from a safe offset
    const maxExistingId = Math.max(0, ...existingRules.map(rule => rule.id), 0);
    const rules = blockedUrls.map((url, index) => ({
      id: maxExistingId + index + 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          extensionPath: "/blocked.html"
        }
      },
      condition: {
        urlFilter: url,
        resourceTypes: ["main_frame"]
      }
    }));

    // Add new rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules
    });

    console.log('Successfully updated rules:', rules);
  } catch (error) {
    console.error('Error updating declarativeNetRequest rules:', error);
  }
}