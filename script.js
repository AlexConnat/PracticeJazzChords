
// Global variables holding the "game configuration"
// FIXME: Clean / Useful ???
window.GAME_CONFIG = {
  nbSecondsPerChord: 1,
  selectedchordQualities: [],
  selectedChordTones: []
};

function toggle(btn) {
  btn.toggleAttribute('toggled');
}

// TODO: Move to utils.js file?

const midiPitchToNoteName = {
  0: 'C',
  1: 'Db',
  2: 'D',
  3: 'Eb',
  4: 'E',
  5: 'F',
  6: 'F#',
  7: 'G',
  8: 'Ab',
  9: 'A',
  10: 'Bb',
  11: 'B',
}

const noteNameToMidiPitch = {
  'C': 0,
  'Db': 1,
  'D': 2,
  'Eb': 3,
  'E': 4,
  'F': 5,
  'F#': 6,
  'G': 7,
  'Ab': 8,
  'A': 9,
  'Bb': 10,
  'B': 11,
}

function pitchToNote(pitch) {
  // TODO: Check if string (or int, but not array, or dict, etc... TYPESCRIPT???) is really a number int + Check range --> Returns NaN if not a number
  var pitchInt = parseInt(pitch);
  var pitchBase = pitchInt % 12;
  var note = midiPitchToNoteName[pitchBase];
  return note;
}

// Actually work for all arrays --> TODO: put in utils.js file?
Array.prototype.random = function () {
  return this[Math.floor((Math.random() * this.length))];
}

function chordGenerator(qualities) {
  // Take a random root note (e.g: C# or Gb)
  var root = midiPitchToNoteName[Math.floor(Math.random() * 12)];
  // Take a random quality (e.g: min7 or ø7)
  var quality = qualities.random();
  // Returns both strings in an array (e.g ['C#', 'min7'])
  return [root, quality];
}

function displayChordSymbol([root, quality]) {
  return root + quality;
}

// global variable holding the currently played notes by the keyboard (keys pressed)
currentNotes = new Set();

function displayNotes(notes) {
  // TODO: implement chord symbol detector, like in garage band?!
  var chord = "";
  document.getElementById('note').innerHTML = Array.from(notes).join(' - ');
}

function checkDisplayThirdsSeventh(notes, chord) {
  var root = chord[0];
  var quality = chord[1];

  if (quality == 'min6') {
    var third = 3;
    var fifth = 7;
    var seventh = 9;
  } else if (quality == '6') {
    var third = 4;
    var fifth = 7;
    var seventh = 9;
  } else if (quality == 'min7') {
    var third = 3;
    var fifth = 7;
    var seventh = 10;
  } else if (quality == '7') {
    var third = 4;
    var fifth = 7;
    var seventh = 10;
  } else if (quality == 'maj7') {
    var third = 4;
    var fifth = 7;
    var seventh = 11;
  } else if (quality == 'ø7') {
    var third = 3;
    var fifth = 6;
    var seventh = 10;
  } else if (quality == '°7') {
    var third = 3;
    var fifth = 6;
    var seventh = 9;
  } else {
    console.log('Unknown chord quality:', quality);
  }

  var chordRoot = root;
  var chordThird = midiPitchToNoteName[(parseInt(noteNameToMidiPitch[root]) + third) % 12];  // TODO: function toMidiNote, toMidiPitch (instead of dico lookup)
  var chordFifth = midiPitchToNoteName[(parseInt(noteNameToMidiPitch[root]) + fifth) % 12];
  var chordSeventh = midiPitchToNoteName[(parseInt(noteNameToMidiPitch[root]) + seventh) % 12];

  var correctNotes = new Set();
  if (GAME_CONFIG.selectedChordTones.includes('root')) {
    correctNotes.add(chordRoot)
  }
  if (GAME_CONFIG.selectedChordTones.includes('third')) {
    correctNotes.add(chordThird)
  }
  if (GAME_CONFIG.selectedChordTones.includes('fifth')) {
    correctNotes.add(chordFifth)
  }
  if (GAME_CONFIG.selectedChordTones.includes('seventh')) {
    correctNotes.add(chordSeventh)
  }

  // console.log('correct:', correctNotes);
  // console.log('notes played:', notes);

  var coloredNotes = [];

  notes.forEach(n => {
    if (correctNotes.has(n)) {
      coloredNotes.push('<b style="color: green;">' + n + '</b>');
    } else {
      coloredNotes.push('<b style="color: red;">' + n + '</b>');
    }
  });

  // display notes with a hyphen
  document.getElementById('note').innerHTML = coloredNotes.join(' - ');
}

