{
  /* <script> */
}
// Flags: duplicate a set so the drifting row loops seamlessly
const flagRow = document.getElementById("flagRow");
let flagsHTML = "";
for (let i = 0; i < 24; i++) {
  flagsHTML +=
    '<div class="flag"><div class="pole"></div><div class="cloth"></div></div>';
}
flagRow.innerHTML = flagsHTML + flagsHTML;

// Real tracks, one per rotation. Swap videoId/playlistId for your own picks any time —
// find a YouTube video/playlist and copy the ID from its URL (v= or list=).
const rotationOrder = [
  "वारीची वाट",
  "तुकाराम अभंग",
  "ज्ञानेश्वर अभंग",
  "काकड आरती",
  "संपूर्ण हरिपाठ",
  "भूपाळी",
  "सर्व गाणी",
];
const tracks = {
  "वारीची वाट": {
    videoId: "FFlKcRISv78",
    title: "विठ्ठल, तुकाराम अभंग — वारी भजन",
  },
  "तुकाराम अभंग": {
    playlistId: "PLe2RhnyOwD8h1yVVIpE5sBzmXI0tCw42Z",
    title: "तुकाराम महाराज अभंग — नॉनस्टॉप प्लेलिस्ट",
  },
  "संपूर्ण हरिपाठ": {
    videoId: "Wk38Ye-LZY4",
    title: "संपूर्ण हरिपाठ — संपूर्ण अभंग",
  },
  "ज्ञानेश्वर अभंग": {
    playlistId: "PLe2RhnyOwD8io1kiQmC_1Vj0LSayka0_1",
    title: "ज्ञानेश्वर माऊली अभंग — नॉनस्टॉप प्लेलिस्ट",
  },
  "काकड आरती": { videoId: "6TvJQeO8qfY", title: "संपूर्ण काकड आरती" },
  भूपाळी: {
    videoId: "lz6jg2ybOL4",
    title: "काकड आरती व भूपाळी — पांडुरंगाची",
  },
  "सर्व गाणी": { videoId: "80ddNdIt62U", title: "नॉनस्टॉप अभंग मिक्स" },
};

const taalBtn = document.getElementById("taalBtn");
const playIcon = document.getElementById("playIcon");
const npTitle = document.getElementById("npTitle");
const npSub = document.getElementById("npSub");
const npLabel = document.getElementById("npLabel");
const nowPlaying = document.getElementById("nowPlaying");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const dpBar = document.getElementById("dpBar");
const dpFill = document.getElementById("dpFill");
const dpKnob = document.getElementById("dpKnob");
const dpTime = document.getElementById("dpTime");
const dpVolBar = document.getElementById("dpVolBar");
const dpVolFill = document.getElementById("dpVolFill");

const PATH_PLAY = "M8 5v14l11-7z";
const PATH_PAUSE = "M6 5h4v14H6zM14 5h4v14h-4z";

let ytPlayer = null;
let ytReady = false;
let currentRotation = "काकड आरती";
let isPlaying = false;
let seeking = false;

function fmt(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60),
    sec = Math.floor(s % 60);
  return m + ":" + String(sec).padStart(2, "0");
}

function setPlayingUI(playing) {
  isPlaying = playing;
  taalBtn.setAttribute("aria-pressed", String(playing));
  taalBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
  playIcon.setAttribute("d", playing ? PATH_PAUSE : PATH_PLAY);
  npLabel.textContent = playing ? "Now Playing" : "Paused";
}

function reflectRotationInfo(name) {
  currentRotation = name;
  npTitle.textContent = tracks[name].title;
  npSub.textContent = name + " rotation";
  document
    .querySelectorAll(".chip")
    .forEach((c) => c.classList.toggle("active", c.dataset.name === name));
}

