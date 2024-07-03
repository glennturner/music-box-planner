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
  this._showtimesCalendarBlockClass = 'programming-showtimes'
  this._showtimesBlockClass = 'view-showtime-blocks'
  this._showtimesDateClass = 'showtimes-date'
  this._showRoomClass = 'showtime-room'
  this._foundRoomClass = 'showtime-room-found'

  // We're migrating to selectors for the new site.
  // @see `this._showtimesBlockClass`
  this._showtimesSelector = '#showtimes'
  this._showtimesRowsSelector = `
    ${this._showtimesSelector} .row,
    .${this._showtimesCalendarBlockClass}`
  this._showtimesDateSelectSelector = '#edit-dateselector'

  this._showWatchers = []
}

MusicBoxPlanner.prototype.displayPlanner = function () {
  this._stopWatchingShowtimes()

  if (this._mb.isCalendarPage()) {
    this._setCalendarDate()
    this._injectCalendar()
  }

  if (this._hasShowtimes()) {
    this._injectShowtimeExtras()
    this._addShowtimeEvents()
  }

  this._watchShowtimes()
}

// Protected

// Retrieve the requested date from the page.
MusicBoxPlanner.prototype._getDate = function() {
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

MusicBoxPlanner.prototype._getDateFromPicker = function() {
  const picker = this._getShowtimesCalendarPicker()
  const selectedDate = picker.selected

  return picker.selectedOptions[0].value
}

MusicBoxPlanner.prototype._formatDate = function (date) {
  const mon = date.getMonth() + 1
  const month = mon < 10 ? '0' + mon : mon
  const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()

  return [date.getFullYear(), month, day].join('-')
}

MusicBoxPlanner.prototype._getCalendarMonthYearFromURL = function () {
  let [ month, year ] = window.location.pathname.split('/').splice(2,3)

  // Default to this month if necessary
  if (!year) {
    const d = new Date
    month = d.toLocaleDateString('en-CA', {
      month: 'numeric'
    })
    year = d.getFullYear()
  }

  return [ month, year ]
}

MusicBoxPlanner.prototype._setCalendarDate = function () {
  [
    this.calendarMonthName,
    this.calendarYear
  ] = this._getCalendarMonthYearFromURL()

  this.calendarYear = Number(this.calendarYear)
  this.calendarDateNum = new Date(
    Date.parse(
      `${this.calendarMonthName} 01, ${this.calendarYear}`
    )
  )
  this.calendarDate = this.calendarDateNum.toLocaleDateString('en-CA')
}

MusicBoxPlanner.prototype._formatMonthYear = function (date) {
  return [
    date.getFullYear(),
    this._formatMonth(date)
  ].join('-')
}

MusicBoxPlanner.prototype._formatMonth = function (date) {
  return ('0' + (date.getMonth() + 1)).slice(-2)
}

MusicBoxPlanner.prototype._injectCalendar = function () {
  const calendarLinkEle = document.querySelector('.calendar-links svg')

  let maxDate = new Date
  maxDate.setYear(maxDate.getFullYear() + 1)
  maxDate.setMonth(maxDate.getMonth() + 1)
  maxDate.setDate(0)

  const minDate = new Date(2022, 0, 1)

  let calendarHTML = `
      <select
        name="${this._showtimesCalendarClass}"
        class="form-control form-select"
      >${this._monthPickerOptions(minDate, maxDate, this.calendarDateNum)}
      </select>
  `

  let calendarCont = document.createElement('div')
  calendarCont.classList.add(
    this._showtimesCalendarClass,
    "js-form-item", "form-item", "js-form-type-select",
    "form-type-select", "js-form-item-dateselector",
    "form-item-dateselector", "form-no-label"
  )
  calendarCont.innerHTML = calendarHTML
  calendarLinkEle.after(calendarCont)

  this._addShowtimesCalendarEvents()
}

MusicBoxPlanner.prototype._monthPickerOptions = function(start, end, current = new Date) {
  current = new Date(current.getFullYear(), current.getMonth(), 1)
  start.setDate(1)
  end.setDate(1)

  const calValOpts = {
    year: "numeric",
    month: "numeric"
  }

  const calDisplayOpts = {
    month: "long",
    year: "numeric"
  }

  let optionsHTML = ''
  let currMonth = start.getMonth()
  let currYear = start.getYear()
  let currVal = current.toLocaleDateString('en-CA', calValOpts)
  while (start <= end) {
    let val = start.toLocaleDateString('en-CA', calValOpts)
    let display = start.toLocaleDateString('en-US', calDisplayOpts)

    optionsHTML += `<option
      value="${val}"
      ${val == currVal ? "selected" : ""}
    >
      ${display}
    </option>`

    currMonth = currMonth == 12 ? 0 : currMonth + 1

    start.setMonth(currMonth)
  }

  return optionsHTML
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
    // Ignore past events
    if (!showtime.classList.contains('past')) {
      console.log('SHOWTIME')
      console.log(showtime)
      const data = this._mb.isFilmPage() ?
        this._getDataFromPage(showtime) : this._getDataFromShowtimeBlock(showtime)

      if (data) {
        showtime.querySelector('.text-end').appendChild(
          this._constructGCalEle(data)
        )
      }
    }
  })
}

