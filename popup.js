document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');
  loadUrls();
});

document.getElementById('addUrl').addEventListener('click', async () => {
  console.log('Add URL button clicked in popup');
  const urlInput = document.getElementById('urlInput');
  const url = urlInput.value.trim();
  if (!url) {
    alert('Please enter a URL pattern.');
    console.log('Add failed: Empty URL');
    return;
  }
  if (!isValidUrlPattern(url)) {
    alert('Invalid URL pattern. Use format like *://*.example.com/*');
    console.log('Add failed: Invalid URL pattern:', url);
    return;
  }
  try {
    const { blockedUrls = [] } = await chrome.storage.sync.get(['blockedUrls']);
    if (blockedUrls.includes(url)) {
      alert('URL pattern already exists!');
      console.log('Add failed: Duplicate URL:', url);
      return;
    }
    blockedUrls.push(url);
    await chrome.storage.sync.set({ blockedUrls });
    console.log('URL added:', url);
    urlInput.value = '';
    loadUrls();
  } catch (error) {
    console.error('Error adding URL:', error);
    alert('Failed to add URL. Check console for details.');
  }
});

async function loadUrls() {
  try {
    const { blockedUrls = [] } = await chrome.storage.sync.get(['blockedUrls']);
    console.log('Loading URLs in popup:', blockedUrls);
    const urlList = document.getElementById('urlList');
    urlList.innerHTML = '';
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
        console.log('Edit button clicked in popup for index:', index);
        editUrl(index);
      });
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'));
        console.log('Delete button clicked in popup for index:', index);
        deleteUrl(index);
      });
    });
  } catch (error) {
    console.error('Error loading URLs:', error);
    alert('Failed to load URLs. Check console for details.');
  }
}

async function editUrl(index) {
  try {
    const { blockedUrls = [] } = await chrome.storage.sync.get(['blockedUrls']);
    const currentUrl = blockedUrls[index];
    const newUrl = prompt('Edit URL pattern:', currentUrl);
    if (!newUrl) {
      console.log('Edit cancelled or no input provided');
      return;
    }
    if (!isValidUrlPattern(newUrl)) {
      alert('Invalid URL pattern. Use format like *://*.example.com/*');
      console.log('Edit failed: Invalid URL pattern:', newUrl);
      return;
    }
    if (blockedUrls.includes(newUrl) && newUrl !== currentUrl) {
      alert('URL pattern already exists!');
      console.log('Edit failed: Duplicate URL:', newUrl);
      return;
    }
    blockedUrls[index] = newUrl;
    await chrome.storage.sync.set({ blockedUrls });
    console.log('URL edited:', { old: currentUrl, new: newUrl });
    loadUrls();
  } catch (error) {
    console.error('Error editing URL:', error);
    alert('Failed to edit URL. Check console for details.');
  }
}

async function deleteUrl(index) {
  try {
    const { blockedUrls = [] } = await chrome.storage.sync.get(['blockedUrls']);
    const deletedUrl = blockedUrls.splice(index, 1)[0];
    await chrome.storage.sync.set({ blockedUrls });
    console.log('URL deleted in popup:', deletedUrl);
    loadUrls();
  } catch (error) {
    console.error('Error deleting URL:', error);
    alert('Failed to delete URL. Check console for details.');
  }
}

function isValidUrlPattern(url) {
  const pattern = /^(\*|\w+):\/\/(\*|\w+\.)*[\w-]+(:\d+)?\/(\*|\w+)$/;
  const isValid = pattern.test(url);
  console.log('Validating URL in popup:', url, 'Result:', isValid);
  return isValid;
}