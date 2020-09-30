// listen to message from context script, return matched script files for given url
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    let matchedScripts = []
    chrome.storage.local.get(['scripts'], function (result) {
      if (result && result.scripts) {
        for (let i = 0; i < result.scripts.length; i++) {
          let scriptData = result.scripts[i]
          if (request.url.match(new RegExp(scriptData.urlRegex, 'i'))) {
            let urls = scriptData.scriptUrl.split('\n')
            for (let j = 0; j < urls.length; j++) {
              let url = urls[j].trim()
              if (url.length) {
                matchedScripts.push(url)
              }
            }
          }
        }
      }
      sendResponse({ 'scripts': matchedScripts })
    })
    return true
  })