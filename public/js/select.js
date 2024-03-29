let socket;
let userId;
let socketId;
let connectInterval;
let timerInterval;
let dateArr = [];
let timerStatus = 0;
let tracks;
let songs = [];
let availableTracks = [];
let songSelection = -1;
let difficultySelection = 0;
let timeGap = [];

const durmroll = new Howl({
  src: [`/sounds/drumroll.mp3`],
  format: ["mp3"],
  autoplay: false,
  loop: false,
});

const symbals = new Howl({
  src: [`/sounds/symbals.mp3`],
  format: ["mp3"],
  autoplay: false,
  loop: false,
});

const sortAsName = (a, b) => {
  if (a.name == b.name) return 0;
  return a.name > b.name ? 1 : -1;
};

const sortAsProducer = (a, b) => {
  if (a.producer == b.producer) return 0;
  return a.producer > b.producer ? 1 : -1;
};

const sortAsDifficulty = (a, b) => {
  a = JSON.parse(a.difficulty)[difficultySelection];
  b = JSON.parse(b.difficulty)[difficultySelection];
  if (a == b) return 0;
  return a > b ? 1 : -1;
};

const sortAsBPM = (a, b) => {
  if (a.bpm == b.bpm) return 0;
  return a.bpm > b.bpm ? 1 : -1;
};

document.addEventListener("DOMContentLoaded", () => {
  fetch(`${api}/tracks`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.result == "success") {
        tracks = data.tracks;
        tracks.sort(sortAsName);
        tracksUpdate();
        const urlSearchParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlSearchParams.entries());
        if (!("u" in params)) {
          alert("ID setting is required.");
        } else {
          socketInitialize(params.u);
        }
        Howler.volume(1);
      } else {
        alert("Failed to load song list.");
        console.error("Failed to load song list.");
      }
    });
});

const socketInitialize = (id) => {
  userId = id;
  socket = io(game);

  socket.on("connect", () => {
    socket.on("broadcast", (id) => {
      socketId = id;
      tryConnect();
      connectInterval = setInterval(tryConnect, 3000);
    });

    socket.on("connected", () => {
      socket.emit("select loaded", id);
      updateDetails(songSelection);
      clearInterval(connectInterval);
      timeGap = [new Date()];
      socket.emit("time get");
    });

    socket.on("select sync", (date, finDate) => {
      dateArr = [date, finDate];
      timerInterval = setInterval(timer, 100);
    });

    socket.on("selecting", (id, track, producer, file) => {
      document.getElementsByClassName("randomContainerTrack")[id - 1].textContent = track;
      document.getElementsByClassName("randomContainerProducer")[id - 1].textContent = producer;
      document.getElementsByClassName("randomContainerImage")[id - 1].style.backgroundImage = `url("${cdn}/albums/100/${file} (Custom).png")`;
    });

    socket.on("selected sync", (userNames, nickname, track, producer, file) => {
      difficulties = JSON.parse(tracks[tracks.findIndex((e) => e.fileName == file)].difficulty);
      for (let i = 0; i <= 2; i++) {
        document.getElementsByClassName("difficultyNumber")[i].textContent = difficulties[i];
        document.getElementsByClassName("difficultySelectionNumber")[i].textContent = difficulties[i];
      }
      if (difficulties[difficultySelection] == 0) {
        difficultySelected(0);
      } else {
        difficultySelected(difficultySelection);
      }
      localStorage.file = file;
      for (let i in userNames) {
        document.getElementsByClassName("randomContainerName")[i].textContent = userNames[i];
      }
      songs[songSelection].fade(1, 0, 500);
      setTimeout(() => {
        songs[songSelection].stop();
      }, 500);
      document.getElementById("randomContainerBackground").classList.add("show");
      setTimeout(() => {
        document.getElementById("randomContainer").classList.add("zoomIn");
        durmroll.play();
        timerInterval = setInterval(roll, 50);
        setTimeout(() => {
          let index = userNames.indexOf(nickname);
          clearInterval(timerInterval);
          document.getElementsByClassName("randomContainerArrow")[0].classList.remove("show");
          document.getElementsByClassName("randomContainerArrow")[1].classList.remove("show");
          document.getElementsByClassName("randomContainerArrow")[2].classList.remove("show");
          document.getElementsByClassName("randomContainerArrow")[index].classList.add("show");
          document.getElementById("randomContainerBackground").style.backgroundImage = `url("${cdn}/albums/100/${file} (Custom).png")`;
          document.getElementById("randomContainer").classList.remove("zoomIn");
          document.getElementById("randomContainer").classList.add("zoomOut");
          symbals.play();
          const find = tracks.findIndex((obj) => obj.fileName == file);
          setTimeout(() => {
            document.getElementsByClassName("randomContainerTrackContainer")[0].classList.add("hide");
            document.getElementsByClassName("randomContainerTrackContainer")[1].classList.add("hide");
            document.getElementsByClassName("randomContainerTrackContainer")[2].classList.add("hide");
            document.getElementsByClassName("randomContainerTrackContainer")[index].classList.remove("hide");
            document.getElementsByClassName("randomContainerTrackContainer")[index].classList.add("selected");
            document.getElementsByClassName("randomContainerTrackContainer")[index].style.left = `${index == 0 ? "25vw" : index == 1 ? "0vw" : "-25vw"}`;
            songs[find].volume(1);
            Howler.volume(1);
            songs[find].play();
            socket.emit("select finish", userId);
          }, 1000);
        }, 3000);
      }, 2000);
    });

    socket.on("play", () => {
      window.location.href = `${url}/play?u=${userId}`;
    });

    socket.on("time", (time) => {
      time = new Date(time);
      let d = new Date();
      let len = timeGap.length;
      let target = timeGap[len - 1];
      timeGap[len - 1] = target - time >= 0 ? target - time - (d - target) / 2 : target - time + (d - target) / 2;
      if (len >= 10) {
        timeGap.sort((a, b) => a - b);
        let start = 4;
        let sum = 0;
        for (let i = start; i < start + 3; i++) {
          sum += timeGap[i];
        }
        timeGap = Math.round(sum / 3);
      } else {
        timeGap[len] = new Date();
        socket.emit("time get");
      }
    });

    socket.on("admin disconnected", () => {
      window.location.href = `${url}/?u=${userId}`;
    });
  });
};

