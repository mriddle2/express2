"use strict";

// Testing
const isTestMode = window.location.host === "jklm.localhost";
if (isTestMode) $(".top h1 a").textContent = "JKLM.LOCALHOST";

// Setup
const authButton = $(".top .setup .auth");

function updateAuthButton() {
  const service = settings.auth != null ? settings.auth.service : "guest";
  $(authButton, "img.service").src = `/images/auth/${service}.png`;
  $(authButton, "img.service").alt = getAuthServiceName(service);
  $(authButton, "span.nickname").textContent = settings.nickname;
}

const oauthServices = (function () {
  const setup = {
    discord: {
      clientId: "688126093424721954",
      loginUrl: null,
      profileUrl: "https://discord.com/api/users/@me"
    },
    twitch: {
      clientId: "6l484vmhkx7pri37va2qxgh3346qiq",
      loginUrl: null,
      profileUrl: "https://api.twitch.tv/helix/users"
    },
  };

  const discordRedirectUrl = `${window.location.protocol}//${window.location.host}/?login=discord`;
  const twitchRedirectUrl = `${window.location.protocol}//${window.location.host}/?login=twitch`;

  setup["discord"].loginUrl = `https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent(setup.discord.clientId)}&redirect_uri=${encodeURIComponent(discordRedirectUrl)}&response_type=token&scope=identify`;
  setup["twitch"].loginUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${encodeURIComponent(setup.twitch.clientId)}&redirect_uri=${encodeURIComponent(twitchRedirectUrl)}&response_type=token`;

  return setup;
})();


$(".chooseService.box a.discord").addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = oauthServices["discord"].loginUrl + "&prompt=consent";
});

$(".chooseService.box a.twitch").addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = oauthServices["twitch"].loginUrl + "&force_verify=true";
});

const setNicknameForm = $(".auth.page form.setNickname");
const activeServiceBox = $(".auth.page .activeService.box");
const jklmLoginForm = $(".auth.page form.jklmLogin");

$(activeServiceBox, ".logout button").addEventListener("click", (event) => {
  event.preventDefault();

  settings.auth = null;
  saveSettings();

  updateAuthButton();
  showAuthPage();
});

function showAuthPage() {
  $(".auth.page .nickname").value = settings.nickname;

  $show(".auth.page .chooseService.box", settings.auth == null);
  $show(activeServiceBox, settings.auth != null);
  $show(jklmLoginForm, settings.auth == null);

  if (settings.auth != null) {
    $(activeServiceBox, ".serviceIcon img").src = `/images/auth/${settings.auth.service}.png`;
    $(activeServiceBox, ".service").textContent = getAuthServiceName(settings.auth.service);
    $(activeServiceBox, ".username").textContent = settings.auth.username;
  }

  $show(".auth.page");
  $(".auth.page .nickname").select();
}

const getDefaultRoomName = () => getText(`${settings.nickname}'s room`, "defaultRoomName", { nickname: settings.nickname });

setNicknameForm.addEventListener("submit", (event) => {
  if (!setNicknameForm.checkValidity()) return;
  event.preventDefault();

  const oldDefaultRoomName = getDefaultRoomName();

  settings.nickname = $(".auth.page .nickname").value;
  saveSettings();

  if (roomNameInput.value === oldDefaultRoomName) roomNameInput.value = getDefaultRoomName();

  updateAuthButton();

  $hide(".page:not([hidden])");
  $show(".home.page");
});

function setupUserPictureFromUrl(url, callback) {
  const image = new Image();

  image.onload = () => {
    const maxSize = 128;

    const canvas = document.createElement("canvas");
    canvas.width = maxSize;
    canvas.height = maxSize;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let width = maxSize;
    let height = maxSize;

    if (image.width > image.height) width = Math.round(maxSize * image.width / image.height);
    else if (image.height > image.width) height = Math.round(maxSize * image.height / image.width);

    ctx.drawImage(image, 0, 0, image.width, image.height, (maxSize - width) / 2, (maxSize - height) / 2, width, height);

    let picture;

    for (let i = 0; i < 5; i++) {
      const quality = 1 - i / 10;
      picture = canvas.toDataURL("image/jpeg", quality).substring("data:image/jpeg;base64,".length);
      if (picture.length <= 10000) {
        console.log(`Picture was compressed at quality level ${quality}.`);
        break;
      }
    }

    if (picture.length > 10000) return callback(`Picture is too big even after maximum compression: ${picture.length} bytes.`);

    settings.picture = picture;
    saveSettings();

    setupPictureButton.style.backgroundImage = `url(data:image/jpeg;base64,${settings.picture})`;
    setupPictureButton.classList.add("hasImage");

    callback(null);
  }

  image.onerror = () => {
    console.log("Could not load image.");
    callback();
    return;
  };

  image.crossOrigin = "anonymous";
  image.src = url;
}

const setupPictureButton = $(".top .setup .picture");

const pictureUpload = $(".top .setup .pictureUpload");
pictureUpload.addEventListener("change", function (event) {
  const incorrectType = !['image/jpeg', 'image/png'].includes(this.files[0].type);
  if (this.files.length !== 1 || incorrectType) return;

  const imageUrl = URL.createObjectURL(this.files[0]);
  setupUserPictureFromUrl(imageUrl, () => URL.revokeObjectURL(imageUrl));
});

if (settings.picture != null) {
  setupPictureButton.style.backgroundImage = `url(data:image/jpeg;base64,${settings.picture})`;
  setupPictureButton.classList.add("hasImage");
}

jklmLoginForm.addEventListener("submit", (event) => {
  if (!jklmLoginForm.checkValidity()) return;
  event.preventDefault();

  $hide(".page:not([hidden])");
  $show(".loading.page");

  const secret = $(jklmLoginForm, "input.password").value;

  postJson("/api/accounts/login", { secret }, (res) => {
    $hide(".page:not([hidden])");
    $show(".auth.page");

    if (res.errorCode != null) {
      alert("Failed to log in: " + res.errorCode);
      return;
    }

    settings.nickname = res.username;

    settings.auth = {
      service: "jklm",
      username: res.username,
      token: secret,
      expiration: Date.now() + 7 * 24 * 3600 * 1000
    };

    saveSettings();

    updateAuthButton();
    showAuthPage();
  });
});

// Create room
const startRoomForm = $(".home .startRoom form");
const roomPrivacyPublicRadio = $("#roomPrivacyPublic");
const roomPrivacyPrivateRadio = $("#roomPrivacyPrivate");

const roomNameInput = $(".home .startRoom input.roomName");

roomPrivacyPublicRadio.addEventListener("change", onChangeRoomPrivacy);
roomPrivacyPrivateRadio.addEventListener("change", onChangeRoomPrivacy);

function onChangeRoomPrivacy() {
  if (roomPrivacyPublicRadio.checked) roomNameInput.value = getDefaultRoomName();
}

const gameSelection = $(".startRoom .gameSelection");

startRoomForm.addEventListener("submit", (event) => {
  if (!startRoomForm.checkValidity()) return;
  event.preventDefault();

  const name = roomNameInput.value;
  const isPublic = roomPrivacyPublicRadio.checked;
  const gameId = $(gameSelection, "input[type=radio]:checked").value;

  postJson("/api/startRoom", { name, isPublic, gameId, creatorUserToken: userToken }, (res) => {
    if (res.errorCode) return alert(`Could not start room. (${res.errorCode})`);
    location.href = `/${res.roomCode}`;
  });
});

const joinRoomForm = $(".home .joinRoom form");
const joinRoomCodeInput = $(joinRoomForm, "input");

joinRoomForm.addEventListener("submit", (event) => {
  if (!joinRoomForm.checkValidity()) return;
  event.preventDefault();

  const roomCode = joinRoomCodeInput.value.toUpperCase();

  postJson("/api/joinRoom", { roomCode }, (res) => {
    if (res.errorCode) return alert(`Could not join room. (${res.errorCode})`);
    location.href = `/${roomCode}`;
  });
});


// Public rooms
const publicRoomsRefreshButton = $(".home .publicRooms .refresh button");
const publicRoomsFilterInput = $(".home .publicRooms .filter input");
const publicRoomsList = $(".home .publicRooms .list");
publicRoomsRefreshButton.addEventListener("click", (event) => {
  event.preventDefault();
  fetchRoomsList();
});

publicRoomsFilterInput.addEventListener("input", (event) => {
  event.preventDefault();
  filterText = publicRoomsFilterInput.value.length > 0 ? publicRoomsFilterInput.value.toLowerCase() : null;
  applyRoomsFilter();
})

let filterText = null;
let allPublicRooms = null;
const gamesById = {};

function fetchRoomsList() {
  publicRoomsRefreshButton.disabled = true;
  $show(".publicRooms .loading");
  $hide(".publicRooms .none");
  publicRoomsList.classList.add("concealed");

  getJson("/api/rooms", (res) => {
    $hide(".publicRooms .loading");
    $(".publicRooms .header header").textContent = getText("Public rooms", "publicRooms");
    publicRoomsRefreshButton.disabled = false;
    publicRoomsList.innerHTML = "";
    publicRoomsList.classList.remove("concealed");

    allPublicRooms = res.publicRooms;

    if (res.errorCode != null) {
      $make("div", publicRoomsList, { textContent: `Could not fetch rooms. (${res.errorCode})`, className: "section" });
      return;
    }

    if (res.stats.playerCount > 1) {
      let headerTextId = "playWithPlayersInPublicAndPrivateRooms";
      let headerFallback = "Play with {playerCount} players in {publicRoomCount} public rooms and {privateRoomCount} private rooms";

      if (res.publicRooms.length === 0) {
        headerTextId = "playWithPlayersInPrivateRooms";
        headerFallback = "Play with {playerCount} players {privateRoomCount} private rooms";
      } else if (res.stats.rooms === res.publicRooms.length) {
        headerTextId = "playWithPlayersInPublicRooms";
        headerFallback = "Play with {playerCount} players in {publicRoomCount} public rooms";
      }

      const playerCount = res.stats.playerCount;
      const publicRoomCount = res.publicRooms.length;
      const privateRoomCount = res.stats.rooms - res.publicRooms.length;
      $(".publicRooms .header header").textContent = getText(headerFallback, headerTextId, { playerCount, publicRoomCount, privateRoomCount });
    }

    applyRoomsFilter();
  });
}

function applyRoomsFilter() {
  publicRoomsList.innerHTML = "";
  let betaRooms = [];
  const filteredRooms = allPublicRooms.filter(x => {
    if (x.beta) {
      betaRooms.push(x);
      return false;
    }
    if (filterText == null) return true;
    if (x.name.toLowerCase().includes(filterText)) return true;
    if (x.gameId.toLowerCase().includes(filterText)) return true;
    if (x.details != null && x.details.toLowerCase().includes(filterText)) return true;
    return false;
  });

  $show(".publicRooms .none", filteredRooms.length === 0 && !betaRooms.length);
  if (filteredRooms.length === 0 && !betaRooms.length) return;

  filteredRooms.sort((a, b) => b.playerCount - a.playerCount);
  if (betaRooms.length) filteredRooms.unshift(...betaRooms);

  for (const room of filteredRooms) {
    const roomDiv = $make("a", publicRoomsList, { className: `entry ${room.gameId}${room.beta ? ' beta' : ''}`, href: `/${room.roomCode}` });

    let gameDetails = `${gamesById[room.gameId].icon} ${gamesById[room.gameId].name}`;
    if (room.details != null) gameDetails += ` (${room.details})`;

    const infoDiv = $make("div", roomDiv, { className: "info" });
    const titleDiv = $make("div", infoDiv, { className: "title" });
    $make("span", titleDiv, { className: "text", textContent: room.name, title: room.name });
    $make("span", titleDiv, { className: "playerCount", textContent: room.playerCount });
    $make("div", infoDiv, { className: "playing", textContent: gameDetails });

    const stubDiv = $make("div", roomDiv, { className: "stub " });
    const codeDiv = $make("div", stubDiv, { className: "code", textContent: room.roomCode });
    const cutoutDiv = $make("div", stubDiv, { className: "cutout" });
  }
}

// OAuth
function handleOAuth(setupProfile) {
  function getOAuthFromHash() {
    const hash = window.location.hash;

    function getParameter(name) {
      const startIndex = hash.indexOf(name);
      if (startIndex === -1) return null;

      let encodedText = hash.substring(startIndex + name.length + 1);
      const endIndex = encodedText.indexOf("&");
      if (endIndex !== -1) encodedText = encodedText.substring(0, endIndex);

      return decodeURIComponent(encodedText);
    }

    const error = getParameter("error");
    if (error != null) return { error };

    const token = getParameter("access_token");
    if (token != null) {
      let expiration = Date.now() + 7 * 24 * 3600 * 1000;

      const expiresIn = getParameter("expires_in");
      if (expiresIn != null) {
        const expiresInSeconds = parseInt(expiresIn, 10);
        if (!Number.isNaN(expiresInSeconds) && expiresInSeconds > 0) expiration = Date.now() + expiresInSeconds * 1000;
      }

      const state = getParameter("state");
      return { token, expiration, state };
    }

    return { error: "Unknown error" };
  }

  const oauthResult = getOAuthFromHash();
  window.history.replaceState(null, null, `${window.location.protocol}//${window.location.host}`);

  if (oauthResult.error != null) {
    console.log("OAuth login error", oauthResult.error);
    start();
    return;
  }

  if (settings.auth != null && (oauthResult.token === settings.auth.token || oauthResult.state === "unexpire")) {
    // Existing login has been revalidated or unexpired, don't update profile
    settings.auth.token = oauthResult.token;
    settings.auth.expiration = oauthResult.expiration;
    saveSettings();

    start();
    return;
  }

  setupProfile(oauthResult.token, (success) => {
    if (success) {
      settings.auth.token = oauthResult.token;
      settings.auth.expiration = oauthResult.expiration;
      saveSettings();
    }

    start();
  });
}

function setupDiscordProfile(token, callback) {
  fetch("https://discord.com/api/users/@me", { headers: { "Authorization": `Bearer ${token}` } })
    .then((res) => res.json())
    .then((res) => {
      if (res.discriminator === '0') {
        settings.nickname = res.global_name;
        settings.auth = { service: "discord", username: res.username };
      } else {
        settings.nickname = res.username;
        settings.auth = { service: "discord", username: `${res.username}#${res.discriminator}` };
      }

      const pictureUrl = `https://cdn.discord.com/avatars/${res.id}/${res.avatar}.png`;
      setupUserPictureFromUrl(pictureUrl, (err) => {
        if (err != null) console.log("Failed to get Discord picture.", err);
        callback(true);
      });
    })
    .catch((reason) => {
      console.log("Failed to get Discord user.", reason);
      callback(false);
    });
}

function setupTwitchProfile(token, callback) {
  fetch("https://api.twitch.tv/helix/users", { headers: { "Authorization": `Bearer ${token}`, "Client-ID": oauthServices.twitch.clientId } })
    .then((res) => res.json())
    .then((res) => {
      settings.nickname = res.data[0].display_name;
      settings.auth = { service: "twitch", username: `${res.data[0].display_name}` };

      const pictureUrl = res.data[0].profile_image_url;
      setupUserPictureFromUrl(pictureUrl, (err) => {
        if (err != null) console.log("Failed to get Twitch picture.", err);
        callback(true);
      });
    })
    .catch((reason) => {
      console.log("Failed to get Twitch user.", reason);
      callback(false);
    });
}

function checkAuthExpirationThenStart() {
  if (settings.auth != null && settings.auth.expiration == null) {
    window.location.href = oauthServices[settings.auth.service].loginUrl + "&prompt=none";
    return;
  }

  // Start revalidating token in the last hour before it expires
  if (settings.auth != null && settings.auth.service !== "jklm" && settings.auth.expiration < Date.now() + 3600 * 1000) {
    console.log(`Ensuring ${settings.auth.service} token has not expired.`);

    function expired(reason) {
      console.log(`${settings.auth.service} token seems expired.`, reason);
      window.location.href = oauthServices[settings.auth.service].loginUrl + "&prompt=none&state=unexpire";
    }

    const headers = { "Authorization": `Bearer ${settings.auth.token}` };
    if (settings.auth.service === "twitch") headers["Client-ID"] = oauthServices[settings.auth.service].clientId;

    fetch(oauthServices[settings.auth.service].profileUrl, { headers })
      .then((res) => {
        if (res.status !== 200) expired(`HTTP ${res.status}`);
        else start();
      })
      .catch(expired);

    return;
  }

  start();
}

// App installation
if (navigator.serviceWorker != null) navigator.serviceWorker.register("centralServiceWorker.js");

let deferredappInstallPrompt;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredappInstallPrompt = event;
  $show(".links .appInstallPrompt");
});

