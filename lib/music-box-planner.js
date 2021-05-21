MusicBoxPlanner = function () {
  // Protected.
  this._mb = new MusicBox
  this._calendarContClass = 'mb-planner-calendar'
  this._gCalWindowName = 'mb-gcal'
  this._loadingClassName = 'music-box-planner-loading'
  this._showtimeAddToGCalClass = 'showtime-add-to-calendar'
  this._showtimesBlockClass = 'view-showtime-blocks'
  this._showtimesClass = 'showtimes'
  this._showtimesCalendarClass = 'showtimes-calendar'
  this._showtimesBlockClass = 'view-showtime-blocks'
  this._showtimesDateClass = 'showtimes-date'
  this._showRoomClass = 'showtime-room'
  this._foundRoomClass = 'showtime-room-found'

  this._showWatchers = []
}

MusicBoxPlanner.prototype.displayPlanner = function () {
  this._stopWatchingShowtimes()
  this._injectCalendar()

  if (this._hasShowtimes()) {
    this._injectShowtimeExtras()
    this._addShowtimeEvents()
  }

  this._watchShowtimes()
}

// Protected

// Retrieve the requested date from the page.
MusicBoxPlanner.prototype._getDate = function(year) {
  let date
  let showtimesDateBlocks = document.getElementsByClassName(
    this._showtimesBlockClass
  )

  for (let z = 0; z < showtimesDateBlocks.length; z++) {
    let showtimesDateBlock = showtimesDateBlocks[z]

    // There are currently two calendars so, for now, we just get the date
    // from the visible calendar.
    const computedDateBlack = window.getComputedStyle(showtimesDateBlock.parentElement)
    if (computedDateBlack.getPropertyValue('display') === 'none') {
      continue
    }

    let showtimesDate = showtimesDateBlock.getElementsByClassName(
      this._showtimesDateClass
    )

    if (showtimesDate.length) {
      for (let i = 0; i < showtimesDate.length; i++) {
        let showtimeDateContent = showtimesDate[i].textContent.trim().split(',')[1]
        if (showtimeDateContent.length) {
          let foundDate = (
            showtimeDateContent + ' ' + year
          ).replace(/\s(\d{1,})\w+\s/g, ' $1 ')

          if (foundDate) {
            date = foundDate
            break
          }
        }
      }
    }
  }

  return date
}

MusicBoxPlanner.prototype._formatDate = function (date) {
  const mon = date.getMonth() + 1
  const month = mon < 10 ? '0' + mon : mon
  const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()

  return [date.getFullYear(), month, day].join('-')
}

MusicBoxPlanner.prototype._getDateFromShowtimes = function () {
  const today = new Date
  let year = today.getFullYear()

  // Scrape the date.
  let dateStr = this._getDate(year)
  const parsedDate = new Date(Date.parse(dateStr))

  // Compensate for 'next year'.
  if (parsedDate.getMonth() < today.getMonth()) {
    dateStr = this._getDate(year + 1)
  }

  return this._formatDate(new Date(parsedDate))
}

MusicBoxPlanner.prototype._injectCalendar = function () {
  const showtimesDate = this._getDateFromShowtimes()
  const parsedDate = new Date(Date.parse(showtimesDate + ' 12:00:00'))

  const calendarHTML = parsedDate.getDay().wdayName() + `,
    <span
      class="${this._calendarContClass}"
      style="background-image: url(${chrome.runtime.getURL('images/spinner.svg')});"
    >
      <input type="date"
        name="` + this._showtimesCalendarClass + `"
        class="` + this._showtimesCalendarClass + `"
        value="` + showtimesDate + `"
        max="` + this._formatDate(
          new Date(parsedDate.getFullYear() + 1, 11, 31)
        ) + `"
        min="` + this._formatDate(new Date) + `"
        data-set-date="${showtimesDate}"
      />
    </span>`

  let showtimeDateEles = []
  let showtimeEles = document.getElementsByClassName(
      this._showtimesBlockClass
  )

  for (let i = 0; i < showtimeEles.length; i++) {
    let foundEles = showtimeEles[i].getElementsByClassName(this._showtimesDateClass)
    for (let j = 0; j < foundEles.length; j++) {
      showtimeDateEles.push(foundEles[j])
    }
  }

  for (let i = 0; i < showtimeDateEles.length; i++) {
    if (!showtimeDateEles[i].getElementsByClassName(
      this._showtimesCalendarClass
    ).length) {
      showtimeDateEles[i].innerHTML = calendarHTML
    }
  }
}

MusicBoxPlanner.prototype._injectCalendarLoader = function () {
  let cals = document.getElementsByClassName(this._calendarContClass)

  for (let i = 0; i < cals.length; i++) {
    cals[i].style.backgroundImage = "url('" + chrome.runtime.getURL('images/spinner.svg') + "')"
    cals[i].classList.add(this._loadingClassName)
  }
}

