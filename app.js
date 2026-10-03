/* =========================================
   HANDLEBAR
   Automatic Music Player
   ========================================= */

(() => {
    "use strict";

    // =====================================
    // Elements
    // =====================================

    const audio = document.getElementById("audio");

    const songTitle = document.getElementById("song-title");
    const songArtist = document.getElementById("song-artist");
    const albumArt = document.getElementById("album-art");

    const playButton = document.getElementById("play-button");
    const previousButton = document.getElementById("previous-button");
    const nextButton = document.getElementById("next-button");

    const shuffleButton = document.getElementById("shuffle-button");
    const repeatButton = document.getElementById("repeat-button");

    const progress = document.getElementById("progress");

    const currentTimeDisplay =
        document.getElementById("current-time");

    const durationDisplay =
        document.getElementById("duration");

    const volume =
        document.getElementById("volume");

    const songList =
        document.getElementById("song-list");

    const songCount =
        document.getElementById("song-count");

    const status =
        document.getElementById("status");


    // =====================================
    // State
    // =====================================

    let songs = [];

    let currentSongIndex = -1;

    let isShuffle = false;

    let isRepeat = false;


    // =====================================
    // Initialization
    // =====================================

    async function init() {

        audio.volume = Number(volume.value);

        status.textContent = "Loading...";

        await loadMusicLibrary();

    }


    // =====================================
    // Load Music Library
    // =====================================

    async function loadMusicLibrary() {

        try {

            const response =
                await fetch("/api/music", {
                    cache: "no-store"
                });

            if (!response.ok) {
                throw new Error(
                    `Server returned ${response.status}`
                );
            }

            const data = await response.json();

            if (!data.success || !Array.isArray(data.songs)) {
                throw new Error(
                    "Invalid music library response."
                );
            }

            songs = data.songs;

            renderSongList();

            if (songs.length > 0) {

                loadSong(0, false);

                status.textContent = "Ready";

            } else {

                status.textContent = "No Music";

            }

        } catch (error) {

            console.error(
                "Could not load Handlebar music library:",
                error
            );

            songs = [];

            renderSongList();

            status.textContent = "Server Error";

        }

    }


    // =====================================
    // Format Time
    // =====================================

    function formatTime(seconds) {

        if (
            !Number.isFinite(seconds) ||
            seconds < 0
        ) {
            return "0:00";
        }

        const minutes =
            Math.floor(seconds / 60);

        const remainingSeconds =
            Math.floor(seconds % 60)
                .toString()
                .padStart(2, "0");

        return `${minutes}:${remainingSeconds}`;

    }


    // =====================================
    // Load Song
    // =====================================

    function loadSong(index, autoplay = false) {

        if (songs.length === 0) {
            return;
        }

        if (index < 0) {
            index = songs.length - 1;
        }

        if (index >= songs.length) {
            index = 0;
        }

        currentSongIndex = index;

        const song = songs[currentSongIndex];

        audio.pause();

        audio.src = song.file;

        audio.load();

        songTitle.textContent =
            song.title || "Unknown Song";

        songArtist.textContent =
            song.artist || "Unknown Artist";

        albumArt.textContent =
            song.icon || "🎵";

        progress.value = 0;

        currentTimeDisplay.textContent = "0:00";

        durationDisplay.textContent = "0:00";

        updateSongList();

        status.textContent = "Ready";

        if (autoplay) {
            playSong();
        }

    }


    // =====================================
    // Play
    // =====================================

    async function playSong() {

        if (songs.length === 0) {
            return;
        }

        if (currentSongIndex === -1) {
            loadSong(0, false);
        }

        try {

            await audio.play();

            playButton.textContent = "⏸";

            playButton.setAttribute(
                "aria-label",
                "Pause"
            );

            status.textContent = "Playing";

        } catch (error) {

            console.error(
                "Handlebar playback error:",
                error
            );

            status.textContent = "Playback Error";

        }

    }


    // =====================================
    // Pause
    // =====================================

    function pauseSong() {

        audio.pause();

        playButton.textContent = "▶";

        playButton.setAttribute(
            "aria-label",
            "Play"
        );

        status.textContent = "Paused";

    }


    // =====================================
    // Play / Pause
    // =====================================

    playButton.addEventListener("click", () => {

        if (audio.paused) {
            playSong();
        } else {
            pauseSong();
        }

    });


    // =====================================
    // Previous Song
    // =====================================

    previousButton.addEventListener("click", () => {

        if (songs.length === 0) {
            return;
        }

        if (audio.currentTime > 3) {

            audio.currentTime = 0;

            return;
        }

        loadSong(
            currentSongIndex - 1,
            true
        );

    });


    // =====================================
    // Next Song
    // =====================================

    nextButton.addEventListener("click", () => {

        playNextSong();

    });


    function playNextSong() {

        if (songs.length === 0) {
            return;
        }

        let nextIndex;

        if (isShuffle && songs.length > 1) {

            do {

                nextIndex =
                    Math.floor(
                        Math.random() * songs.length
                    );

            } while (
                nextIndex === currentSongIndex
            );

        } else {

            nextIndex =
                currentSongIndex + 1;

            if (nextIndex >= songs.length) {
                nextIndex = 0;
            }

        }

        loadSong(nextIndex, true);

    }


    // =====================================
    // Song Ended
    // =====================================

    audio.addEventListener("ended", () => {

        if (isRepeat) {

            audio.currentTime = 0;

            playSong();

            return;
        }

        playNextSong();

    });


    // =====================================
    // Progress
    // =====================================

    audio.addEventListener("timeupdate", () => {

        if (
            !Number.isFinite(audio.duration) ||
            audio.duration <= 0
        ) {
            return;
        }

        const percentage =
            (audio.currentTime / audio.duration) * 100;

        progress.value = percentage;

        currentTimeDisplay.textContent =
            formatTime(audio.currentTime);

        durationDisplay.textContent =
            formatTime(audio.duration);

    });


    // =====================================
    // Seek
    // =====================================

    progress.addEventListener("input", () => {

        if (
            !Number.isFinite(audio.duration) ||
            audio.duration <= 0
        ) {
            return;
        }

        const percentage =
            Number(progress.value) / 100;

        audio.currentTime =
            audio.duration * percentage;

    });


    // =====================================
    // Volume
    // =====================================

    volume.addEventListener("input", () => {

        audio.volume =
            Number(volume.value);

    });


    // =====================================
    // Shuffle
    // =====================================

    shuffleButton.addEventListener("click", () => {

        isShuffle = !isShuffle;

        shuffleButton.classList.toggle(
            "active",
            isShuffle
        );

        shuffleButton.setAttribute(
            "aria-label",
            isShuffle
                ? "Shuffle enabled"
                : "Shuffle disabled"
        );

    });


    // =====================================
    // Repeat
    // =====================================

    repeatButton.addEventListener("click", () => {

        isRepeat = !isRepeat;

        repeatButton.classList.toggle(
            "active",
            isRepeat
        );

        repeatButton.setAttribute(
            "aria-label",
            isRepeat
                ? "Repeat enabled"
                : "Repeat disabled"
        );

    });


    // =====================================
    // Render Song List
    // =====================================

    function renderSongList() {

        songList.innerHTML = "";

        songCount.textContent =
            `${songs.length} ${
                songs.length === 1
                    ? "song"
                    : "songs"
            }`;

        if (songs.length === 0) {

            songList.innerHTML = `
                <div class="empty-library">

                    <div class="empty-icon">
                        🎵
                    </div>

                    <h3>No music yet</h3>

                    <p>
                        Add songs to the Handlebar
                        music folder.
                    </p>

                </div>
            `;

            return;
        }

        songs.forEach((song, index) => {

            const item =
                document.createElement("div");

            item.className = "song-item";

            item.dataset.index = index;

            item.innerHTML = `

                <div class="song-number">
                    ${index + 1}
                </div>

                <div class="song-details">

                    <div class="song-title">
                        ${escapeHTML(
                            song.title ||
                            "Unknown Song"
                        )}
                    </div>

                    <div class="song-artist">
                        ${escapeHTML(
                            song.artist ||
                            "Unknown Artist"
                        )}
                    </div>

                </div>

                <div class="song-duration">
                    —
                </div>

            `;

            item.addEventListener(
                "click",
                () => {
                    loadSong(index, true);
                }
            );

            songList.appendChild(item);

        });

        updateSongList();

    }


    // =====================================
    // Active Song
    // =====================================

    function updateSongList() {

        const items =
            songList.querySelectorAll(
                ".song-item"
            );

        items.forEach((item, index) => {

            item.classList.toggle(
                "active",
                index === currentSongIndex
            );

        });

    }


    // =====================================
    // Escape HTML
    // =====================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // =====================================
    // Metadata
    // =====================================

    audio.addEventListener(
        "loadedmetadata",
        () => {

            durationDisplay.textContent =
                formatTime(audio.duration);

        }
    );


    // =====================================
    // Playback Events
    // =====================================

    audio.addEventListener("play", () => {

        playButton.textContent = "⏸";

        playButton.setAttribute(
            "aria-label",
            "Pause"
        );

        status.textContent = "Playing";

    });


    audio.addEventListener("pause", () => {

        playButton.textContent = "▶";

        playButton.setAttribute(
            "aria-label",
            "Play"
        );

        if (!audio.ended) {
            status.textContent = "Paused";
        }

    });


    // =====================================
    // Audio Error
    // =====================================

    audio.addEventListener("error", () => {

        status.textContent = "Song Error";

        console.error(
            "Handlebar could not load:",
            audio.src
        );

    });


    // =====================================
    // Keyboard Controls
    // Useful when testing on a computer
    // =====================================

    document.addEventListener(
        "keydown",
        (event) => {

            // Space = Play/Pause
            if (event.code === "Space") {

                event.preventDefault();

                if (audio.paused) {
                    playSong();
                } else {
                    pauseSong();
                }

            }

            // Left = Previous
            if (event.code === "ArrowLeft") {

                previousButton.click();

            }

            // Right = Next
            if (event.code === "ArrowRight") {

                nextButton.click();

            }

            // Up = Volume Up
            if (event.code === "ArrowUp") {

                event.preventDefault();

                const newVolume =
                    Math.min(
                        1,
                        audio.volume + 0.05
                    );

                audio.volume = newVolume;

                volume.value = newVolume;

            }

            // Down = Volume Down
            if (event.code === "ArrowDown") {

                event.preventDefault();

                const newVolume =
                    Math.max(
                        0,
                        audio.volume - 0.05
                    );

                audio.volume = newVolume;

                volume.value = newVolume;

            }

        }
    );


    // =====================================
    // Start
    // =====================================

    init();

})();
