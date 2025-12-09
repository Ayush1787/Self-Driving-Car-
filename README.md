AI Self-Driving Car Simulation – Training Dashboard

This project is an advanced AI-based self-driving car simulation built using JavaScript, HTML5 Canvas, and a fully custom Neural Network with Genetic Algorithm-based training.
It allows real-time visualization of car movement, sensor detection, neural decision-making, and evolutionary training of multiple AI agents.

🌟 Features
🧠 AI Brain Training

Every car in the simulation is controlled by a neural network.

Cars learn to drive automatically using:
Sensors
Collision detection
Fitness scoring
Genetic mutation + selection
Save or discard AI brains.
View all saved brains in the Brain Panel.

🎮 Manual & Automatic Training Controls
The Training Dashboard provides full control:
Start / stop training
Choose number of cars (1–200)
Adjust mutation rate (0.05 – 0.5)
Adjust maximum speed
Restart generation
Create next generation instantly
Auto-training mode

📊 Live Training Statistics
Real-time stats displayed:
Current Generation Number
Cars Alive
Best Distance travelled
Best Fitness Score
Cars Passed (traffic cars overtaken)

👁️ Canvas Visualization
Two canvas systems:
Game Canvas → Shows road, traffic, sensors & car movement
Network Canvas → Shows neural network structure & activations

📂 Project Structure
📁 css/
    └── style.css

📁 js/
    ├── visualizer.js      # AI brain visualization
    ├── network.js         # Neural network logic
    ├── math/utils.js      # Utility math functions
    ├── sensor.js          # Sensor ray system
    ├── road.js            # Road & lane rendering
    ├── car.js             # Car physics + AI control
    ├── controls.js        # Manual controls
    └── main.js            # Main simulation logic

index.html                 # Dashboard UI + Canvas layout

⚙️ How It Works
1️⃣ Sensors
Each car fires rays to detect:
Road boundaries
Traffic vehicles
Collision points
2️⃣ Neural Network
Inputs → Sensor readings
Outputs → Steering, Accelerate, Brake
3️⃣ Evolution Loop
Each generation:
Best car is selected
Neural network mutations create new cars
Cars train until collision
Stats visualize overall improvement

🚀 How to Run the Project
🔧 Option 1: Run Locally
Download the project.
Use any local server:
VS Code + Live Server (recommended)
Python server:
python -m http.server
Open in browser:

http://localhost:8000

🌐 Option 2: Host on GitHub Pages
Upload this project to a GitHub repo
Enable GitHub Pages in Settings
Open the live link

📸 Dashboard Overview
Your simulation UI includes:
Game view
Neural network view
AI brain tools
Stats display
Training sliders & toggles
(Generated automatically when project runs)

🛠️ Upcoming Features (Optional to Add)
Traffic generation customization
Weather & slippery road simulation
Multiplayer AI training
Replay best brain
Export/Import brain JSON files

🧑‍💻 Tech Stack
JavaScript (Vanilla)
HTML5 Canvas API
Neural Networks (Custom Implementation)
Genetic Algorithms
DOM-based UI Controls

❤️ Credits
Designed & developed with the goal of learning:
AI fundamentals
Neural network visualization
ML-like training without libraries
Game physics in JavaScript