let rollN = 0;
const roll = () => {
  document.getElementsByClassName("randomContainerArrow")[0].classList.remove("show");
  document.getElementsByClassName("randomContainerArrow")[1].classList.remove("show");
  document.getElementsByClassName("randomContainerArrow")[2].classList.remove("show");
  document.getElementsByClassName("randomContainerArrow")[rollN].classList.add("show");
  rollN++;
  if (rollN >= 3) rollN = 0;
};

const timer = () => {
  let d = new Date();
  if (new Date(dateArr[0]).getTime() + timeGap <= d && timerStatus == 0) {
    timerStatus = 1;
    document.getElementById("overlayContainer").classList.add("hide");
    socket.emit("select started", userId);
    songs[songSelection].play();
  } else if (new Date(dateArr[1]).getTime() + timeGap <= d && timerStatus == 1) {
    timerStatus = 2;
    document.getElementById("overlayContainer").classList.remove("hide");
    socket.emit("selected", userId);
    clearInterval(timerInterval);
  }
  document.getElementById("selectTimeText").textContent = parseInt((new Date(dateArr[1]) - new Date()) / 1000) + 1;
};

const tryConnect = () => {
  console.log("trying to connect");
  socket.emit("handshake", userId, 5);
};

const tracksUpdate = () => {
  let songList = "";
  availableTracks = [];
  for (let i = 0; i < tracks.length; i++) {
    if (tracks[i].type == 3 || JSON.parse(tracks[i].difficulty)[0] == 0) {
      songList += `<div class="songSelectionContainer songSelectionDisable">
        <div class="songSelectionLottie"></div>
        <div class="songSelectionInfo">
            <span class="songSelectionTitle"></span>
            <span class="songSelectionArtist"></span>
        </div>
      </div>`;
      continue;
    }
    availableTracks.push(i);
    songs[i] = new Howl({
      src: [`${cdn}/tracks/preview/${tracks[i].fileName}.ogg`],
      format: ["ogg"],
      autoplay: false,
      loop: true,
    });
    songList += `<div class="songSelectionContainer" onclick="songSelected(${i})">
              <div class="songSelectionLottie"></div>
              <div class="songSelectionInfo">
                <div class="songSelectionTitle">
                  ${tracks[i].originalName}
                </div>
                <span class="songSelectionArtist">${tracks[i].producer}</span>
              </div>
          </div>`;
  }
  selectSongContainer.innerHTML = songList;
  if (songSelection == -1) {
    while (1) {
      let min = Math.ceil(0);
      let max = Math.floor(tracks.length);
      let result = Math.floor(Math.random() * (max - min)) + min;
      if (songs[result]) {
        songSelected(result);
        break;
      }
    }
  }
};

