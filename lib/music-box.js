/*
  A simple library to interface with the Music Box website.
*/

MusicBox = function () {
}

//
MusicBox.prototype.isFilmPage = function () {
  return window.location.pathname.split('/')[1] === 'films'
}

MusicBox.prototype.getFilmDetails = function (url) {
  return this.request(url).then(
    ((resp) => {
      return this._getFilmDataFromResp(resp)
    }).bind(this)
  )
}

MusicBox.prototype._getFilmDataFromResp = function (resp) {
  const doc = document.createRange().createContextualFragment(resp)

  const infoBlock = doc.querySelector('.technical-details')
  const trailerBlock = doc.querySelector('.trailer-link > a')

  const description = doc.querySelector(
    '.mbt-content .description'
  ).innerText.trim()

  let filmData = {
    title: doc.querySelector('.page-title').textContent.trim(),
    description: description,
    trailer: trailerBlock ? trailerBlock.getAttribute('href') : undefined
  }

  filmData = Object.assign(
    filmData, this._getTechDetailsFromBlock(infoBlock)
  )

  return filmData
}

MusicBox.prototype._getTechDetailsFromBlock = function (block) {
  const detailEles = block.querySelectorAll('.technical-info-item')
  let details = {}

  for (let i = 0; i < detailEles.length; i++) {
    let lblItems = detailEles[i].querySelector('span').innerText.trim().split(/\s+/)
    const lbl = lblItems[lblItems.length - 1].toLowerCase().replace(/[^\w]/g, '')

    details[lbl] = detailEles[i].innerText.split(/\:\s+/)[1]
  }

  return details
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
