// Import stylesheets
import "./style.css";
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from "firebaseui";

// Document elements
const startRsvpButton = document.getElementById("startRsvp");
const guestbookContainer = document.getElementById("guestbook-container");

const form = document.getElementById("leave-message");
const input = document.getElementById("message");
const guestbook = document.getElementById("guestbook");
const numberAttending = document.getElementById("number-attending");
const rsvpYes = document.getElementById("rsvp-yes");
const rsvpNo = document.getElementById("rsvp-no");

var rsvpListener = null;
var guestbookListener = null;

// Add Firebase project configuration object here
const firebaseConfig = {
  apiKey: "AIzaSyAmlZFNiDGDbVX8aP-CegMaPbWUo0WX1Vk",
  authDomain: "fir-web-codelab-f3c57.firebaseapp.com",
  databaseURL: "https://fir-web-codelab-f3c57.firebaseio.com",
  projectId: "fir-web-codelab-f3c57",
  storageBucket: "fir-web-codelab-f3c57.appspot.com",
  messagingSenderId: "880875866775",
  appId: "1:880875866775:web:f0af19e6623e2b13b9f7d2"
};

firebase.initializeApp(firebaseConfig);

// FirebaseUI config
const uiConfig = {
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  signInOptions: [
    // Email / Password Provider.
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      // Handle sign-in.
      // Return false to avoid redirect.
      return false;
    }
  }
};

const ui = new firebaseui.auth.AuthUI(firebase.auth());

startRsvpButton.addEventListener("click", () => {
  if (firebase.auth().currentUser) {
    firebase.auth().signOut();
  } else {
    ui.start("#firebaseui-auth-container", uiConfig);
  }
});

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    startRsvpButton.textContent = "LOGOUT";
    guestbookContainer.style.display = "block";
    onSubscribeGuestBook();
    onSubscribeCurrentRsvp(user);
  } else {
    startRsvpButton.textContent = "RSVP";
    guestbookContainer.style.display = "none";
    onSubscribeGuestBook();
    unSubscribeCurrentRsvp();
  }
});

form.addEventListener("submit", e => {
  e.preventDefault();

  firebase
    .firestore()
    .collection("guestbook")
    .add({
      text: input.value,
      timestamp: Date.now(),
      name: firebase.auth().currentUser.displayName,
      userId: firebase.auth().currentUser.uid
    });
  input.value = "";
  return false;
});

function onSubscribeGuestBook() {
  guestbookListener = firebase
    .firestore()
    .collection("guestbook")
    .orderBy("timestamp", "asc")
    .onSnapshot(snaps => {
      guestbook.innerHTML = "";
      snaps.forEach(doc => {
        const entry = document.createElement("p");
        entry.textContent = doc.data().name + ": " + doc.data().text;
        guestbook.appendChild(entry);
      });
    });
}

function unSubscribeGuestBook() {
  if (guestbookListener != null) {
    guestbookListener();
    guestbookListener = null;
  }
}

function onSubscribeCurrentRsvp(user) {
  rsvpListener = firebase
    .firestore()
    .collection("attendees")
    .doc(user.uid)
    .onSnapshot(doc => {
      if (doc && doc.data()) {
        const attendingResponse = doc.data().attending;

        // Update css classes for buttons
        if (attendingResponse) {
          rsvpYes.className = "clicked";
          rsvpNo.className = "";
        } else {
          rsvpYes.className = "";
          rsvpNo.className = "clicked";
        }
      }
    });
}

function unSubscribeCurrentRsvp() {
  if (rsvpListener != null) {
    rsvpListener();
    rsvpListener = null;
  }
  rsvpYes.className = "";
  rsvpNo.className = "";
}
rsvpYes.onclick = () => {
  const userDoc = firebase
    .firestore()
    .collection("attendees")
    .doc(firebase.auth().currentUser.uid);
  userDoc
    .set({
      attending: true,
      user: firebase.auth().currentUser.uid
    })
    .catch(console.error);
};

rsvpNo.onclick = () => {
  const userDoc = firebase
    .firestore()
    .collection("attendees")
    .doc(firebase.auth().currentUser.uid);
  userDoc
    .set({
      attending: false,
      user: firebase.auth().currentUser.uid
    })
    .catch(console.error);
};

firebase
  .firestore()
  .collection("attendees")
  .where("attending", "==", true)
  .onSnapshot(snap => {
    const newAttedeeCount = snap.docs.length;
    numberAttending.innerHTML = newAttedeeCount + " people going";
  });