MusicBoxPlanner.prototype._injectShowtimeExtras = function () {
  let showtimes = this._getFutureShowtimesEles()

  showtimes.forEach(showtime => {
    let eventUrl = this._getEventUrlFromBlock(showtime)
    let ticketUrl = this._getTicketUrlFromBlock(showtime)
    let showtimeTitle = showtime.querySelectorAll('.showtime')[0]
    let showtimeStartTs = this._getStartTimeFromBlock(showtime)

    if (
      !showtimeTitle.getElementsByClassName(this._showRoomClass).length
    ) {
      const showtimeData = this._mb.isFilmPage() ?
        this._getDataFromPage(showtime) : this._getDataFromShowtimeBlock(showtime)

      let showRoomHTML = `<br /><a
        href="${ticketUrl}" class="purchase ${this._showRoomClass}"
        >Which Screen?</a>`

      showtimeTitle.innerHTML += showRoomHTML
      showtime.innerHTML += `<a href="${eventUrl}"
        class="${this._showtimeAddToGCalClass}"
        title="Add To Google Calendar"
        data-starts-at="${showtimeStartTs}"
        >
        <img
          src="` + chrome.runtime.getURL('images/google-cal-icon.svg') + `"
          class="showtimes-add-to-calendar-icon"
          style="vertical-align: middle;"
        />
      </a>`
    }
  })
}

MusicBoxPlanner.prototype._getDataFromPage = function (showtime) {
  let data = {}

  // Get requested showtime data, too.
  if (showtime) {
    data = this._getDataFromShowtimeBlock(showtime)
  }

  // Override title.
  const titleEle = document.querySelector(
    '.view-film-info .film-title'
  )

  if (titleEle) {
    data.title = titleEle.textContent.trim()
  }

  return data
}

MusicBoxPlanner.prototype._getDataFromShowtimeBlock = function (showtimeEle) {
  // Slop: this should check to see if it's a film page,
  // then use `MusicBox` to get the film details.
  const titleEle = showtimeEle.querySelector('.film-title a')
  const title = titleEle ? titleEle.textContent.trim() : document.querySelector('.film-title').textContent.trim()

  return {
    title: title,
    startsAt: showtimeEle.querySelector('.time .date-display-single').getAttribute('content')
  }
}

MusicBoxPlanner.prototype._getEventUrlFromBlock = function (showtime) {
  const showtimeEventEle = showtime.querySelector('.film-title > a')

  return showtimeEventEle ? showtimeEventEle.href : window.location.href
}

MusicBoxPlanner.prototype._getTicketUrlFromBlock = function (showtime) {
  let urls = showtime.querySelectorAll(`.${this._showtimesBlockClass} a`)
  // Always use the last url.
  return urls[urls.length - 1].href
}

MusicBoxPlanner.prototype._getStartTimeFromBlock = function (showtime) {
  return showtime.querySelector(
    `.${this._showtimesBlockClass} .date-display-single`
  ).getAttribute('content')
}

MusicBoxPlanner.prototype._hasShowtimes = function () {
  return document.querySelectorAll(
    `.${this._showtimesBlockClass} .${this._showtimesClass} > div[class$="-showtime"]`
  ).length > 0
}

MusicBoxPlanner.prototype._hasSeatsRemaining = function (resp) {
  const seatsRemaining = resp.querySelector('.seats-remaining > h2')

  if (seatsRemaining) {
    return seatsRemaining.innerText
  }
}

// Only retrieves future showtimes.
MusicBoxPlanner.prototype._getFutureShowtimesEles = function () {
  return document.querySelectorAll(`.${this._showtimesBlockClass} div.future-showtime`)
}

MusicBoxPlanner.prototype._addShowtimeEvents = function() {
  this._addShowRoomLinkEvents()
  this._addShowtimesCalendarEvents()
  this._addShowtimesGCalEvents()
}

MusicBoxPlanner.prototype._addShowRoomLinkEvents = function () {
  let links = document.getElementsByClassName(this._showRoomClass)

  for (let i = 0; i < links.length; i++) {
    links[i].removeEventListener('click', this._onScreenRequest.bind(this))
    links[i].addEventListener('click', this._onScreenRequest.bind(this))
  }
}

MusicBoxPlanner.prototype._addShowtimesCalendarEvents = function () {
  let calendars = document.getElementsByClassName(this._showtimesCalendarClass)

  for (let i = 0; i < calendars.length; i++) {
    calendars[i].removeEventListener('change', this._onCalendarChange.bind(this))
    calendars[i].addEventListener('change', this._onCalendarChange.bind(this))
  }
}

MusicBoxPlanner.prototype._addShowtimesGCalEvents = function () {
  let calendars = document.getElementsByClassName(this._showtimeAddToGCalClass)

  for (let i = 0; i < calendars.length; i++) {
    calendars[i].removeEventListener('click', this._onGCalClick.bind(this))
    calendars[i].addEventListener('click', this._onGCalClick.bind(this))
  }
}

MusicBoxPlanner.prototype._onCalendarChange = function (ev) {
  const selectedValue = ev.target.value
  const selectedDate = new Date(Date.parse(selectedValue))
  const today = new Date

  if (selectedValue && selectedDate >= today) {
    this._injectCalendarLoader()
    ev.target.setAttribute('readonly', true)
    ev.target.setAttribute('disabled', true)
    window.location = window.location.href.split('?')[0] + '?date=' + ev.target.value
  }
}