const sortSelected = (n, isInitializing) => {
  Array.prototype.forEach.call(document.getElementsByClassName("sortText"), (e) => {
    if (e.classList.contains("selected")) e.classList.remove("selected");
  });
  document.getElementsByClassName("sortText")[n].classList.add("selected");
  const sortArray = [sortAsName, sortAsProducer, sortAsDifficulty, sortAsBPM];
  if (songs[songSelection]) songs[songSelection].stop();
  const prevName = tracks[songSelection].fileName;
  tracks.sort(sortAsName);
  tracks.sort(sortArray[n]);
  tracksUpdate();
  const index = tracks.findIndex((obj) => obj.fileName == prevName);
  if (!isInitializing) songSelected(index, true);
};

const songSelected = (n, refreshed) => {
  loadingShow();
  if (songSelection == n && !refreshed) {
    timerStatus = 2;
    document.getElementById("overlayContainer").classList.remove("hide");
    socket.emit("selected", userId);
    clearInterval(timerInterval);
    loadingHide();
    return;
  }
  if (songSelection != -1) {
    if (songs[n]) songs[n].volume(1);
    if (!refreshed) {
      let i = songSelection;
      songs[i].fade(1, 0, 200);
      setTimeout(() => {
        songs[i].stop();
      }, 200);
    }
    if (songs[n]) songs[n].play();
  }
  if (document.getElementsByClassName("songSelected")[0]) {
    arrowAnim.destroy();
    document.getElementsByClassName("songSelected")[0].classList.remove("songSelected");
  }
  arrowAnim = bodymovin.loadAnimation({
    wrapper: document.getElementsByClassName("songSelectionContainer")[n].getElementsByClassName("songSelectionLottie")[0],
    animType: "canvas",
    loop: true,
    path: "lottie/arrow.json",
  });
  document.getElementsByClassName("songSelectionContainer")[n].classList.add("songSelected");
  if (selectTitle.offsetWidth > window.innerWidth / 4) {
    selectTitle.style.fontSize = "4vh";
  } else {
    selectTitle.style.fontSize = "5vh";
  }
  document.getElementById("selectTitle").textContent = tracks[n].originalName;
  document.getElementById("selectArtist").textContent = tracks[n].producer;
  document.getElementById("selectAlbum").src = `${cdn}/albums/100/${tracks[n].fileName} (Custom).png`;
  difficultySelection = 0;
  for (let i = 0; i <= 2; i++) {
    if (i != difficultySelection) {
      document.getElementsByClassName("difficulty")[i].classList.remove("difficultySelected");
      document.getElementsByClassName("difficultySelection")[i].classList.remove("selected");
    } else {
      document.getElementsByClassName("difficulty")[i].classList.add("difficultySelected");
      document.getElementsByClassName("difficultySelection")[i].classList.add("selected");
    }
    document.getElementsByClassName("difficultyNumber")[i].textContent = JSON.parse(tracks[n].difficulty)[i];
    document.getElementsByClassName("difficultySelectionNumber")[i].textContent = JSON.parse(tracks[n].difficulty)[i];
  }
  document.getElementById("selectBackground").style.backgroundImage = `url("${cdn}/albums/100/${tracks[n].fileName} (Custom).png")`;
  setTimeout(
    () => {
      let index = availableTracks.indexOf(n);
      let underLimit = window.innerHeight * 0.08 * index + window.innerHeight * 0.09;
      underLimit = parseInt(underLimit);
      if (selectSongContainer.offsetHeight + selectSongContainer.scrollTop < underLimit) {
        selectSongContainer.scrollTop = underLimit - selectSongContainer.offsetHeight;
      } else if (underLimit - window.innerHeight * 0.09 < selectSongContainer.scrollTop) {
        selectSongContainer.scrollTop = selectSongContainer.scrollTop - (selectSongContainer.scrollTop - underLimit) - window.innerHeight * 0.09;
      }
    },
    songSelection != -1 ? 0 : 200
  );
  fetch(`${api}/trackInfo/${tracks[n].name}`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      data = data.info[0];
      difficulties = JSON.parse(tracks[n].difficulty);
      bulletDensities = JSON.parse(data.bullet_density);
      noteDensities = JSON.parse(data.note_density);
      speeds = JSON.parse(data.speed);
      bpm = data.bpm;
      updateDetails(n);
    });
  songSelection = n;
};

