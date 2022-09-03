/* utility functions */

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

String.prototype.lowerCaseFirst = function () {
  return this.charAt(0).toLowerCase() + this.slice(1);
}

String.prototype.urlize = function() {
  var str = this.replace(/[^A-Z^a-z^0-9]/g,'-').toLowerCase();
  return str.replace(/\-{2,}/g,'-');
}

Number.prototype.wdayName = function () {
  const wdays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ]

  return wdays[this]
}

function formatMusicBoxTimeStr (str) {
  let matched = str.match(
    /\s(\d{1,2})\:(\d\d)([aAmMpP]{2})/, 'igs'
  )

  // Adjust for 24-hour
  if (matched[3].toLowerCase() == 'pm') {
    matched[1] = String(
      Number(matched[1]) + 12
    )
  }

  return `${matched[1]}:${matched[2]}:00`
}
