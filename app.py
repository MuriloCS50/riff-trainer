from flask import Flask, redirect, render_template, request, jsonify, session
import sqlite3

conn = sqlite3.connect("riffs.db")
cursor = conn.cursor()

app = Flask(__name__)
app.secret_key = "oksdokSVMoDgeior12fsa232"

@app.route("/", methods=["GET", "POST"])
def index():

    # Create session variables if they haaven't been declared yet

    if "recent" not in session:
        session["recent"] = []

    if "favorites" not in session:
        session["favorites"] = []

    conn = sqlite3.connect("riffs.db")
    cursor = conn.cursor()

    # Query the database for tab indormation

    tabInfo = cursor.execute(
        """
        SELECT name, difficulty
        FROM riffs
        """).fetchall()

    # Get the session's favorites and recent lists

    favorites = session.get("favorites", [])

    recent = session.get("recent", [])

    # Render the main page with database and session info

    return render_template("index.html", tabInfo=tabInfo, recent=recent, favorites=favorites)

@app.route("/tab", methods=["GET"])
def tab():

    chosen = request.args.get("tab") or request.form.get("tab")

    if not chosen:
        return redirect("/")
    
    conn = sqlite3.connect("riffs.db")
    cursor = conn.cursor()

    # Get the selected riff's id and time signature, block invalid selections

    try:
        selectedId = cursor.execute(
            """
            SELECT id
            FROM riffs
            WHERE name LIKE ?
            """, (chosen,)).fetchone()[0]
        
        selectedTimeSignature = cursor.execute(
            """
            SELECT time_signature
            FROM riffs
            WHERE name LIKE ?
            """, (chosen,)).fetchone()[0]
        
    except TypeError:
        selectedId = "inexistent"
        selectedTimeSignature = "inexistent"
        return redirect("/")
    
    if "recent" not in session:
        session["recent"] = []

    # Avoid duplicates

    if chosen in session["recent"]:
        session["recent"].remove(chosen)

    # Add the selected riff to recent, limit to 5 entries

    session["recent"].insert(0, chosen)
    session["recent"] = session["recent"][:5]

    # Pass the favorited status of the selected riff to the tab page

    if selectedId in session.get("favorites", []):
        favorited = True
    else:
        favorited = False

    cursor.close()

    return render_template("tab.html", exercise=chosen, id=selectedId, time_signature=selectedTimeSignature, favorited=favorited)

# API route to render the selected riff as a JSON object and use it in the JavaScript codes

@app.route("/riff/<int:riff_id>")
def get_riff(riff_id):
    
    conn = sqlite3.connect("riffs.db")
    cursor = conn.cursor()

    # Get all of the selected riff's notes
    notes = cursor.execute(
    """
    SELECT string, fret, duration, position, notation
    FROM notes
    WHERE riff_id = ?
    ORDER BY position
    """, (riff_id,)).fetchall()

    conn.close()

    # Create a list to populate in JSON format
    notes_list = []

    for note in notes:
        notes_list.append({
            "string": note[0],
            "fret": note[1],
            "duration": note[2],
            "position": note[3],
            "notation": note[4]
        })

    return jsonify(notes_list)

# API route to toggle the favorited status of a riff and update the session variable

@app.route("/toggle-favorite", methods=["POST"])
def toggle_favorite():
    riff_id = str(request.json.get("riff_id"))

    if "favorites" not in session:
        session["favorites"] = []

    # Toggle logic for the favorited status of the selected riff

    if int(riff_id) in session["favorites"]:
        session["favorites"].remove(int(riff_id))
        favorited = False
    else:
        session["favorites"].append(int(riff_id))
        favorited = True

    # Save the session changes

    session.modified = True

    return(jsonify({"favorited": favorited}))


# Run app in debug mode
if __name__ == "__main__":
    app.run(debug=True)