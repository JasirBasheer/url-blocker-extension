document.addEventListener('DOMContentLoaded', () => {
  console.log('Options page loaded');
  loadUrls();
});

document.getElementById('addUrl').addEventListener('click', () => {
  console.log('Add URL button clicked');
  const urlInput = document.getElementById('urlInput');
  const url = urlInput.value.trim();
  if (!url) {
    alert('Please enter a URL pattern.');
    return;
  }
  if (!isValidUrlPattern(url)) {
    alert('Invalid URL pattern. Use format like *://*.example.com/*');
    return;
  }
  chrome.storage.sync.get(['blockedUrls'], (result) => {
    const blockedUrls = result.blockedUrls || [];
    if (blockedUrls.includes(url)) {
      alert('URL pattern already exists!');
      return;
    }
    blockedUrls.push(url);
    chrome.storage.sync.set({ blockedUrls }, () => {
      console.log('URL added:', url);
      urlInput.value = '';
      loadUrls();
    });
  });
});

function loadUrls() {
  chrome.storage.sync.get(['blockedUrls'], (result) => {
    console.log('Loading URLs:', result.blockedUrls);
    const urlList = document.getElementById('urlList');
    urlList.innerHTML = '';
    const blockedUrls = result.blockedUrls || [];
    blockedUrls.forEach((url, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${url}</span>
        <div>
          <button class="edit-btn" data-index="${index}">Edit</button>
          <button class="delete-btn" data-index="${index}">Delete</button>
        </div>
      `;
      urlList.appendChild(li);
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'));
        console.log('Edit button clicked for index:', index);
        editUrl(index);
      });
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'));
        console.log('Delete button clicked for index:', index);
        deleteUrl(index);
      });
    });
  });
}


function editUrl(index) {
  chrome.storage.sync.get(['blockedUrls'], (result) => {
    const blockedUrls = result.blockedUrls || [];
    const currentUrl = blockedUrls[index];
    const newUrl = prompt('Edit URL pattern:', currentUrl);
    if (!newUrl) {
      console.log('Edit cancelled or no input provided');
      return;
    }
    if (!isValidUrlPattern(newUrl)) {
      alert('Invalid URL pattern. Use format like *://*.example.com/*');
      return;
    }
    if (blockedUrls.includes(newUrl) && newUrl !== currentUrl) {
      alert('URL pattern already exists!');
      return;
    }
    blockedUrls[index] = newUrl;
    chrome.storage.sync.set({ blockedUrls }, () => {
      console.log('URL edited:', { old: currentUrl, new: newUrl });
      loadUrls();
    });
  });
}

function deleteUrl(index) {
  chrome.storage.sync.get(['blockedUrls'], (result) => {
    const blockedUrls = result.blockedUrls || [];
    const deletedUrl = blockedUrls.splice(index, 1)[0];
    chrome.storage.sync.set({ blockedUrls }, () => {
      console.log('URL deleted:', deletedUrl);
      loadUrls();
    });
  });
}

function isValidUrlPattern(url) {
  const pattern = /^(\*|\w+):\/\/(\*|\w+\.)*[\w-]+(:\d+)?\/(\*|\w+)$/;
  const isValid = pattern.test(url);
  console.log('Validating URL:', url, 'Result:', isValid);
  return isValid;
}