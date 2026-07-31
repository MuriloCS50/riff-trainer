// Load the tab visually in tab.html
// Import JSON
let currentNotes = null;

async function loadTab(id) {
    const response = await fetch(`/riff/${id}`);
    currentNotes = await response.json();
    renderTab(currentNotes);
}

function formatNote(note) {
    let notation = note.notation;
    if (notation === null) notation = "";
    else if (notation === "v") {
        notation = "d";
        return `${note.fret} ${notation} /${note.string}`;
    } else if (notation === "^") {
        notation = "u";
        return `${note.fret} ${notation} /${note.string}`;
    }
    // Format the note to match VexTab's input format
    return `${note.fret}/${note.string} ${notation}`;
}

function renderTab(notes) {
    // Use VexTab to render the tab based on the JSON data
    const container = document.querySelector(".tab-container");
    const availableWidth = container.clientWidth - 20;

    // Approximate width required for a single measure
    const estimatedBarWidth = 220;

    let barsPerLine = Math.floor(availableWidth / estimatedBarWidth);

    // Clamp the value to keep the layout readable
    barsPerLine = Math.max(1, Math.min(3, barsPerLine));
    let timeSignature = document.querySelector("#timeSignature").value; // Default time signature

    // Default spacing and options for the tab
    
    const tabOptions1 = `options space=20 tab-stems=true\n`
    const tabOptions2 = `\n options space=50`
    const staveGap = `options space=30 \n`

    let noteSection = '';
    let bar;
    let totalCompasses = 1;
    // Convert each line of the tab to the VexTab format, adding bar lines and line breaks as needed
    
    // Group notes by position to handle chords
    let groupedNotes = {};

    for (let i = 0; i < notes.length; i++) {
        let note = notes[i];
        let pos = note.position;

        if (!groupedNotes[pos]) {
            groupedNotes[pos] = [];
        }

        groupedNotes[pos].push(note);
    }

    // Order the positions to ensure the tab is rendered in the correct sequence
    let positions = Object.keys(groupedNotes)
        .map(Number)
        .sort((a, b) => a - b);
        
    let tripletCounter = 0;

    // Loop through the ordered positions to build the tab notation, handling chords and rhythm values
    for (let i = 0; i < positions.length; i++) {

        let pos = positions[i];
        let notesAtPosition = groupedNotes[pos];
        let tabNoteRhythm = parseInt(notesAtPosition[0].duration);
        let triplet = "";

        // Rhythm for triplets
        // Check for triplet (duration ending with "t")
        if (notesAtPosition[0].duration.endsWith("t")) {
            tripletCounter += 1;

            if (tripletCounter === 3) {
                triplet = "^3^";
                tripletCounter = 0; // Reset counter after 3 notes
            }
        } else {
            tripletCounter = 0; // Reset when non-triplet note appears
        }

        // Bar lines and line breaks
        if (pos % 4 === 0 && pos !== 0) {
            bar = `|`
            totalCompasses += 1;
        } else {
            bar = ``;
        }

        // Vextab compatible line breaks
        if (totalCompasses > barsPerLine) {
            bar = `\n ${staveGap} tabstave time=${timeSignature}/4 \n notes `;
            totalCompasses = 1;
        }

        // Variable to handle chords (multiple notes at the same position)
        let chordNotes = notesAtPosition.map(formatNote);

        let tabNote = chordNotes.length > 1
            ? `(${chordNotes.join('.')})`
            : chordNotes[0];

        noteSection += ` ${bar} :${tabNoteRhythm} ${tabNote} ${triplet}`;
    }

    // Unite all the options and notes to create a full VexTab string
    const data = `
    ${tabOptions1} tabstave time=${timeSignature}/4 \n notes =|: ${noteSection} =:| ${tabOptions2}
    `;

    // Limpa o SVG anterior
    const notation = document.querySelector("#notation");
    notation.innerHTML = "";

    // Inicializa o renderer
    const VF = vextab.Vex.Flow;

    const renderer = new VF.Renderer(
        notation,
        VF.Renderer.Backends.SVG
    );

    // Cria o Artist usando a largura disponível
    const artist = new vextab.Artist(
        10,
        10,
        availableWidth,
        { scale: 1.0 }
    );

    const tab = new vextab.VexTab(artist);

    tab.parse(data);
    artist.render(renderer);

    window.dispatchEvent(new Event("tabRendered"));
}

const tablature = document.querySelector("#tabId");

if (tablature) {
    loadTab(tablature.dataset.id);
}

let resizeTimeout;

window.addEventListener("resize", () => {

    if (!currentNotes)
        return;

    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {
        renderTab(currentNotes);
    }, 200);

});