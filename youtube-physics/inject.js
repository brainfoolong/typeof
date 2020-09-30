// inject required scripts into the page
(function () {
  let rootUrl = 'https://raw.githack.com/brainfoolong/typeof/master/youtube-physics'
  let script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = rootUrl + '/vendor/matter/matter.js?' + Math.random()
  document.getElementsByTagName('head')[0].appendChild(script)

  script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = rootUrl + '/script.js?' + Math.random()
  document.getElementsByTagName('head')[0].appendChild(script)

  alert('Script is ready')
})()