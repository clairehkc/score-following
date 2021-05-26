class ScoreParser {
	constructor() {
		if (document.getElementById("saveParserLog")) {
			this.logTable = this.setUpLogTable();
			document.getElementById("saveParserLog").addEventListener("click", this.saveParserLog.bind(this));
		}
	}

	parse(osmd) {
		if (this.logTable) this.logTable.clearRows();

		const scoreEventList = [];
		let scoreEventId = 0;
		let noteEventString;
		let notesLength;

		while (!osmd.cursor.iterator.EndReached) {
			const notesUnderCursor = osmd.cursor.NotesUnderCursor();
			if (notesUnderCursor.length === 1) {
				const note = notesUnderCursor[0];
				noteEventString = this.createNoteEventString(note) + (note.pitch.octave + 3).toString();
				notesLength = 1;
			} else {
				const noteStrings = notesUnderCursor.map(note => this.createNoteEventString(note)).filter(note => note !== "-1");
				notesLength = noteStrings.length;
				noteEventString = noteStrings.join("-");
			}
			const measureNumber = notesUnderCursor[0].sourceMeasure.measureNumber;
			const scoreEvent = {
				noteEventString,
				notesLength,
				measureNumber,
				scoreEventId,
			}
			scoreEventList.push(scoreEvent);
			if (this.logTable) this.logResult(scoreEvent);
			scoreEventId++;
			osmd.cursor.next();
		}

		return scoreEventList;
	}

	createNoteEventString(note) {
		if (!note.pitch) return "-1"; // probably a rest
		const osmdPitch = opensheetmusicdisplay.Pitch;
		const accidentalType = opensheetmusicdisplay.AccidentalEnum[note.pitch.accidental];
		const noteLetterList = ["C", "D", "E", "F", "G", "A", "B"];

		let noteLetterString = osmdPitch.getNoteEnumString(note.pitch.fundamentalNote);
		let accidentalString = "";

		const noteLetterIndex = noteLetterList.indexOf(noteLetterString);

		switch (accidentalType) {
			case "SHARP":
				accidentalString = "#";
				break;
			case "FLAT":
				// convert flat to sharp
				noteLetterString = (noteLetterIndex > 0) ? noteLetterList[noteLetterIndex - 1] : "B";
				accidentalString = "#";
				break;
			case "NONE":
				break;
			case "NATURAL":
				break;
			case "DOUBLESHARP":
				noteLetterString = (noteLetterIndex < 6) ? noteLetterList[noteLetterIndex + 1] : "C";
				break;
			case "DOUBLEFLAT":
				noteLetterString = (noteLetterIndex < 0) ? noteLetterList[noteLetterIndex - 1] : "B";
				break;
			case "TRIPLESHARP":
				break;
			case "TRIPLEFLAT":
				break;
			case "QUARTERTONESHARP":
				break;
			case "QUARTERTONEFLAT":
				break;
			case "THREEQUARTERSSHARP":
				break;
			case "THREEQUARTERSFLAT":
				break;
		}

		return noteLetterString + accidentalString;
	}

	setUpLogTable() {
		const table = new p5.Table();
		table.addColumn('Event');
		table.addColumn('Notes_Length');
		table.addColumn('Measure_Number');
		table.addColumn('Score_Id');
		return table;
	}

	saveParserLog() {
		if (!this.logTable) return;
		saveTable(this.logTable, 'parser_log.csv');
	}

	logResult(scoreEvent) {
		let newRow = this.logTable.addRow();
		const {
			noteEventString,
			notesLength,
			measureNumber,
			scoreEventId,
		} = scoreEvent;
		newRow.setString('Event', noteEventString);
		newRow.setString('Notes_Length', notesLength.toString());
		newRow.setString('Measure_Number', measureNumber.toString());
		newRow.setString('Score_Id', scoreEventId.toString());
	}
}
