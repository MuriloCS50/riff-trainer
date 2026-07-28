# Project Title: Riff Trainer
#### Video Demo: https://youtu.be/9wQ6o6B2LMk?si=4xwffU2frBbPYWVg
#### Description:
  A guitar tablature HTML viewer with integrated MIDI for training guitar riffs. The application allows users to view tablatures and listen to dynamically generated MIDI audio, providing a tool for guitar players to learn and practice riffs by visualizing the tablature and hearing the audio at the same time.

# Context

A riff is a short, repeated musical phrase often used in rock and metal music. Riffs are typically played on guitar and are characterized by their catchy, memorable nature. They can be simple or complex, and they often serve as the foundation for a song's structure.

A tablature is a form of musical notation used to transcribe guitar riffs. It visually represents the strings and frets of the guitar so the player can quickly understand how to play a song by looking at the note positions.

This project is a web application that allows users to view guitar tablatures and listen to dynamically generated MIDI audio. The application is built using Flask for the backend, SQLite for the database, and JavaScript libraries such as Tone.js and VexTab for rendering tablatures and generating audio. The main goal is to provide a tool for guitar players to learn and practice riffs by visualizing the tablature and hearing the audio at the same time. Users can select from a collection of riffs stored in the database, view the tablature, and listen to the MIDI audio with metronome and loop controls.

# Features
- View guitar tablatures in a visually appealing format using VexTab.
- Listen to dynamically generated MIDI audio of the selected tablature using Tone.js.
- Control playback speed with a BPM input field.
- Toggle a metronome to help with timing while practicing.
- Loop the audio for continuous practice.
- Store and manage tablatures in a SQLite database for easy retrieval and updates.
- Use Flask sessions to track recently accessed pages and favorited tablatures for a personalized experience.

# How to execute locally
1. Clone the repository and navigate to the project directory.
2. Create a virtual environment and activate it:
    ```
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3. Install the required Python packages using pip:
    ```
    pip install -r requirements.txt
    ```
4. Run the Flask application:
    ```
    python app.py
    ```
    5. Follow the instructions in the terminal to access the application in your web browser, typically at `http://localhost:5000`.
# Design Choices

One of the main design decisions was to separate tablature rendering, audio generation, cursor synchronization, and DOM manipulation into independent JavaScript files. Although combining these features into a single script would have reduced the number of files, separating responsibilities makes the code easier to maintain and extend.

SQLite was chosen because the project's data model is small and does not require a dedicated database server. It is lightweight and easy to set up, which makes it a good choice for this project.

Flask was selected because of its simplicity and seamless integration with Python, allowing rapid development of routes and database access.

## Main structure
### app.py

This file is the core of the Flask application. It serves data to other pages, including forms, JSON endpoints, and database rows.

`app.py` controls the application flow by fetching entries from `riffs.db` and managing routes and request handlers. It dynamically loads HTML pages based on the selected riff. The application data flow is:

#### SQLite → Flask → JSON → JavaScript → Tone.js/VexTab

`app.py` fetches tablature-specific information and exposes it as JSON so the JavaScript files can render notation with VexTab and generate audio with Tone.js.

This file also uses Flask sessions and cookies to store information such as recently accessed pages and favorited tablatures.

### templates / base.html

`base.html` contains the shared structure for pages and provides a template for other pages to extend.

#### index.html
The homepage, where the user can access the main functions of the Application, such as select and open a tablature

#### tab.html

The tab page renders the VexTab tablature and includes audio preview controls such as a toggleable metronome, loop checkbox, and BPM input field.

### static
These are files that shouldn't be altered by Flask, such as stylesheets, images and JavaScript files.

#### styles.css

This stylesheet controls the application's visuals, including colors, layout, fonts, and alignment. It makes the interface more appealing and easier to use.

#### img

This folder contains the images used in the application.

#### audio.js

This file generates MIDI audio for the selected tablature using Tone.js. The code flow is:
- fetch JSON for the selected tab
- convert note attributes to Tone.js notation
- schedule each converted note
- play the preview when the user clicks the preview button

It also handles the metronome, which plays a click sound at the selected BPM and can be toggled on or off. By separating audio generation from tablature rendering, the code stays better organized and easier to maintain.

#### tabDisplay.js

This file renders the tablature by converting note data from the database into VexTab notation. It also uses note metadata to add dynamic styling to the tablature, such as rhythm, pitch, and notation details.

#### cursorSync.js

This file renders and updates the playback cursor in sync with the selected BPM, providing a visual indication of the current playback position. Each function handles a different cursor behavior, such as updating position during playback or resetting the cursor when audio stops or loops.

#### visuals.js

This script handles DOM manipulation and dynamic styling, such as formatting text, updating icons, and managing element visibility. Keeping this logic separate avoids cluttering the audio and tablature rendering code.

### riffs.db

The project's database stores tablatures and related information such as time signatures, names, rhythms, and pitch. It is used for persistent data storage. The database structure supports easy retrieval of tablature data, which is essential for rendering notation and generating audio. It can be updated with new tablatures or modified entries, making it a flexible way to manage application data.

### noteinsert.py

This helper script simplifies inserting new tablatures into the database. It supports notation for articulations, muting, and picking styles to better represent guitar playing nuances.

The script reads a JSON file containing riff metadata and note data, then inserts it into the database in the correct format. Initially, database inserts were handled manually. As the project grew, this script was added to make data entry faster and more reliable.

The script uses `argparse`, so it can be run from the command line and integrated into a workflow for managing tablature data.

Usage:
- To insert a new riff: `python scripts/noteinsert.py --json_file path/to/riff.json`
- To update notation for existing notes: `python scripts/noteinsert.py --json_file path/to/riff.json --update`

The JSON file should have the structure:

```json
{
  "name": "riff_name",
  "time_signature": "4/4",
  "difficulty": "beginner/intermediate/advanced",
  "notes": [
    {"string": 6, "fret": 5, "position": 0.0, "duration": "8n", "notation": "downstroke"},
    ...
  ]
}
```

The JSON files used are stored in `scripts/jsonFiles`.

## References
- VexTab documentation: https://www.vexflow.com/vextab/docs/
- Tone.js documentation: https://tonejs.github.io/docs/
- ChatGPT for structural and organizational advice, and for library usage and code snippets
- Copilot for code generation and problem-solving
