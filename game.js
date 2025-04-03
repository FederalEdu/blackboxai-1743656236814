// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game state
const game = {
    health: 100,
    isRunning: false,
    isDriving: false,
    vehicleSpeed: 0,
    maxVehicleSpeed: 8,
    lightsOn: false,
    currentMission: {
        target: { x: 0, y: 0 },
        description: "Find the red building",
        completed: false,
        targetBuilding: null
    }
};

// Player character
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    speed: 3,
    color: '#FF0000',
    direction: 0,
    moving: false
};

// City elements
const buildings = [];
const roads = [];
const npcs = [];

// Generate simple city layout
function generateCity() {
    // Create buildings
    for (let i = 0; i < 20; i++) {
        const building = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            width: 50 + Math.random() * 100,
            height: 50 + Math.random() * 150,
            color: `rgb(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, ${100 + Math.random() * 155})`
        };
        buildings.push(building);
        
        // Set one random building as mission target
        if (i === 5) {
            building.color = '#FF0000';
            game.currentMission.targetBuilding = building;
            game.currentMission.target = {
                x: building.x + building.width/2,
                y: building.y + building.height/2
            };
        }
    }

    // Create main roads
    for (let i = 0; i < 5; i++) {
        roads.push({
            x: i * (canvas.width / 5),
            y: 0,
            width: 60,
            height: canvas.height,
            color: '#333333'
        });
        roads.push({
            x: 0,
            y: i * (canvas.height / 5),
            width: canvas.width,
            height: 60,
            color: '#333333'
        });
    }
}

// Generate NPCs
function generateNPCs() {
    for (let i = 0; i < 10; i++) {
        npcs.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 15,
            speed: 1 + Math.random(),
            direction: Math.random() * Math.PI * 2,
            color: '#00FF00',
            changeDirectionTimer: 0
        });
    }
}

// Update NPC positions
function updateNPCs() {
    npcs.forEach(npc => {
        // Change direction randomly
        npc.changeDirectionTimer--;
        if (npc.changeDirectionTimer <= 0) {
            npc.direction = Math.random() * Math.PI * 2;
            npc.changeDirectionTimer = 60 + Math.random() * 120;
        }

        // Move NPC
        npc.x += Math.cos(npc.direction) * npc.speed;
        npc.y += Math.sin(npc.direction) * npc.speed;

        // Boundary check
        npc.x = Math.max(npc.size, Math.min(canvas.width - npc.size, npc.x));
        npc.y = Math.max(npc.size, Math.min(canvas.height - npc.size, npc.y));
    });
}

// Check collisions
function checkCollisions() {
    // Player-NPC collisions
    npcs.forEach(npc => {
        const distance = Math.sqrt(
            Math.pow(player.x - npc.x, 2) + 
            Math.pow(player.y - npc.y, 2)
        );
        if (distance < player.size + npc.size) {
            game.health -= 0.5;
            if (game.health < 0) game.health = 0;
            updateHealthBar();
        }
    });

    // Mission completion check
    if (!game.currentMission.completed) {
        const distance = Math.sqrt(
            Math.pow(player.x - game.currentMission.target.x, 2) + 
            Math.pow(player.y - game.currentMission.target.y, 2)
        );
        if (distance < 50) {
            game.currentMission.completed = true;
            document.getElementById('mission').textContent = "Mission Complete!";
            game.health = Math.min(100, game.health + 30);
            updateHealthBar();
        }
    }
}

// Update health bar display
function updateHealthBar() {
    const healthBar = document.getElementById('health-bar');
    healthBar.style.width = `${game.health}%`;
    healthBar.className = game.health > 50 ? 
        'bg-green-500 h-4 rounded-full' : 
        game.health > 20 ? 
        'bg-yellow-500 h-4 rounded-full' : 
        'bg-red-500 h-4 rounded-full';
}

// Joystick controls
const joystick = document.getElementById('joystick');
const joystickKnob = document.getElementById('joystickKnob');
let joystickActive = false;
let joystickStartX = 0;
let joystickStartY = 0;
let joystickX = 0;
let joystickY = 0;

joystick.addEventListener('touchstart', handleJoystickStart);
joystick.addEventListener('mousedown', handleJoystickStart);
document.addEventListener('touchmove', handleJoystickMove);
document.addEventListener('mousemove', handleJoystickMove);
document.addEventListener('touchend', handleJoystickEnd);
document.addEventListener('mouseup', handleJoystickEnd);

