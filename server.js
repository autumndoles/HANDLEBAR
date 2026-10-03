const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const ROOT_DIR = __dirname;
const MUSIC_DIR = path.join(ROOT_DIR, "music");

// =========================================
// Static Files
// =========================================

app.use(express.static(ROOT_DIR));

// =========================================
// Music Library
// =========================================

app.get("/api/music", (req, res) => {
    fs.readdir(MUSIC_DIR, { withFileTypes: true }, (error, files) => {

        if (error) {
            console.error("Could not read music directory:", error);

            return res.status(500).json({
                success: false,
                error: "Could not read music directory."
            });
        }

        const songs = files
            .filter(file => file.isFile())
            .filter(file => {
                const extension =
                    path.extname(file.name).toLowerCase();

                return [
                    ".mp3",
                    ".wav",
                    ".ogg",
                    ".m4a",
                    ".aac",
                    ".flac"
                ].includes(extension);
            })
            .sort((a, b) =>
                a.name.localeCompare(
                    b.name,
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base"
                    }
                )
            )
            .map(file => {

                const filename = file.name;

                return {
                    title: path.basename(
                        filename,
                        path.extname(filename)
                    ),
                    artist: "Unknown Artist",
                    file: `/music/${encodeURIComponent(filename)}`,
                    icon: "🎵"
                };

            });

        res.json({
            success: true,
            count: songs.length,
            songs: songs
        });

    });
});

// =========================================
// Health Check
// =========================================

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        name: "Handlebar",
        status: "running"
    });

});

// =========================================
// Start Server
// =========================================

app.listen(PORT, "0.0.0.0", () => {

    console.log("=================================");
    console.log(" HANDLEBAR");
    console.log(" Music Server");
    console.log("=================================");
    console.log(`Running on port ${PORT}`);
    console.log(`Music directory: ${MUSIC_DIR}`);

});
