const express = require("express");
const app = express();
const port = process.env.PORT || 3001;

app.get("/", (req, res) => res.type('html').send(html));

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

const html = `

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <title data-text="title">JKLM.FUN Party games for PC &amp; Smartphone. BombParty, Master of the Grid, PopSauce &amp;
    co.</title>
  <meta name="description"
    content="🤪 🙃 😝 😜">
  <link rel="stylesheet" href="/fonts.css">
  <link rel="stylesheet" href="/base.css">
  <link rel="stylesheet" href="/central.css">
  <link rel="manifest" href="/manifest.json">

  <meta property="og:title" content="JKLM.FUN: Party games — PC &amp; Smartphone">
  <meta property="og:description"
    content="Fun online browser games to play with friends or strangers. Free and easy. Great for streams and hangouts!">
  <meta property="og:image" content="https://jklm.fun/images/icon512.png">
  <meta property="og:url" content="https://jklm.fun/">
</head>

<body class="darkScrollbar">
  <div class="base">
    <div class="top">
      <h1><a href="/">JKLM.FUN</a></h1>
      <div class="setup">
        <div class="wrap">
          <button class="auth">
            <img class="service" src="/images/auth/guest.png" alt="Guest">
            <span class="nickname">…</span>
          </button>
          <input type="file" class="pictureUpload" accept="image/png, image/jpeg" hidden>
          <div class="picture"></div>
        </div>
      </div>
    </div>
    <div class="loading page">
    </div>
    <div class="error page" hidden>
      <div class="title">Something went wrong.</div>
      <div class="message"></div>
      <button class="styled reload">Reload</button>
    </div>
    <div class="auth page" hidden>
      <div class="main">
        <form class="setNickname box">
          <div data-text="enterYourNickname">Enter your nickname:</div>
          <div class="line">
            <input class="styled nickname" type="text" placeholder="Your name" required minlength="2" maxlength="20"
              autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
            <button class="styled" data-text="ok">OK</button>
          </div>
          <div class="line nicknameRules" data-html="nicknameRules">Explicit or insulting nicknames are NOT
            allowed<br>and will get you permanently banned.</div>
        </form>
        <div class="chooseService box">
          <div data-text="showYourFriendsItsYou">You can show your friends it's really you by linking:</div>
          <div class="services">
            <a href="#" class="discord" title="Discord"><img src="/images/auth/discord.png" alt="Discord"></a>
            <a href="#" class="twitch" title="Twitch"><img src="/images/auth/twitch.png" alt="Twitch"></a>
          </div>
          <div data-text="itsSafe">We don't get your email and we can't post anything to your account.</div>
        </div>
        <div class="activeService box" hidden>
          <div class="serviceIcon"><img src="/images/auth/guest.png" alt="Guest"></div>
          <div>
            <div data-text="peopleCanSeeYouAre">People can see you are</div><span class="username">…</span> <span
              data-text="serviceOn">on</span>&nbsp;<span class="service">…</span>.
          </div>
          <div class="logout"><button class="styled" data-text="disconnect">Disconnect</button></div>
        </div>
        <form class="jklmLogin box">
          <div data-text="gotJklmAccount">Got a JKLM.FUN account?</div>
          <div data-text="staffOnlyForNow">(For now, those are only for staff members.)</div>
          <div class="line">
            <input class="styled password" type="password" placeholder="Password" data-placeholder-text="password"
              required>
            <button class="styled" data-text="ok">Log in</button>
          </div>
        </form>
      </div>
    </div>
    <div class="home page" hidden>
      <div class="banner"></div>
      <div class="columns section">
        <div class="left">
          <div class="startRoom box">
            <form>
              <header data-text="startNewRoom">Start a new room</header>
              <div class="gameSelection lightScrollbar"></div>
              <div class="line">
                <input type="text" class="roomName styled" minlength="2" maxlength="30" spellcheck="false"
                  placeholder="Room name" data-placeholder-text="roomName" required>
                <input type="radio" class="styled" name="roomPrivacy" value="public" id="roomPrivacyPublic"
                  checked><label for="roomPrivacyPublic" title="Anybody can join"
                  data-title-text="roomPrivacy.public.title">🌎 <span data-text="roomPrivacy.public"
                    class="largeScreen">Public</span></label><input type="radio" class="styled" name="roomPrivacy"
                  value="private" id="roomPrivacyPrivate"><label for="roomPrivacyPrivate" title="Share link to invite"
                  data-title-text="roomPrivacy.private.title">🔒 <span data-text="roomPrivacy.private"
                    class="largeScreen">Private</span></label>
                <button class="styled" data-text="play">Play</button>
              </div>
            </form>
          </div>
        </div>

        <div class="right">
          <div class="joinRoom box">
            <form>
              <header data-text="joinPrivateRoom">Join a private room</header>
              <div class="line">
                <div class="label" data-text="code">Code:</div>
                <input type="text" class="styled" size="4" minlength="4" maxlength="4" pattern="[a-zA-Z]{4}" title="A-Z"
                  required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                <div><button class="styled" data-text="join">Join</button></div>
              </div>
            </form>
          </div>

          <div class="news lightScrollbar">
            <div class="header">📰 <span data-text="news">News</span> — <span class="date"
                data-date="2021-08-06"></span></div>
            <div class="content" data-html="newsContent">Hi! 👋
              We're still hard at work on the new version. I can't wait!
              I'm trying a little experiment where I ask for your support below. More news on Discord!</div>
          </div>
        </div>
      </div>

      <div class="publicRooms section">
        <div class="header">
          <header data-text="publicRooms">Public rooms</header>
          <div class="filter">
            <input type="search" class="styled blue small" placeholder="Filter..." data-placeholder-text="filter">
          </div>
          <div class="refresh"><button class="styled blue small" data-text="refresh">Refresh</button></div>
        </div>
        <div class="listContainer">
          <div class="loading section" data-text="loading" hidden>Loading…</div>
          <div class="none section" hidden data-text="noMatchingPublicRooms">There are no matching public rooms. Start
            your own!</div>
          <div class="list"></div>
        </div>
      </div>

      <div class="footer">
      </div>
    </div>
  </div>

  <script src="/dom.js"></script>
  <script src="/settings.js"></script>
  <script src="/getPostJson.js"></script>
  <script src="/text.js"></script>
  <script src="/central.js"></script>
</body>

</html>

`
