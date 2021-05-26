class PitchDetector {
	constructor(audioContext, matchCallback, logTable, isReady, isUsingTestInterface) {
		this.audioContext = audioContext;
		this.modelUrl = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';
		this.matchCallback = matchCallback;
		this.isActive = false;
		this.pitchDetector;
		this.nextExpectedNoteEvent;
		this.noteToFrequencyTable = {};
		this.logTable = logTable;
		this.isReady = isReady;
		this.isUsingTestInterface = isUsingTestInterface;

		this.frequencySet = new Set();
		this.lastSet = new Set();
		this.lastX = [];
		this.initializeNoteToFrequencyTable();
	}

	initializeNoteToFrequencyTable() {
		const self = this;
		fetch("././data/NoteFundamentalFrequencies.json")
		.then(response => {
		   return response.json();
		})
		.then(data => self.noteToFrequencyTable = data);
	}

	startPitchDetection(mic) {
	  this.pitchDetector = ml5.pitchDetection(this.modelUrl, this.audioContext , mic.stream, this.modelLoaded.bind(this));
		this.isActive = true;
	}

	modelLoaded() {
	  this.getPitch();
	}

	getPitch() {
		this.pitchDetector.getPitch(this.getPitchCallback.bind(this));
	}

	getPitchCallback(err, frequency) {
	  if (frequency) {
	  	if (!this.isReady) this.isReady = true;
	    const expectedPitch = this.noteToFrequencyTable[this.nextExpectedNoteEvent.noteEventId];
	    if (!expectedPitch) {
	    	console.error("Invalid note event for pitch detector");
	    	return;
	    }
	    const matchResult = this.determineMatch(expectedPitch, frequency);
	    this.logResult(expectedPitch, frequency, matchResult);
	  } else {
	    if (this.isUsingTestInterface) document.getElementById('detectedPitchValue').innerHTML = 'No pitch detected';
	  }
	  if (this.isActive) this.getPitch();
	}

	determineMatch(expectedPitch, detectedPitch) {
		const matchResult = Math.abs(expectedPitch - detectedPitch) < 1;
		if (this.isUsingTestInterface) {
			document.getElementById('detectedPitchValue').innerHTML = detectedPitch;
			document.getElementById('expectedPitchValue').innerHTML = expectedPitch;
			document.getElementById('pitchMatchResult').innerHTML = matchResult;	
		}

		if (matchResult) this.matchCallback(this.nextExpectedNoteEvent.scoreEventId);
		return matchResult	
	}

	stop() {
		this.isActive = false;
	}

	logResult(expectedPitch, frequency, matchResult) {
		let newRow = this.logTable.addRow();
		const guess = matchResult ? this.nextExpectedNoteEvent.noteEventString : "--";
		newRow.setString('Type', 'Pitch');
		newRow.setString('Input', this.nextExpectedNoteEvent.noteEventString);
		newRow.setString('Expected', expectedPitch.toString());
		newRow.setString('Detected', frequency.toString());
		newRow.setString('Guess', guess);
		newRow.setString('Match', matchResult.toString());	
	}
}