function onMIDIMessage(event) {
  var status = event.data[0];
  var pitch = event.data[1];
  var velocity = event.data[2]; // We don't use this info in this program

  // Translate the absolute pitch into a real note name (eg: 54 --> F#)
  var note = pitchToNote(pitch);

  if (status == 144) { // "key pressed"
    currentNotes.add(note);
    checkDisplayThirdsSeventh(currentNotes, currentChord);
  } else if (status == 128) { // "key released"
    currentNotes.delete(note);
    checkDisplayThirdsSeventh(currentNotes, currentChord);
  } else {
    console.log("Unknown status:", status);
  }
}

function startLoggingMIDIInput(midiAccess, indexOfPort) {
  midiAccess.inputs.forEach(function (entry) {
    console.log(entry);
    entry.onmidimessage = onMIDIMessage;
  });
}

var midi = null;  // global MIDIAccess object
function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  midi = midiAccess;  // store in the global (in real usage, would probably keep in an object instance)
  startLoggingMIDIInput(midi, 0);
}

function onMIDIFailure(msg) {
  console.log("Failed to get MIDI access - " + msg);
}

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

function startTimer(nbSecondsPerChord) {
  // Create a little progressbar on top of the screen to see remaining time before displaying next chord
  createProgressbar('progressbar', GAME_CONFIG.nbSecondsPerChord + 's');

  currentChord = chordGenerator(GAME_CONFIG.selectedchordQualities);
  document.getElementById('chord').innerHTML = displayChordSymbol(currentChord);

  // Call the function to display a random chord every X miliseconds
  var intervalId = window.setInterval(function () {
    // currentChord = seventhChordGenerator();
    currentChord = chordGenerator(GAME_CONFIG.selectedchordQualities);
    document.getElementById('chord').innerHTML = displayChordSymbol(currentChord);
  }, nbSecondsPerChord * 1000);
}

function startGame() {

  // Check what chordQualities buttons were toggled and store them in the global game configuration
  const availablechordQualities = ['min6', '6', 'min7', '7', 'maj7', 'ø7', '°7'];
  availablechordQualities.forEach(id => {
    if (document.getElementById(id).hasAttribute('toggled')) {
      GAME_CONFIG.selectedchordQualities.push(id);
    }
  });

  // Check what chordTones buttons were toggled and store them in the global game configuration
  const availableChordTones = ['root', 'third', 'fifth', 'seventh'];
  availableChordTones.forEach(id => {
    if (document.getElementById(id).hasAttribute('toggled')) {
      GAME_CONFIG.selectedChordTones.push(id);
    }
  });

  // Check what timePerChord value was selected and store it in the global game configuration
  GAME_CONFIG.nbSecondsPerChord = document.getElementById("sliderNbSecondsPerChord").value; // e.g: 3

  // Check if valid game configuration, if not display an error message
  if (GAME_CONFIG.selectedChordTones.length == 0 || GAME_CONFIG.selectedchordQualities == 0) {
    console.log("Please select at least one chord quality or chord tone!");
    var errorMessageDiv = document.getElementById("errorMessage");
    errorMessageDiv.innerHTML = "Please select <b>at least one</b> chord quality or chord tone!"
    errorMessageDiv.hidden = false;
  }
  // Otherwise, start the game
  else {
    console.log("Game started");

    // Hide all the selection items
    document.getElementById("selectionMenuUI").hidden = true;

    // Display all the other game items
    document.getElementById("gameUI").hidden = false;

    // Start the actual game loop (i.e display a chord ever X seconds)
    startTimer(GAME_CONFIG.nbSecondsPerChord);
  }
}

// Reference: https://stackoverflow.com/questions/31109581/javascript-timer-progress-bar
/*
 *  Creates a progressbar.
 *  @param id the id of the div we want to transform in a progressbar
 *  @param duration the duration of the timer example: '10s'
 *  @param callback, optional function which is called when the progressbar reaches 0.
 */
function createProgressbar(id, duration, callback) {
  // We select the div that we want to turn into a progressbar
  var progressbar = document.getElementById(id);
  progressbar.className = 'progressbar';

  // We create the div that changes width to show progress
  var progressbarinner = document.createElement('div');
  progressbarinner.className = 'inner';

  // Now we set the animation parameters
  progressbarinner.style.animationDuration = duration;

  // Eventually couple a callback
  if (typeof (callback) === 'function') {
    progressbarinner.addEventListener('animationend', callback);
  }

  // Append the progressbar to the main progressbardiv
  progressbar.appendChild(progressbarinner);

  // When everything is set up we start the animation
  progressbarinner.style.animationPlayState = 'running';
}

