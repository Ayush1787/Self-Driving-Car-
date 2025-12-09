const canvas = document.getElementById("gameCanvas");
canvas.height = window.innerHeight;
canvas.width = 200;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.height = window.innerHeight;
networkCanvas.width = 500;  // Wider canvas for better node visibility

const ctx = canvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road = new Road(canvas.width / 2, canvas.width * 0.9, 3);

let N = 20;
let cars = generateCars(N);
let bestCar = cars[0];
let generation = 1;
let bestEverDistance = 0;
let bestEverFitness = 0;
let mutationRate = 0.2;
let autoTrain = true;
let trainingStarted = false;

// Load training stats
if (localStorage.getItem("generation")) {
    generation = parseInt(localStorage.getItem("generation"));
}
if (localStorage.getItem("bestEverDistance")) {
    bestEverDistance = parseFloat(localStorage.getItem("bestEverDistance"));
}
if (localStorage.getItem("bestEverFitness")) {
    bestEverFitness = parseFloat(localStorage.getItem("bestEverFitness"));
}
if (localStorage.getItem("mutationRate")) {
    mutationRate = parseFloat(localStorage.getItem("mutationRate"));
}

if (localStorage.getItem("bestBrain")) {
    try {
        const savedBrain = JSON.parse(localStorage.getItem("bestBrain"));
        if (savedBrain && savedBrain.levels) {  // Verify it's a valid brain
            for (let i = 0; i < cars.length; i++) {
                cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
                if (i != 0) {
                    Network.mutate(cars[i].brain, mutationRate);
                }
            }
            trainingStarted = true;  // Auto-start if valid brain exists
        } else {
            // Invalid brain, remove it
            localStorage.removeItem("bestBrain");
        }
    } catch (e) {
        // Corrupted brain data, remove it
        localStorage.removeItem("bestBrain");
    }
}

// Generate random traffic
function generateTraffic() {
    const traffic = [];
    const lanes = [0, 1, 2];
    const trafficCount = 20;
    const spacing = 200;
    
    for (let i = 0; i < trafficCount; i++) {
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        // Start traffic much further ahead (more negative Y)
        const y = -300 - i * spacing - Math.random() * 200;
        const speed = 1 + Math.random();
        traffic.push(
            new Car(road.getLaneCenter(lane), y, 30, 50, "DUMMY", speed)
        );
    }
    
    return traffic;
}

let traffic = generateTraffic();

function addMoreTraffic() {
    // Find the furthest traffic car (most negative y)
    const furthestY = Math.min(...traffic.map(t => t.y));
    
    // Add new traffic ahead
    const lanes = [0, 1, 2];
    for (let i = 0; i < 5; i++) {  // Add 5 new cars
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const y = furthestY - 200 - i * 200 - Math.random() * 200;
        const speed = 1 + Math.random();
        traffic.push(
            new Car(road.getLaneCenter(lane), y, 30, 50, "DUMMY", speed)
        );
    }
    
    // Remove traffic that's too far behind (positive y > 500)
    traffic = traffic.filter(t => t.y < 500);
}

function generateCars(N) {
    const cars = [];
    for (let i = 1; i <= N; i++) {
        // Start cars in random lanes to encourage lane changing
        const startLane = Math.floor(Math.random() * 3);
        cars.push(new Car(road.getLaneCenter(startLane), 100, 30, 50, "AI", 2));
    }
    return cars;
}

function save() {
    const timestamp = new Date().toLocaleString();
    const brainData = {
        brain: bestCar.brain,
        fitness: bestCar.fitness.toFixed(0),
        distance: (-bestCar.y).toFixed(0),
        generation: generation,
        timestamp: timestamp
    };
    
    const brainId = "brain_" + Date.now();
    localStorage.setItem(brainId, JSON.stringify(brainData));
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
    
    // Update best ever stats
    if (bestCar.fitness > bestEverFitness) {
        bestEverFitness = bestCar.fitness;
        localStorage.setItem("bestEverFitness", bestEverFitness);
    }
    if (-bestCar.y > bestEverDistance) {
        bestEverDistance = -bestCar.y;
        localStorage.setItem("bestEverDistance", bestEverDistance);
    }
    
    updateBrainList();
    alert("Brain saved successfully! 🧠✅");
}

