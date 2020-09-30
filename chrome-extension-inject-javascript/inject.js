// content script - does inject defined user scripts into page
chrome.runtime.sendMessage({ 'action': 'get-scripts', 'url': window.location.href }, function (response) {
  if (response.scripts) {
    let head = document.getElementsByTagName('head')[0]
    for (let i = 0; i < response.scripts.length; i++) {
      let scriptUrl = response.scripts[i]
      let script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = scriptUrl + '?rand=' + Math.random()
      head.appendChild(script)
    }
  }
})