const updateDetails = (n) => {
  if (socket) socket.emit("selecting", userId, tracks[n].originalName, tracks[n].producer, tracks[n].fileName, noteDensities[0], bulletDensities[0], bpm, speeds[0]);
  document.getElementById("bulletDensity").textContent = bulletDensities[difficultySelection];
  document.getElementById("bulletDensityValue").style.width = `${bulletDensities[difficultySelection]}%`;
  document.getElementById("noteDensity").textContent = noteDensities[difficultySelection];
  document.getElementById("noteDensityValue").style.width = `${noteDensities[difficultySelection]}%`;
  document.getElementById("bpmText").textContent = bpm;
  document.getElementById("bpmValue").style.width = `${bpm / 3}%`;
  document.getElementById("speed").textContent = speeds[difficultySelection];
  document.getElementById("speedValue").style.width = `${(speeds[difficultySelection] / 5) * 100}%`;
  let starText = "";
  for (let i = 0; i < difficulties[difficultySelection]; i++) {
    starText += "★";
  }
  for (let i = difficulties[difficultySelection]; i < 10; i++) {
    starText += "☆";
  }
  document.getElementById("selectStars").textContent = starText;
  loadingHide();
};

const loadingShow = () => {
  loadingCircle.style.pointerEvents = "all";
  loadingCircle.style.opacity = "1";
};

const loadingHide = () => {
  loadingCircle.style.pointerEvents = "none";
  loadingCircle.style.opacity = "0";
};

const difficultySelected = (n) => {
  if (difficulties[n] != 0) {
    document.getElementsByClassName("difficulty")[difficultySelection].classList.remove("difficultySelected");
    document.getElementsByClassName("difficulty")[n].classList.add("difficultySelected");
    document.getElementsByClassName("difficultySelection")[difficultySelection].classList.remove("selected");
    document.getElementsByClassName("difficultySelection")[n].classList.add("selected");
    difficultySelection = n;
    localStorage.difficulty = difficultySelection;
    socket.emit("difficulty select", userId, difficultySelection);
  }
};

document.onkeydown = (e) => {
  e = e || window.event;
  let key = e.key.toLowerCase();
  if (timerStatus == 1) {
    if (key == "arrowup") {
      e.preventDefault();
      if (songSelection != 0) {
        let i = songSelection - 1;
        while (tracks[i].type == 3 || JSON.parse(tracks[i].difficulty)[0] == 0) {
          if (i == 0) return;
          i--;
        }
        console.log(i);
        songSelected(i);
      }
    } else if (key == "arrowdown") {
      e.preventDefault();
      if (songSelection < tracks.length - 1) {
        let i = songSelection + 1;
        while (tracks[i].type == 3 || JSON.parse(tracks[i].difficulty)[0] == 0) {
          i++;
          if (i == tracks.length - 1) return;
        }
        console.log(i);
        songSelected(i);
      }
    } else if (key == "enter") {
      e.preventDefault();
      songSelected(songSelection);
    }
  }
};
