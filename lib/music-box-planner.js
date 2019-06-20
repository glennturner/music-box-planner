MusicBoxPlanner = function () {
  // Protected.
  this._mb = new MusicBox
  this._showtimesBlockClass = 'view-showtime-blocks'
  this._showtimesClass = 'showtimes'
  this._showtimesCalendarClass = 'showtimes-calendar';
  this._showtimesDateClass = 'showtimes-date'
  this._showRoomClass = 'showtime-room'
  this._foundRoomClass = 'showtime-room-found'

  this._showWatchers = []
}

MusicBoxPlanner.prototype.displayPlanner = function () {
  this._stopWatchingShowtimes()

  if (this._hasShowtimes()) {
    this._injectShowtimeExtras()
    this._injectCalendar()
    this._addShowtimeEvents()
  }

  this._watchShowtimes()
}

// Protected
MusicBoxPlanner.prototype._getDate = function(year) {
  let showtimesDate = document.getElementsByClassName(
    this._showtimesDateClass
  )

  if (showtimesDate.length) {
    return (
      showtimesDate[0].innerText.split(',')[1] + ' ' + year
    ).replace(/\s(\d{1,})\w+\s/g, ' $1 ')
  }
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
  const parsedDate = new Date(Date.parse(showtimesDate))

  const calendarHTML = parsedDate.getDay().wdayName() + `,
    <input type="date"
      name="` + this._showtimesCalendarClass + `"
      class="` + this._showtimesCalendarClass + `"
      value="` + showtimesDate + `"
      max="` + this._formatDate(
        new Date(parsedDate.getFullYear() + 1, 11, 31)
      ) + `"
      min="` + this._formatDate(new Date) + `"
    />`

  let showtimeDateEles = document.getElementsByClassName(this._showtimesDateClass)
  for (let i = 0; i < showtimeDateEles.length; i++) {
    if (!showtimeDateEles[i].getElementsByClassName(
      this._showtimesCalendarClass
    ).length) {
      showtimeDateEles[i].innerHTML = calendarHTML;
    }
  }
}

MusicBoxPlanner.prototype._injectShowtimeExtras = function () {
  let showtimes = this._getShowtimesEles()

  showtimes.forEach(showtime => {
    let urlEle = showtime.querySelectorAll('.showtime a')[0]
    let showtimeTitle = showtime.querySelectorAll('.showtime')[0]

    if (
      !showtimeTitle.getElementsByClassName(this._showRoomClass).length
    ) {
      const showtimeData = this._mb.isFilmPage ?
        this._getDataFromPage() : this._getDataFromShowtimeBlock(showtime)

      console.log('SHOWTIME DATA')
      console.log(showtimeData)

      let showRoomHTML = `<br /><a
        href="` + urlEle.href + `" class="purchase ` + this._showRoomClass + `"
        >Which Screen?</a>`

      showtimeTitle.innerHTML += showRoomHTML
      showtime.innerHTML += `<a href="#" class="showtime-add-to-calendar">
        <img
          src="` + chrome.runtime.getURL('images/google-cal-icon.svg') + `"
          class="showtimes-add-to-calendar-icon"
          style="vertical-align: middle;"
        />
      </a>`
    }
  })
}

MusicBoxPlanner.prototype._getDataFromPage = function () {
  return {
    title: document.querySelector('.view-content .film-title').textContent.trim()
  }
}

MusicBoxPlanner.prototype._getDataFromShowtimeBlock = function (showtimeEle) {
  return {
    title: showtimeEle.querySelector('.film-title a').textContent.trim()
  }
}

MusicBoxPlanner.prototype._hasShowtimes = function () {
  return this._getShowtimesEles().length > 0
}

// Only retrieves future showtimes.
MusicBoxPlanner.prototype._getShowtimesEles = function () {
  return document.querySelectorAll('.' + this._showtimesClass + ' > div.future-showtime')
}

MusicBoxPlanner.prototype._addShowtimeEvents = function() {
  let links = document.getElementsByClassName(this._showRoomClass)

  for (let i = 0; i < links.length; i++) {
    links[i].removeEventListener('click', this._onScreenRequest.bind(this),)
    links[i].addEventListener('click', this._onScreenRequest.bind(this),)
  }

  let calendars = document.getElementsByClassName(this._showtimesCalendarClass)

  for (let i = 0; i < calendars.length; i++) {
    calendars[i].removeEventListener('input', this._onCalendarChange.bind(this))
    calendars[i].addEventListener('input', this._onCalendarChange.bind(this))
  }
}

MusicBoxPlanner.prototype._onCalendarChange = function (ev) {
  const selectedValue = ev.target.value
  const selectedDate = new Date(Date.parse(selectedValue))
  const today = new Date

  if (selectedValue && selectedDate >= today) {
    ev.target.setAttribute('readonly', true)
    window.location = window.location.href.split('?')[0] + '?date=' + ev.target.value
  }
}

MusicBoxPlanner.prototype._onScreenRequest = function (ev) {
  ev.preventDefault()

  let currentTarget = ev.currentTarget
  currentTarget.innerText = 'Finding...'

  this._mb.request(
    currentTarget.href
  ).then(
    function (resp) {
      let frag = document.createRange().createContextualFragment(resp);
      let eles = frag.querySelectorAll('.view-add-tickets .showtime-info > div:last-child')

      if (eles.length) {
        currentTarget.innerText = eles[0].innerText
      }
    },
    function (err) {
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