function handleJoystickStart(e) {
    e.preventDefault();
    joystickActive = true;
    const rect = joystick.getBoundingClientRect();
    joystickStartX = rect.left + rect.width / 2;
    joystickStartY = rect.top + rect.height / 2;
    updateJoystick(e);
}

function handleJoystickMove(e) {
    if (!joystickActive) return;
    e.preventDefault();
    updateJoystick(e);
}

function handleJoystickEnd() {
    joystickActive = false;
    joystickKnob.style.transform = 'translate(30px, 30px)';
    player.moving = false;
}

function updateJoystick(e) {
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    
    joystickX = clientX - joystickStartX;
    joystickY = clientY - joystickStartY;
    
    const distance = Math.sqrt(joystickX * joystickX + joystickY * joystickY);
    const maxDistance = 50;
    
    if (distance > maxDistance) {
        joystickX = (joystickX / distance) * maxDistance;
        joystickY = (joystickY / distance) * maxDistance;
    }
    
    joystickKnob.style.transform = `translate(${joystickX + 30}px, ${joystickY + 30}px)`;
    
    if (distance > 10) {
        player.moving = true;
        player.direction = Math.atan2(joystickY, joystickX);
    } else {
        player.moving = false;
    }
}

// Action button controls
document.getElementById('punch-btn').addEventListener('click', () => {
    // Punch/attack logic would go here
    console.log("Punch action");
});

document.getElementById('run-btn').addEventListener('click', () => {
    game.isRunning = !game.isRunning;
    player.speed = game.isRunning ? 5 : 3;
    document.getElementById('run-btn').classList.toggle('bg-blue-700');
});

document.getElementById('car-btn').addEventListener('click', () => {
    game.isDriving = !game.isDriving;
    document.getElementById('vehicleControls').classList.toggle('hidden');
    if (game.isDriving) {
        player.speed = game.vehicleSpeed;
    } else {
        player.speed = game.isRunning ? 5 : 3;
        game.vehicleSpeed = 0;
    }
});

document.getElementById('gas-btn').addEventListener('click', () => {
    if (game.isDriving) {
        game.vehicleSpeed = Math.min(game.maxVehicleSpeed, game.vehicleSpeed + 1);
        player.speed = game.vehicleSpeed;
    }
});

document.getElementById('brake-btn').addEventListener('click', () => {
    if (game.isDriving) {
        game.vehicleSpeed = Math.max(0, game.vehicleSpeed - 1);
        player.speed = game.vehicleSpeed;
    }
});

document.getElementById('lights-btn').addEventListener('click', () => {
    game.lightsOn = !game.lightsOn;
    document.getElementById('lights-btn').classList.toggle('bg-yellow-400');
});

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw city
    drawCity();
    
    // Update positions
    updateNPCs();
    
    // Update player position
    if (player.moving) {
        player.x += Math.cos(player.direction) * player.speed;
        player.y += Math.sin(player.direction) * player.speed;
        
        // Boundary check
        player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
        player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
    }
    
    // Check collisions
    checkCollisions();
    
    // Draw NPCs
    drawNPCs();
    
    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw mission target
    if (!game.currentMission.completed) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(
            game.currentMission.target.x, 
            game.currentMission.target.y, 
            10, 0, Math.PI * 2
        );
        ctx.fill();
    }
    
    requestAnimationFrame(gameLoop);
}

function drawCity() {
    // Draw roads
    roads.forEach(road => {
        ctx.fillStyle = road.color;
        ctx.fillRect(road.x, road.y, road.width, road.height);
    });
    
    // Draw buildings
    buildings.forEach(building => {
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x, building.y, building.width, building.height);
        
        // Add windows
        ctx.fillStyle = game.lightsOn ? '#FFFF00' : '#333333';
        const windowSize = 5;
        const windowSpacing = 10;
        
        for (let y = building.y + 10; y < building.y + building.height - 10; y += windowSpacing) {
            for (let x = building.x + 10; x < building.x + building.width - 10; x += windowSpacing) {
                if (Math.random() > 0.3) {
                    ctx.fillRect(x, y, windowSize, windowSize);
                }
            }
        }
    });
}

function drawNPCs() {
    npcs.forEach(npc => {
        ctx.fillStyle = npc.color;
        ctx.beginPath();
        ctx.arc(npc.x, npc.y, npc.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Initialize game
generateCity();
generateNPCs();
gameLoop();

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});