MusicBoxPlanner.prototype._constructGCalEle = function (data) {
  let ele = document.createElement('a')
  ele.setAttribute('href', data.eventUrl)
  ele.setAttribute('class', this._showtimeAddToGCalClass)
  ele.setAttribute('title', 'Add To Google Calendar')
  ele.setAttribute('data-starts-at', data.startsAt)

  ele.innerHTML = `<img
    src="` + chrome.runtime.getURL('images/google-cal-icon.svg') + `"
    class="showtimes-add-to-calendar-icon"
    style="vertical-align: middle;"
  />`

  return ele
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

MusicBoxPlanner.prototype._getDataFromCalendarDayBlock = function (day) {
  console.log('GET DATA FROM CALENDAR BLOCK')
}

MusicBoxPlanner.prototype._getDataFromShowtimeBlock = function (showtime) {
  // Slop: this should check to see if it's a film page,
  // then use `MusicBox` to get the film details.
  const titleEle = showtime.querySelector('h3 a')

  if (titleEle) {
    const title = (
        titleEle ? titleEle : document.querySelector('h1.page-title')
    ).textContent.trim()
    const eventUrl = this._getEventUrlFromBlock(showtime)
    const ticketUrl = this._getTicketUrlFromBlock(showtime)
    const startsAt = this._getStartTimeFromBlock(showtime).toISOString()

    return {
      eventUrl: eventUrl,
      startsAt: startsAt,
      ticketUrl: ticketUrl,
      title: title
    }
  }
}

MusicBoxPlanner.prototype._getEventUrlFromBlock = function (showtime) {
  const showtimeEventEle = showtime.querySelector('h3 > a')

  return showtimeEventEle ? showtimeEventEle.href : window.location.href
}

MusicBoxPlanner.prototype._getTicketUrlFromBlock = function (showtime) {
  const url = showtime.querySelector('.text-end a')
  // Always use the first url.
  return url.href
}

MusicBoxPlanner.prototype._getStartTimeFromBlock = function (showtime) {
  const currentDateTimeEle = showtime.querySelector('h4')
  let dateStr = currentDateTimeEle.querySelector('span').textContent

  // Short-lived hack to ensure it's this year.
  // @todo Fix to check whether the future date is a future year.
  const d = new Date
  dateStr += ` ${d.getYear() + 1900}`

  const timeStr = formatMusicBoxTimeStr(currentDateTimeEle.innerText)
  const formatted = Date.parse(dateStr + ` ${timeStr}`)

  return new Date(formatted)
}

MusicBoxPlanner.prototype._hasShowtimesCalendarPicker = function () {
  return this._getShowtimesCalendarPicker()
}

MusicBoxPlanner.prototype._getShowtimesCalendarPicker = function () {
  return document.querySelector(this._showtimesDateSelectSelector)
}

MusicBoxPlanner.prototype._hasShowtimes = function () {
  return document.querySelectorAll(
    this._showtimesRowsSelector
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
  return document.querySelectorAll(this._showtimesRowsSelector)
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
  const [
    selectedYear,
    selectedMon
  ] = ev.target.value.split('-')

  const selectedDate = new Date(selectedYear, selectedMon - 1, 1)

  this._injectCalendarLoader()
  ev.target.setAttribute('readonly', true)
  ev.target.setAttribute('disabled', true)

  const month = selectedDate.toLocaleString('default', { month: 'long' })
  const path = '/calendar/' + [
    month.toLowerCase(),
    selectedYear
  ].join('/') + location.search + location.hash

  window.location = path
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
      details['event_url'] = currentTarget.href
      details['starts_at'] = new Date(
        Date.parse(currentTarget.dataset.startsAt)
      ).toJSON()
      details['ends_at'] = new Date(Date.parse(currentTarget.dataset.startsAt))

      let endsAt = new Date(Date.parse(details['starts_at']))
      const endsAtMin = parseInt(details['Run Time'].replace(/^.*?(\d+).*?$/, '$1'))
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
      let eles = frag.querySelectorAll('.view-add-tickets .showtime-info > div:nth-child(4)')

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

  const nodes = document.querySelectorAll('.form-item-dateselector')
  for (let i = 0; i < nodes.length; i++) {
    this._showWatchers.push(
      new MutationObserver(this._onScheduleChange.bind(this))
    )

    this._showWatchers[i].observe(nodes[i], {
      childList: true,
      subtree: true
    })
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
  // Compensate for MB-embedded trailers.
  if (details['trailer'] == '#') {
    details['trailer'] = details['event_url']
  }

  // If a trailer URL already exists, return that URL.
  if (details['trailer']) { return details['trailer'] }

  // Otherwise, construct a YouTube search.
  const query = encodeURIComponent([
    details['title'], details['year'], 'film trailer'
  ].join(' '))

  return `https://www.youtube.com/results?search_query=${query}`
}

