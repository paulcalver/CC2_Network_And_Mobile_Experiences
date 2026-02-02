let socket;
let myMotion = { x: 0, y: 0, z: 0 };
let otherDevices = {}; // Store motion from other phones
let myHue;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  myHue = random(0, 360);
  noStroke();
  
  // Connect to Socket.IO server
  socket = io();

  // Receive motion data from other phones
  socket.on("motion", (data) => {
    // Store it with the sender's socket ID
    otherDevices[data.id] = {
      x: data.x,
      y: data.y,
      z: data.z,
      col: data.col, // Store their colour too!
      timestamp: Date.now()
    };
  });
}

function touchStarted() {
  // Request device motion permission on iOS
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          console.log('Motion permission granted');
        }
      })
      .catch(console.error);
  }
}

function draw() {
  background(20, 100, 100);

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
    fill(device.col, 100, 100); // Use their colour
    ellipse(
      map(device.x, -10, 10, 0, width),
      map(device.y, -10, 10, 0, height),
      50, 50
    );
  }
}

function deviceMoved() {
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