$$(".appInstallPrompt").forEach(x => x.addEventListener("click", (event) => {
  event.preventDefault();

  if (deferredappInstallPrompt == null) return;
  deferredappInstallPrompt.prompt();

  deferredappInstallPrompt.userChoice.then((choiceResult) => {
    console.log(`App install prompt: ${choiceResult.outcome}`);
    deferredappInstallPrompt = null;
  });
}));

// Start
const userToken = getUserToken();

switch (window.location.search) {
  case "?login=discord": handleOAuth(setupDiscordProfile); break;
  case "?login=twitch": handleOAuth(setupTwitchProfile); break;
  default: checkAuthExpirationThenStart();
}

function start() {
  updateAuthButton();

  $layout(".loading.page");
  $(".loading.page").classList.add("fadeIn");

  loadText("/text", navigator.language, () => {
    roomNameInput.value = getDefaultRoomName();

    getJson("/api/games", (res) => {
      if (res.errorCode != null) return showErrorPage(`Could not load games list. (${res.errorCode})`);

      for (const game of res.games) {
        gamesById[game.id] = game;

        const gameDiv = $make("div", gameSelection, { dataset: { gameId: game.id } });
        const input = $make("input", gameDiv, { type: "radio", name: "selectedGame", value: game.id, id: `gameRadio-${game.id}`, disabled: game.disabled && !isTestMode });
        const label = $make("label", gameDiv, { htmlFor: input.id });
        $make("div", label, { className: "icon", textContent: game.icon });
        $make("div", label, { className: "name", textContent: game.name });

        const description = getText(game.description, `games.${game.id}.description`);
        $make("div", label, { className: "description", textContent: description });
      }

      filterText = publicRoomsFilterInput.value.length > 0 ? publicRoomsFilterInput.value.toLowerCase() : null;
      fetchRoomsList();

      $(gameSelection.firstElementChild, "input[type=radio]").checked = true;

      authButton.addEventListener("click", (event) => {
        event.preventDefault();

        $hide(".page:not([hidden])");
        showAuthPage();
      });

      setupPictureButton.addEventListener("click", (event) => {
        pictureUpload.click();
      });

      $hide(".page:not([hidden])");
      $show(".home.page");
    });
  });
}

$(".error.page button.reload").addEventListener("click", () => {
  window.location.reload();
});

function showErrorPage(message) {
  $(".error.page .message").textContent = message;

  $hide(".page:not([hidden])");
  $show(".error.page");
}
