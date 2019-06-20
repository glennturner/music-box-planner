/*
  A simple library to interface with the Music Box website.
*/

MusicBox = function () {
}

MusicBox.prototype.isFilmPage = function () {
  return window.location.pathname.split('/')[1] === 'films'
}

/*
  @param url [String] the bsolute url to request
  @param params [Object]
    @attr method [String] contains the HTTP method (defaults to GET)

  @return [Promise]
*/
MusicBox.prototype.request = function (url, params) {
  params = params || {}
  params.url = url

  return new Promise(
    function(resolve, reject) {
      var req = new XMLHttpRequest
      var method = params.method || 'GET'
      var postData = params.data
      var contentType = params.contentType || 'text/html'

      // always send empty data
      if (method === 'POST' && !postData) {
        postData = ''
      }

      req.open(method, params.url, true)
      req.setRequestHeader('Content-Type', contentType)

      req.onreadystatechange = function () {
        if (req.readyState != 4) {
          return
        }

        if (req.status != 200 && req.status != 201 && req.status != 304) {
          reject(req.statusText)
        } else {
          resolve(req.response)
        }
      }

      if (req.readyState == 4) {
        return
      }

      req.send(postData)
    }
  )
}