function loadTrack(name, autoplay) {
  if (!ytReady) return;
  reflectRotationInfo(name);
  const track = tracks[name];
  if (track.playlistId) {
    ytPlayer.loadPlaylist({
      list: track.playlistId,
      listType: "playlist",
    });
  } else {
    ytPlayer.loadVideoById(track.videoId);
  }
  if (!autoplay) setTimeout(() => ytPlayer.pauseVideo(), 400);
}

function stepRotation(dir) {
  const track = tracks[currentRotation];
  if (track.playlistId && ytReady) {
    dir > 0 ? ytPlayer.nextVideo() : ytPlayer.previousVideo();
    return;
  }
  const i = rotationOrder.indexOf(currentRotation);
  const next =
    rotationOrder[(i + dir + rotationOrder.length) % rotationOrder.length];
  loadTrack(next, true);
}

function togglePlay() {
  if (!ytReady) {
    npLabel.textContent = "Tuning in…";
    return;
  }
  const state = ytPlayer.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
}

taalBtn.addEventListener("click", togglePlay);
nowPlaying.addEventListener("click", togglePlay);
nowPlaying.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    togglePlay();
  }
});
prevBtn.addEventListener("click", () => stepRotation(-1));
nextBtn.addEventListener("click", () => stepRotation(1));

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => loadTrack(chip.dataset.name, true));
});

// Generic draggable slider (progress + volume), pointer-events based
function makeSlider(bar, onRatio) {
  let dragging = false;
  function ratioFromEvent(e) {
    const rect = bar.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    return Math.min(1, Math.max(0, x / rect.width));
  }
  bar.addEventListener("pointerdown", (e) => {
    dragging = true;
    onRatio(ratioFromEvent(e), true);
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener("pointermove", (e) => {
    if (dragging) onRatio(ratioFromEvent(e), true);
  });
  bar.addEventListener("pointerup", (e) => {
    dragging = false;
    onRatio(ratioFromEvent(e), false);
  });
  bar.addEventListener("pointercancel", () => {
    dragging = false;
  });
}

makeSlider(dpBar, (ratio, isDragging) => {
  seeking = true;
  dpFill.style.width = ratio * 100 + "%";
  dpKnob.style.left = ratio * 100 + "%";
  if (!isDragging && ytReady) {
    const dur = ytPlayer.getDuration();
    ytPlayer.seekTo(dur * ratio, true);
    seeking = false;
  }
});

makeSlider(dpVolBar, (ratio) => {
  dpVolFill.style.width = ratio * 100 + "%";
  if (ytReady) ytPlayer.setVolume(Math.round(ratio * 100));
});

function tickProgress() {
  if (!ytReady || seeking) return;
  const dur = ytPlayer.getDuration();
  const cur = ytPlayer.getCurrentTime();
  if (dur > 0) {
    const pct = (cur / dur) * 100;
    dpFill.style.width = pct + "%";
    dpKnob.style.left = pct + "%";
  }
  dpTime.textContent = fmt(cur) + " / " + fmt(dur);
}
setInterval(tickProgress, 500);

window.onYouTubeIframeAPIReady = function () {
  const first = tracks[currentRotation];
  ytPlayer = new YT.Player("ytPlayer", {
    height: "124",
    width: "220",
    videoId: first.playlistId ? undefined : first.videoId,
    playerVars: Object.assign(
      { rel: 0, controls: 0, modestbranding: 1, playsinline: 1 },
      first.playlistId ? { listType: "playlist", list: first.playlistId } : {},
    ),
    events: {
      onReady: () => {
        ytReady = true;
        reflectRotationInfo(currentRotation);
        ytPlayer.setVolume(70);
        dpVolFill.style.width = "70%";
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) setPlayingUI(true);
        if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED)
          setPlayingUI(false);
      },
    },
  });
};

// Gently drifting "pilgrims listening" count — cosmetic only, not a real live count.
const countEl = document.getElementById("pilgrimCount");
let count = 128;
setInterval(() => {
  count += Math.random() > 0.5 ? 1 : -1;
  count = Math.max(60, count);
  countEl.textContent = count;
}, 3200);
{
  /* </script> */
}