function discard() {
    localStorage.removeItem("bestBrain");
    generation = 1;
    bestEverDistance = 0;
    bestEverFitness = 0;
    localStorage.setItem("generation", generation);
    location.reload();
}

function reset() {
    if (confirm("Reset all training progress? This will delete all saved brains!")) {
        localStorage.clear();
        location.reload();
    }
}

function loadBrain(brainId) {
    const brainData = JSON.parse(localStorage.getItem(brainId));
    localStorage.setItem("bestBrain", JSON.stringify(brainData.brain));
    generation = brainData.generation;
    localStorage.setItem("generation", generation);
    location.reload();
}

function deleteBrain(brainId) {
    if (confirm("Delete this brain?")) {
        localStorage.removeItem(brainId);
        updateBrainList();
        
        // Check if this was the last brain and clean up bestBrain if needed
        const remainingBrains = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith("brain_")) {
                remainingBrains.push(key);
            }
        }
        
        // If no brains left, remove bestBrain to allow fresh start
        if (remainingBrains.length === 0) {
            localStorage.removeItem("bestBrain");
        }
    }
}

function updateBrainList() {
    const brainList = document.getElementById("brainList");
    brainList.innerHTML = "";
    
    const brains = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("brain_")) {
            const data = JSON.parse(localStorage.getItem(key));
            brains.push({ id: key, data: data });
        }
    }
    
    // Sort by fitness (descending)
    brains.sort((a, b) => parseFloat(b.data.fitness) - parseFloat(a.data.fitness));
    
    if (brains.length === 0) {
        brainList.innerHTML = '<div style="text-align: center; color: #95a5a6; font-size: 12px;">No saved brains</div>';
        return;
    }
    
    brains.forEach(brain => {
        const item = document.createElement("div");
        item.className = "brain-item";
        item.innerHTML = `
            <div class="brain-name">
                Gen ${brain.data.generation} | F: ${brain.data.fitness}
                <div style="font-size: 10px; color: #7f8c8d;">${brain.data.timestamp}</div>
            </div>
            <div class="brain-actions">
                <button class="brain-load-btn" onclick="loadBrain('${brain.id}')">Load</button>
                <button class="brain-delete-btn" onclick="deleteBrain('${brain.id}')">✕</button>
            </div>
        `;
        brainList.appendChild(item);
    });
}

function updateStats() {
    const aliveCount = cars.filter(c => !c.damaged).length;
    const bestDistance = -bestCar.y;
    const carsPassed = traffic.filter(t => bestCar.y < t.y).length;
    
    document.getElementById("generation").textContent = generation;
    document.getElementById("aliveCount").textContent = aliveCount;
    document.getElementById("bestDistance").textContent = bestDistance.toFixed(0);
    document.getElementById("bestFitness").textContent = bestCar.fitness.toFixed(0);
    document.getElementById("carsPassed").textContent = carsPassed;
    
    // Auto-save and next generation when all cars die (only if auto-train is on)
    if (aliveCount === 0 && autoTrain) {
        if (bestCar.fitness > 50) {  // Only save if made decent progress
            save();
        }
        generation++;
        localStorage.setItem("generation", generation);
        setTimeout(() => location.reload(), 2000);
    }
}

function nextGeneration() {
    if (bestCar.fitness > 50) {
        save();
    }
    generation++;
    localStorage.setItem("generation", generation);
    location.reload();
}

function restartGeneration() {
    location.reload();
}

