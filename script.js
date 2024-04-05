let scales = {};
let chords = {};
let currentMode = "Major";
const enharmonics = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
  'B#': 'C', 'E#': 'F',
};

const majorToMinorMapping = {
  "C Major": "A Minor",
  "G Major": "E Minor",
  "D Major": "B Minor",
  "A Major": "F# Minor",
  "E Major": "C# Minor",
  "B Major": "G# Minor",
  "F# Major": "D# Minor",
  "C# Major": "A# Minor",

  "F Major": "D Minor",
  "Bb Major": "G Minor",
  "Eb Major": "C Minor"
};


fetch("./info.json")
  .then(response => response.json())
  .then(data => {
    scales = data.scales;
    chords = data.chords;
    initSelectOptions();
  });

document.getElementById('keySelect').addEventListener('change', function () {
  let selectedKey = this.value;
  displayKeyDetails(selectedKey);
});

document.getElementById('switchMode').addEventListener('click', function () {
  currentMode = currentMode === "Major" ? "Minor" : "Major";
  this.textContent = currentMode;
  updateKeySelectOptions();
  clearSelectedNotes();
});

document.addEventListener('DOMContentLoaded', function () {
  const pianoKeys = document.querySelectorAll('#piano rect');
  pianoKeys.forEach(key => {
    key.addEventListener('click', function () {
      const selectedCount = Array.from(document.querySelectorAll('#piano rect'))
        .filter(rect => rect.style.fill === 'green').length;

      if (this.style.fill === 'green' || selectedCount < 7) {
        this.style.fill = this.style.fill === 'green' ? (this.id.endsWith('#') ? 'black' : 'white') : 'green';
        findKey();
      } else {
        alert('You cannot select more than 7 notes!');
      }
    });
  });

  initSelectOptions();
});

document.getElementById('clearNotes').onclick = clearSelectedNotes;
document.getElementById('keyTable').style.display = 'none';


function updateKeySelectOptions() {
  let keySelect = document.getElementById('keySelect');
  keySelect.innerHTML = '<option selected>Choose a key</option>';

  if (currentMode === "Major") {
    Object.keys(scales).forEach(key => {
      if (key.endsWith(" Major")) { // Ensure we're dealing with a major key
        let option = new Option(key, key);
        keySelect.add(option);
      }
    });
  } else { // Minor mode
    Object.keys(majorToMinorMapping).forEach(key => {
      let minorKey = majorToMinorMapping[key];
      let option = new Option(minorKey, key);
      keySelect.add(option);
    });
  }
}

function highlightPianoKeys(notes) {
  const pianoKeys = document.querySelectorAll('#piano rect');
  pianoKeys.forEach(key => {
    key.style.fill = key.id.endsWith('#') ? 'black' : 'white';
  });

  notes.forEach(note => {
    const key = document.getElementById(note);
    if (key) {
      key.style.fill = 'green';
    }
  });
}

function displayKeyDetails(key) {
  let keyDetails = document.getElementById('keyDetails');
  let keyTable = document.getElementById('keyTable');

  if (key !== 'Choose a key') {
    keyTable.style.display = '';
    keyDetails.innerHTML = '';

    let notes = scales[key] || [];
    let chordsForKey = chords[key] || [];
    let maxLength = Math.max(notes.length, chordsForKey.length);
    notes = notes.map(note => normalizeNote(note));

    highlightPianoKeys(notes);

    for (let i = 0; i < maxLength; i++) {
      let note = scales[key][i] || '';
      let chord = chords[key][i] || '';
      let row = `<tr><td>${note}</td><td>${chord}</td></tr>`;
      keyDetails.innerHTML += row;
    }
  } else {
    keyTable.style.display = 'none';
    highlightPianoKeys([]);
  }
}

function normalizeNote(note) {
  const normalizationMap = {
    'C#': 'C#', 'Db': 'C#',
    'D#': 'D#', 'Eb': 'D#',
    'E#': 'F',
    'F#': 'F#', 'Gb': 'F#',
    'G#': 'G#', 'Ab': 'G#',
    'A#': 'A#', 'Bb': 'A#',
    'B#': 'C'
  };
  return normalizationMap[note] || note;
}

function findKey() {
  const selectedNotes = Array.from(document.querySelectorAll('#piano rect'))
    .filter(key => key.style.fill === 'green')
    .map(key => key.id)
    .map(note => normalizeNote(note));

  document.getElementById('possibleKey').style.display = selectedNotes.length === 0 ? 'none' : 'block';

  let matches = [];

  Object.entries(scales).forEach(([key, notes]) => {
    let matchingNotesCount = selectedNotes.filter(selectedNote => {
      return notes.some(note => {
        return note === selectedNote || note === enharmonics[selectedNote] || enharmonics[note] === selectedNote;
      });
    }).length;

    let matchPercentage = (matchingNotesCount / notes.length) * 100;
    if (matchingNotesCount > 0) {
      matches.push({key, matchingNotesCount, matchPercentage});
    }
  });

  matches.sort((a, b) => b.matchingNotesCount - a.matchingNotesCount);
  let topMatch = matches[0];
  let topMatches = matches.filter(match => match.matchPercentage === topMatch.matchPercentage);
  if (currentMode === "Minor") {
    topMatches = topMatches.map(match => {
      return {
        key: majorToMinorMapping[match.key] || match.key,
        matchingNotesCount: match.matchingNotesCount,
        matchPercentage: match.matchPercentage
      };
    });
  }

  if (topMatch && topMatch.matchPercentage === 100) {
    document.getElementById('possibleKey').innerHTML = `${topMatches[0].key} (100% match)`;
    document.getElementById('keySelect').value = topMatch.key;
    displayKeyDetails(topMatch.key)
  } else {
    document.getElementById('possibleKey').innerHTML = topMatches.slice(0, 3).map(match => `${match.key} (${match.matchPercentage.toFixed(2)}% match)`).join('<br>');
  }
}

function clearSelectedNotes() {
  document.querySelectorAll('#piano rect').forEach(key => {
    key.style.fill = key.id.endsWith('#') ? 'black' : 'white';
  });
  document.getElementById('possibleKey').style.display = 'none';
  document.getElementById('keySelect').value = 'Choose a key';
  document.getElementById('keyTable').style.display = 'none';
  document.getElementById('keyDetails').innerHTML = '';
}

function initSelectOptions() {
  let keySelect = document.getElementById('keySelect');

  keySelect.innerHTML = '<option selected>Choose a key</option>';

  Object.keys(scales).forEach(function (key) {
    let option = new Option(key, key);
    keySelect.add(option);
  });

  let allNotes = new Set();
  Object.values(scales).forEach(scale => scale.forEach(note => allNotes.add(note)));
  allNotes = Array.from(allNotes).sort();
  allNotes = allNotes.concat(allNotes.splice(0, allNotes.indexOf('C')));
  allNotes = allNotes.filter(note => !note.includes('b'));

  allNotes.forEach(note => {
    let button = document.createElement('button');
    button.classList.add('btn', 'btn-lg', 'btn-outline-light', 'm-1');
    button.textContent = note;
    button.dataset.note = note;

    button.onclick = function () {
      this.classList.toggle('btn-success');
      findKey();
    };
  });
}


