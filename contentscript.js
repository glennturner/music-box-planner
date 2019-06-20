chrome.extension.sendRequest(
  {
    action: 'getSettings'
  }, (settings) => {}
);

MBP = new MusicBoxPlanner
MBP.displayPlanner()