function startTraining() {
    trainingStarted = true;
    const startBtn = document.getElementById("startTrainBtn");
    startBtn.textContent = "⏸️ Training Active";
    startBtn.style.background = "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)";
    startBtn.disabled = true;
}

// Manual training controls
document.getElementById("carCount").value = N;
document.getElementById("mutationRate").value = mutationRate;
document.getElementById("mutationValue").textContent = mutationRate;

// Update start button state
const startBtn = document.getElementById("startTrainBtn");
if (trainingStarted) {
    startBtn.textContent = "⏸️ Training Active";
    startBtn.style.background = "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)";
    startBtn.disabled = true;
} else {
    // Ensure button is enabled when not training
    startBtn.textContent = "▶️ Start Training";
    startBtn.disabled = false;
}

document.getElementById("startTrainBtn").addEventListener("click", startTraining);

document.getElementById("carCount").addEventListener("change", (e) => {
    N = parseInt(e.target.value);
    localStorage.setItem("carCount", N);
});

document.getElementById("mutationRate").addEventListener("input", (e) => {
    mutationRate = parseFloat(e.target.value);
    document.getElementById("mutationValue").textContent = mutationRate;
    localStorage.setItem("mutationRate", mutationRate);
});

document.getElementById("maxSpeed").addEventListener("input", (e) => {
    const newSpeed = parseFloat(e.target.value);
    document.getElementById("maxSpeedValue").textContent = newSpeed;
    cars.forEach(car => car.maxSpeed = newSpeed);
});

document.getElementById("autoTrain").addEventListener("change", (e) => {
    autoTrain = e.target.checked;
});

document.getElementById("nextGenBtn").addEventListener("click", nextGeneration);
document.getElementById("restartBtn").addEventListener("click", restartGeneration);

document.getElementById("saveBtn").addEventListener("click", save);
document.getElementById("discardBtn").addEventListener("click", discard);
document.getElementById("resetBtn").addEventListener("click", reset);

// Make functions global for inline onclick handlers
window.loadBrain = loadBrain;
window.deleteBrain = deleteBrain;

// Initial brain list update
updateBrainList();

let trafficRegenTimer = 0;

animate();

function animate(time) {
    // Only update cars if training has started
    if (trainingStarted) {
        // Continuously add more traffic
        trafficRegenTimer++;
        if (trafficRegenTimer > 100) {  // Every 100 frames
            addMoreTraffic();
            trafficRegenTimer = 0;
        }
        
        for (let i = 0; i < traffic.length; i++) {
            traffic[i].update(road.borders, []);
        }
        
        for (let i = 0; i < cars.length; i++) {
            cars[i].update(road.borders, traffic);
            
            // Calculate fitness: distance traveled + speed bonus + overtaking bonus
            if (!cars[i].damaged) {
                // Base fitness: distance traveled (negative y = forward)
                cars[i].fitness = -cars[i].y;
                
                // Speed bonus: reward cars that maintain higher speed
                cars[i].fitness += cars[i].speed * 5;
                
                // Overtaking bonus: big reward for passing traffic
                let overtakeCount = 0;
                for (let j = 0; j < traffic.length; j++) {
                    if (cars[i].y < traffic[j].y) {
                        overtakeCount++;
                    }
                }
                cars[i].fitness += overtakeCount * 20;  // +20 points per car overtaken
            }
        }
        
        // Select best car based on fitness score
        bestCar = cars.reduce((best, current) => 
            current.fitness > best.fitness ? current : best
        , cars[0]);
        
        // Update dashboard stats
        updateStats();
    }
    
    canvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;
    
    ctx.save();
    ctx.translate(0, -bestCar.y + canvas.height * 0.7);
    
    road.draw(ctx);
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(ctx, "red");
    }
    
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(ctx, "blue");
    }
    ctx.globalAlpha = 1;
    bestCar.draw(ctx, "blue", true);
    
    ctx.restore();
    
    networkCtx.lineDashOffset = -time / 50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
    
    requestAnimationFrame(animate);
}