MusicBoxPlanner.prototype._onLoadingStart = function (target) {
  target.style.backgroundImage = "url('" + chrome.runtime.getURL('images/spinner.svg') + "')"
  target.classList.add(this._loadingClassName)
}

MusicBoxPlanner.prototype._onLoadingEnd = function (target) {
  target.style.backgroundImage = ""
  target.classList.remove(this._loadingClassName)
}

MusicBoxPlanner.prototype._onGCalClick = function (ev) {
  ev.preventDefault()
  let currentTarget = ev.currentTarget
  this._onLoadingStart(currentTarget)

  this._mb.getFilmDetails(
    currentTarget.href
  ).then(
    (details) => {
      details['starts_at'] = new Date(
        Date.parse(currentTarget.dataset.startsAt)
      ).toJSON()
      details['ends_at'] = new Date(Date.parse(currentTarget.dataset.startsAt))

      let endsAt = new Date(Date.parse(details['starts_at']))
      const endsAtMin = parseInt(details.time.replace(/^.*?(\d+).*?$/, '$1'))
      details['ends_at'].setMinutes(
        details['ends_at'].getMinutes() + endsAtMin
      )
      details['ends_at'] = details['ends_at'].toJSON()

      const gCalUrl = this._assembleGCalUrlFromEventDetails(details)

      window.open(gCalUrl, this._gCalWindowName)
    },
    (err) => {
      console.error('ERR')
      console.error(err)
    }
  ).finally(
    (() => {
      this._onLoadingEnd(currentTarget)
    }).bind(this)
  )
}

MusicBoxPlanner.prototype._onScreenRequest = function (ev) {
  ev.preventDefault()
  ev.stopPropagation()

  let currentTarget = ev.currentTarget
  let originalInnerText = currentTarget.innerText
  currentTarget.innerText = 'Finding...'

  this._mb.request(
    currentTarget.href
  ).then(
    ((resp) => {
      let frag = document.createRange().createContextualFragment(resp)
      let eles = frag.querySelectorAll('.view-add-tickets .showtime-info > div:last-child')

      if (eles.length) {
        let showtimeEle = currentTarget.parentElement.parentElement

        currentTarget.innerText = eles[0].innerText
        currentTarget.classList.add(this._foundRoomClass)

        const remainingSeats = this._hasSeatsRemaining(frag)
        if (remainingSeats) {
          showtimeEle.querySelector('.showtime .purchase').innerText = remainingSeats
        }
      } else {
        currentTarget.innerText = 'Unknown!'
      }
    }).bind(this),
    (err) => {
      console.error('ERR')
      console.error(err)
    }
  )
}

MusicBoxPlanner.prototype._onScheduleChange = function () {
  this.displayPlanner()
}

// Watch showtime blocks for changes. If so, we assume that the date has changed.
MusicBoxPlanner.prototype._watchShowtimes = function () {
  this._stopWatchingShowtimes()

  const nodes = document.getElementsByClassName(this._showtimesBlockClass)
  for (let i = 0; i < nodes.length; i++) {
    this._showWatchers.push(
      new MutationObserver(this._onScheduleChange.bind(this))
    )

    this._showWatchers[i].observe(nodes[i], {
      childList: true,
      subtree: true
    });
  }
}

MusicBoxPlanner.prototype._stopWatchingShowtimes = function () {
  for (let i = 0; i < this._showWatchers.length; i++) {
    this._showWatchers[i].disconnect()
  }

  this._showWatchers = []
}

MusicBoxPlanner.prototype._assembleGCalUrlFromEventDetails = function (details) {
  details['location'] = 'Music Box Theatre, 3733 N Southport Ave, Chicago, IL 60613, USA'
  details['details'] = this._assembleEventDetails(details)
  details['action'] = 'TEMPLATE'

  // Format timestamp.
  const dateRegex = /\.\d{3}|[^\d^\w]/g
  details['dates'] = details['starts_at'].replace(dateRegex, '') + '/' + details['ends_at'].replace(dateRegex, '')
  details['text'] = details['title']

  let keys = ['action', 'dates', 'text', 'location', 'details']
  let argvs = []
  for (let i = 0; i < keys.length; i++) {
    argvs.push(
      [
        keys[i], encodeURIComponent(details[keys[i]])
      ].join('=')
    )
  }

  const gCalUrl = `http://www.google.com/calendar/event?` + argvs.join('&')
  return gCalUrl
}

MusicBoxPlanner.prototype._assembleEventDetails = function (details) {
  return `Trailer: ` + this._assembleEventTrailerLookup(details) + `

${details['description']}`
}

MusicBoxPlanner.prototype._assembleEventTrailerLookup = function (details) {
  if (details['trailer']) { return details['trailer'] }

  const query = encodeURIComponent([
    details['title'], details['year'], 'film trailer'
  ].join(' '))

  return `https://www.youtube.com/results?search_query=${query}`
}

