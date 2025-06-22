let ruleUpdateQueue = Promise.resolve();

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

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.blockedUrls) {
    queueRuleUpdate(changes.blockedUrls.newValue);
  }
});

function queueRuleUpdate(blockedUrls) {
  ruleUpdateQueue = ruleUpdateQueue.then(() => updateDeclarativeNetRequestRules(blockedUrls));
  return ruleUpdateQueue;
}


async function updateDeclarativeNetRequestRules(blockedUrls) {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map(rule => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeRuleIds
    });

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

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules
    });

    console.log('Successfully updated rules:', rules);
  } catch (error) {
    console.error('Error updating declarativeNetRequest rules:', error);
  }
}