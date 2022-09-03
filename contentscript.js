chrome.runtime.sendMessage(
  {
    action: 'getSettings'
  }, (settings) => {}
);

MBP = new MusicBoxPlanner
MBP.displayPlanner()
