let socket;
let myMotion = { x: 0, y: 0, z: 0 };
let otherDevices = {}; // Store motion from other phones
let myHue;
let permissionGranted = false;
let permissionButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  myHue = random(0, 360);
  noStroke();
  
  // Create button for iOS permission
  permissionButton = createButton('Tap to Enable Motion');
  permissionButton.position(windowWidth/2 - 100, windowHeight/2 - 25);
  permissionButton.size(200, 50);
  permissionButton.style('font-size', '16px');
  permissionButton.style('background-color', '#000000');
  permissionButton.style('color', 'white');
  permissionButton.style('border', 'none');
  permissionButton.style('border-radius', '8px');
  permissionButton.style('cursor', 'pointer');
  permissionButton.mousePressed(requestPermission);
  
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

  // Hide button once permission granted
  if (permissionGranted && permissionButton) {
    permissionButton.hide();
  }
  
  // Don't draw anything until permission granted
  if (!permissionGranted) {
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
          if (permissionButton) permissionButton.hide();
        } else {
          console.log('Motion permission denied');
          alert('Motion permission denied. Please allow motion access in Safari settings.');
        }
      })
      .catch(err => {
        console.error("Permission error:", err);
        alert('Error requesting motion permission: ' + err.message);
      });
  } else {
    // Non-iOS or older iOS
    permissionGranted = true;
    console.log('Motion available without permission');
    if (permissionButton) permissionButton.hide();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (!permissionGranted && permissionButton) {
    permissionButton.position(windowWidth/2 - 100, windowHeight/2 - 25);
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