let socket;
let myMotion = { x: 0, y: 0, z: 0 };
let otherDevices = {}; // Store motion from other phones
let myHue;
let permissionGranted = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  myHue = random(0, 360);
  noStroke();
  
  // Connect to Socket.IO server
  socket = io();

  // Receive motion data from other phones
  socket.on("motion", (data) => {
    otherDevices[data.id] = {
      x: data.x,
      y: data.y,
      z: data.z,
      col: data.col,
      timestamp: Date.now()
    };
  });
}

function draw() {
  background(20, 100, 100);

  // Show prompt if permission not granted
  if (!permissionGranted) {
    fill(0, 0, 100);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("Tap to enable motion", width/2, height/2);
    return;
  }

  // Visualise YOUR motion (in your colour)
  fill(myHue, 100, 100);
  ellipse(
    map(myMotion.x, -10, 10, 0, width),
    map(myMotion.y, -10, 10, 0, height),
    50, 50
  );

  // Visualise OTHER phones' motion (in their colours)
  for (let id in otherDevices) {
    let device = otherDevices[id];
    fill(device.col, 100, 100);
    ellipse(
      map(device.x, -10, 10, 0, width),
      map(device.y, -10, 10, 0, height),
      50, 50
    );
  }
}

// Use mousePressed instead - more reliable
function mousePressed() {
  if (!permissionGranted) {
    requestPermission();
    return false; // Prevent default behavior on iOS
  }
}

// Also keep touchStarted as backup
function touchStarted() {
  if (!permissionGranted) {
    requestPermission();
    return false; // Prevent default behavior on iOS
  }
}

function requestPermission() {
  console.log("Permission request triggered");
  
  // Request permission for iOS 13+
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(response => {
        console.log("Permission response:", response);
        if (response === 'granted') {
          permissionGranted = true;
          console.log('Motion permission granted');
        } else {
          console.log('Motion permission denied');
        }
      })
      .catch(err => {
        console.error("Permission error:", err);
      });
  } else {
    // Non-iOS or older iOS
    permissionGranted = true;
    console.log('Motion available without permission');
  }
}

function deviceMoved() {
  if (!permissionGranted) return;
  
  // Update your motion
  myMotion.x = accelerationX || 0;
  myMotion.y = accelerationY || 0;
  myMotion.z = accelerationZ || 0;

  // Send YOUR motion to server (which broadcasts to others)
  socket.emit("motion", {
    id: socket.id,
    x: myMotion.x,
    y: myMotion.y,
    z: myMotion.z,
    col: myHue
  });
}