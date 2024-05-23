/////////////////////////////////////
// SNOOKER GAME USING P5.JS AND MATTER.JS
/////////////////////////////////////

// Snooker Game Using p5.js and Matter.js
// This program simulates a snooker game using p5.js for rendering and Matter.js for physics.

/*
Commentary on the Snooker Game App

Developing a Snooker Experience: Developing a snooker game using p5.js and Matter.js has been an insightful journey into the intricacies of game 
development and physics simulation. My approach was driven by a desire to blend simplicity with interactivity, ensuring that the app remains 
user-friendly while offering a relatively realistic snooker-playing experience.

Cue Interaction Design: I opted for a mouse-based cue control system for its intuitive nature. This choice aligns with the interface design of other 
snooker/billiard/pool apps observed in the real world, where the mouse serves as a primary control device. The mechanism is straightforward: the 
player moves the mouse to adjust the cue angle and clicks to strike the cue ball. This design allows for precise control over the cue's angle and 
force, essential for a game that hinges on accuracy.

Table and Ball Physics: The snooker table and balls are rendered using p5.js, adhering to project requirements. The physics, including collisions, 
bouncing, and friction, are simulated with Matter.js. This framework offers a realistic physics engine, key to mimicking the snooker game's intricate 
dynamics. The movement of the balls on the table closely resembles real-life physics, from the spin after being struck to their bounce off the 
cushions.

Weather Effects: A unique extension in my game is the introduction of dynamic weather effects, namely wind and rain. These elements are not mere 
visual enhancements but also gameplay modifiers. The wind slightly alters the balls' trajectory, adding unpredictability, while rain, shown as 
falling particles, enriches the immersive experience without impacting ball physics. These effects are engaged through a specific game mode, 
diversifying the playing conditions and elevating the traditional snooker game into a more challenging and engaging experience.

Uniqueness of the Concept: Incorporating weather elements into a snooker game is both unorthodox and unprecedented, as standard snooker games are 
typically set indoors, devoid of external environmental influences. This creative twist adds a novel layer of challenge and demonstrates the 
potential of merging traditional game elements with imaginative and innovative features, pushing the boundaries of conventional game design.

Conclusion: My snooker game app represents a blend of traditional game mechanics with unique, unorthodox features. The mouse-based cue system 
underscores user-friendliness and precision, while the innovative weather effects reflect creative thinking in game design. This project served as a 
valuable learning lesson for game development and physics simulation and an opportunity to explore the limitless creative possibilities within 
computer science.
*/

// Import Matter.js library
let Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

// Variables for Matter.js engine and snooker table dimensions
let engine;
let tableWidth, tableHeight;

// Ball dimensions, pockets and storage array
let ballDiameter, ballRadius;
let balls = []; // Array to store all snooker balls
let pockets = [];

// Variable to track cue ball repositioning status
let isRepositioningCueBall = true;

// Cue dimensions
let cueLength // Length of the cue
let cueWidth // Width of the cue

// Ball colours
const ballColours = {
    red: 'red', yellow: 'yellow', green: 'green', 
    brown: 'brown', blue: 'blue', pink: 'pink', 
    black: 'black', white: 'white'
};

// Variables for cue and table aesthetics
let cue;
let tableColour = '#4e8834'; // Colour for the table
let pocketColour = '#000000'; // Colour for the pockets

// Ball mode for initial setup
let ballMode = 0;

// Declare lastCollision in the global scope to store the last collision data
let lastCollision = '';

// Declare a global variable to track debug mode
let debugMode = false;

//  Declare a global variable to track consecutive pockets from colour ball
let consecutiveColouredBallsPocketed = 0;

// Stores a ball that needs to respawn
let ballsToRespawn = []; 

// Set a message timmer to text on screen
let messageTimer = 0;

// Initialize variables for weather effects in the snooker game
let isWindActive = true; // Flag to track if wind effect is active
let windTimer = 20 * 60; // Timer for wind effect duration (20 seconds)
let noWindTimer = 20 * 60; // Timer for pause duration between wind effects (20 seconds)
let checkIfCueBallStrike = false; // Flag to check if the cue ball has been struck during the weather effect
let windForce; // Variable to store the wind force vector
let rainParticles = []; // Array to store rain particle bodies

// p5.js setup function - initializes canvas and game elements
function setup() {
    // Create a 800x400 pixel canvas for the game
    createCanvas(800, 400);

    // Initialize the physics engine with Matter.js
    engine = Engine.create();
    
    // Disable gravity in the game as it's not needed for snooker
    engine.world.gravity.y = 0;

    // Define table dimensions relative to canvas size
    // Making the table occupy 80% of the canvas dimensions
    tableWidth = width * 0.8;
    tableHeight = height * 0.8;

    // Define the diameter and radius of balls based on table width
    ballDiameter = tableWidth / 36; // Proportional to table size
    ballRadius = ballDiameter / 2;

    // Define the lenght and width of the cue based on canvas width
    cueLength = -width/4; // Length of the cue
    cueWidth = width/160; // Width of the cue

    // Create the snooker table and cue objects
    snookerTable = new Table(tableWidth, tableHeight);
    
    // Initialize a cue ball at a specific position on the table
    let initialCueBall = new CueBall({ x: width / 4, y: height / 2 }, false);
    
    // Create a cue object for striking balls
    cue = new Cue(cueLength, cueWidth, '#8B4513', initialCueBall);

    // Initialize game balls on the table based on the chosen mode
    Ball.initializeBalls(ballMode);

    // Initialize pockets positions
    // Define the positions of the six pockets on the snooker table
    pockets = [
        { x: (width - tableWidth) / 2, y: (height - tableHeight) / 2 }, // Top left pocket
        { x: width / 2, y: (height - tableHeight) / 2 },                // Top middle pocket
        { x: (width + tableWidth) / 2, y: (height - tableHeight) / 2 }, // Top right pocket
        { x: (width - tableWidth) / 2, y: (height + tableHeight) / 2 }, // Bottom left pocket
        { x: width / 2, y: (height + tableHeight) / 2 },                // Bottom middle pocket
        { x: (width + tableWidth) / 2, y: (height + tableHeight) / 2 }  // Bottom right pocket
    ];

    // Listen for collision events and handle them in the onCollision function
    Matter.Events.on(engine, 'collisionStart', function(event) {
        onCollision(event);
    });
}

// p5.js draw function - main loop for rendering the game
function draw() {
    background(255); // Set background colour to white

    // Check if the cue ball is being repositioned and no other balls are moving
    if ((isRepositioningCueBall && !anyBallMoving()) || (isRepositioningCueBall && ballMode == 3)) {
        // Get new position within 'D' area for the cue ball
        let newPos = confinePointToD(mouseX, mouseY);
        // Set the cue ball's position to the new position
        Matter.Body.setPosition(window.cueBall, newPos);
    } else {
        // Update the physics engine if not repositioning the cue ball or if any ball is moving
        Engine.update(engine); 
    };

    snookerTable.display(); // Display snooker table
    balls.forEach(ball => ball.display()); // Display all balls

    if (((!isRepositioningCueBall && (!anyBallMoving() || cue.isStriking))) || ((!isRepositioningCueBall && ballMode == 3 && !isCueBallMoving()))) {
        cue.updatePosition(); // Update cue position
        cue.display();        // Display cue
        cue.displayForceBar(); // Display force bar
    };

    if (keyIsDown(UP_ARROW)) cue.changeForce(true); // Increase force with up arrow
    else if (keyIsDown(DOWN_ARROW)) cue.changeForce(false); // Decrease force with down arrow

    // Iterate through all balls in reverse order (for safe removal)
    for (let i = balls.length - 1; i >= 0; i--) {
        let ball = balls[i];
        let ballPos = ball.body.position;

        // Check collision with each pocket for all balls
        for (let pocket of pockets) {
            let d = dist(ballPos.x, ballPos.y, pocket.x, pocket.y);

            // If the ball is close enough to a pocket, consider it pocketed
            if (d < ballRadius * 1.2) {
                // Remove ball from Matter.js world
                World.remove(engine.world, ball.body);
                
                // If the pocketed ball is the cue ball, set the flag
                if (ball instanceof CueBall) {
                    ballsToRespawn.push(ball); // Append the ball to the list of balls to respawn
                } else if (ball.colour !== ballColours.red && ball.colour !== ballColours.white) {
                    ballsToRespawn.push(ball); // Append the ball to the list of balls to respawn
                    // Increment count for consecutive coloured balls pocketed
                    consecutiveColouredBallsPocketed++;
                    
                    // Check for two consecutive coloured balls
                    if (consecutiveColouredBallsPocketed == 2) {
                        // Notify the user about two consecutive coloured ballspocketed
                        console.log("Two consecutive coloured balls pocketed!");
                        messageTimer = 5 * 60; // Display the message for 5 seconds
                    };
                } else {
                    // Reset the consecutive counter for non-coloured balls
                    consecutiveColouredBallsPocketed = 0;
                };
                // Remove ball from balls array
                balls.splice(i, 1);
            };
        };
    };

    // Display the Two consecutive coloured balls pocketed! if the timer is active
    if (messageTimer > 0) {
        push();
        fill(255);
        strokeWeight(4);
        stroke(50);
        textAlign(CENTER, CENTER);
        textSize(32);
        text("Two consecutive coloured balls pocketed!", width / 2, height / 2);
        pop();
        messageTimer--; // Decrement the timer
    }

    // Check if no balls are moving and there are balls to respawn
    if ((!anyBallMoving() && ballsToRespawn.length > 0) || (!isRepositioningCueBall && ballMode == 3)) {
        // Iterate through the list of balls to respawn
        for (let ball of ballsToRespawn) {
            // Special handling for respawning the cue ball
            if (ball instanceof CueBall) {
                isRepositioningCueBall = true;
                enableCueBallPhysics();
            } else {
                // Respawn specific coloured balls at their starting positions
                switch (ball.colour) {
                    case ballColours.yellow:
                        balls.push(new Ball(ballColours.yellow, { x: width / 2 - ballDiameter * 10, y: height / 2 + ballDiameter * 3 }));
                        break;
                    case ballColours.green:
                        balls.push(new Ball(ballColours.green, { x: width / 2 - ballDiameter * 10, y: height / 2 - ballDiameter * 3 }));
                        break;
                    case ballColours.brown:
                        balls.push(new Ball(ballColours.brown, { x: width / 2 - ballDiameter * 10, y: height / 2 }));
                        break;
                    case ballColours.blue:
                        balls.push(new Ball(ballColours.blue, { x: width / 2, y: height / 2 }));
                        break;
                    case ballColours.pink:
                        balls.push(new Ball(ballColours.pink, { x: width / 2 + ballDiameter * 9 - ballDiameter, y: height / 2 }));
                        break;
                    case ballColours.black:
                        balls.push(new Ball(ballColours.black, { x: width / 2 + ballDiameter * 15, y: height / 2 }));
                        break;
                };
            };
        };

        // Clear the list after respawning all balls
        ballsToRespawn = [];
    }   

    // Check if the current ball mode is set to 3, which is the weather effects mode
    if (ballMode == 3) {
        displayWeatherCountdownBar(); // Call the function to display the weather countdown bar
        applyWeatherEffects(); // Call the function to apply dynamic weather effects to the game
    };

    // Debug mode for rendering physics bodies
    if (debugMode) {
        displayCollisionInfo(); // Show last collision info
        debugRender(); // Render debug view
    };
};

/////////////////////////////////////
// All Functions besides setup and draw
/////////////////////////////////////

// Function to render a box around Matter.js bodies
function debugRender() {
    // Get all bodies from the engine's world
    let bodies = Matter.Composite.allBodies(engine.world);

    // Begin drawing
    push();
    noFill(); // No fill to see through the bodies
    stroke(255, 0, 0); // Red colour for visibility
    strokeWeight(1); // Thin line weight for precision

    // Loop over all bodies and draw them
    for (let i = 0; i < bodies.length; i++) {
        let vertices = bodies[i].vertices; // Get the vertices of the body
        beginShape();
        // Draw a shape using the vertices
        for (let j = 0; j < vertices.length; j++) {
            vertex(vertices[j].x, vertices[j].y);
        }
        endShape(CLOSE);
    };
    pop();
};

// Function to manage application of weather effects
function applyWeatherEffects() {
    // Check if wind is active and the timer hasn't expired
    if (isWindActive && windTimer > 0) {
        // Generate a reduced wind force vector
        windForce = createVector(random(-0.001, 0.001), random(-0.001, 0.001)).mult(0.25);
        // Apply wind force to all balls on the table
        balls.forEach(ball => {
            if (ball.body) {
                Body.applyForce(ball.body, ball.body.position, windForce);
            }
        });
        // Decrement the wind timer
        windTimer--;
        // Deactivate wind and reset no wind timer when wind timer reaches zero
        if (windTimer === 0) {
            noWindTimer = 20 * 60;
            isWindActive = false;
        }
    // Check if wind is not active and the no wind timer hasn't expired
    } else if (!isWindActive && noWindTimer > 0) {
        // Reset cue ball velocity if not already checked for strike
        if (!checkIfCueBallStrike){
            Matter.Body.setVelocity(window.cueBall, { x: 0, y: 0 });
            checkIfCueBallStrike = true;
        }
        // Decrement the no wind timer
        noWindTimer--;
        // Reactivate wind and reset wind timer when no wind timer reaches zero
        if (noWindTimer === 0) {
            windTimer = 20 * 60;
            isWindActive = true;
            checkIfCueBallStrike = false;
        }
    }
    // Update the visual rain particles effect
    updateRainParticles();
}

// Function to simulate and update the visual effect of rain particles
function updateRainParticles() {
    // Generate rain particles at a specific interval
    if (frameCount*100) { // Adjust this condition to control the particle generation rate
        // Create a rain particle with physics properties
        let rainParticle = Bodies.circle(random(width), -10, 3, {
            isSensor: true, // Particle does not cause collisions
            collisionFilter: {
                category: 0x0002, // Specific category for rain particles
                mask: 0x0000, // Prevents collision with any other bodies
            }
        });
        // Add the particle to the physics world and tracking array
        World.add(engine.world, rainParticle);
        rainParticles.push(rainParticle);
    }

    // Update position of rain particles and apply wind force
    for (let i = rainParticles.length - 1; i >= 0; i--) {
        let p = rainParticles[i];
        // Apply a downward force to simulate gravity on the particle
        Body.applyForce(p, p.position, { x: 0, y: 0.0002 });
        // If wind is active, apply the wind force to the particle
        if (isWindActive) {
            Body.applyForce(p, p.position, windForce);
        }
        push(); // Save current drawing settings
        // Set the fill colour and draw the particle as an ellipse
        fill('#9EC6C6'); // Light blue colour for rain
        ellipse(p.position.x, p.position.y, 3); // Visual representation of the rain drop
        pop(); // Restore drawing settings

        // Remove the particle if it falls off the bottom of the canvas
        if (p.position.y > height + 5) {
            World.remove(engine.world, p); // Remove from physics world
            rainParticles.splice(i, 1); // Remove from tracking array
        }
    }
}

// Function to display a countdown bar for the weather effects
function displayWeatherCountdownBar() {
    push(); // Save the drawing state
    // Set the position and dimensions for the countdown bar
    let barX = 13;
    let barY = 50; // Position from the top of the canvas
    let barWidth = 20;
    let barHeight = 100;
    
    // Draw the static background of the bar
    fill(255); // White colour for the background
    rect(barX, barY, barWidth, barHeight);
    
    // Determine the fill colour of the countdown based on weather status
    if (isWindActive) {
        fill('#6495ED'); // Blue colour when weather effect is active
    } else {
        fill('#32CD32'); // Green colour when there's no weather effect
    }
    
    // Calculate the proportion of the timer to determine the filled bar height
    let timerRatio = isWindActive ? windTimer / (20 * 60) : noWindTimer / (20 * 60);
    let timerBarHeight = barHeight * timerRatio;
    
    // Draw the countdown bar representing the timer
    rect(barX, barY + barHeight - timerBarHeight, barWidth, timerBarHeight);
    
    pop(); // Restore the drawing state
}

// Update the keyPressed function to toggle debug mode or change ball mode
function keyPressed() {
    // Handle ball mode selection with number keys
    if (key === '1') {
        ballMode = 0;
        Ball.initializeBalls(ballMode);
    } else if (key === '2') {
        ballMode = 1;
        Ball.initializeBalls(ballMode);
    } else if (key === '3') {
        ballMode = 2;
        Ball.initializeBalls(ballMode);
    } else if (key === '4') {
        ballMode = 3;
        Ball.initializeBalls(ballMode);
    }

    if (key >= '1' && key <= '4') {
        ballMode = parseInt(key) - 1; // Convert key to ballMode index
        Ball.initializeBalls(ballMode);
        
        // Reset and reposition cue ball
        let cueBallPosition = confinePointToD(width / 4, height / 2);
        if (window.cueBall) {
            Matter.Body.setPosition(window.cueBall, cueBallPosition);
            Matter.Body.setVelocity(window.cueBall, { x: 0, y: 0 });
        }
        isRepositioningCueBall = true;

        // Remove the cue during repositioning
        if (cue) {
            cue.isStriking = false; // Reset striking state
        }
    }

    if (key === 'D' || key === 'd') {
        debugMode = !debugMode; // Toggle the debug mode
    };
};

// Handles mouse movement events
function mouseMoved() {
    // Update the angle and position of the cue when the mouse moves
    if (cue && !cue.isStriking && !isRepositioningCueBall) {
        let cueBallPos = cue.cueBallInstance.body.position;
        cue.calculateAngle(mouseX, mouseY, cueBallPos);
        let mouseDist = dist(mouseX, mouseY, cueBallPos.x, cueBallPos.y);
        cue.updateCuePosition(mouseDist);
    };
};

// Handles mouse click events for cue ball striking and position confirmation
function mouseClicked() {
    // Check if we are not in the cue ball repositioning mode
    if (!isRepositioningCueBall) {
        // Determine if the cue ball is stationary (i.e., not moving and not spinning)
        let cueBallIsStationary = Math.abs(window.cueBall.velocity.x) < 0.01 &&
                                  Math.abs(window.cueBall.velocity.y) < 0.01 &&
                                  Math.abs(window.cueBall.angularVelocity) < 0.01;

        // Trigger cue strike if the cue ball is stationary and cue is not already striking
        if (cueBallIsStationary && !cue.isStriking) {
            // Strike the cue ball using the cue object
            cue.strike(window.cueBall);
        };
    } else {
        // If in repositioning mode, confirm the cue ball's position with a left click
        if (mouseButton === LEFT && isWithinD(mouseX, mouseY)) {
            // End repositioning mode and ensure the cue ball stops moving
            isRepositioningCueBall = false;
            // Reset the cue ball's velocity to zero to stop any residual movement
            Matter.Body.setVelocity(window.cueBall, { x: 0, y: 0 });
        };
    };
};

// Method to re-enable physics for cue ball after repositioning
function enableCueBallPhysics() {
    let cueBallPosition = confinePointToD(width / 4, height / 2); // Calculate a new position for the cue ball within the 'D' area
    let cueBall = new CueBall(cueBallPosition, true); // Create a new CueBall instance with physics enabled at the calculated position
    balls.push(cueBall); // Add the new cue ball to the array of balls
    window.cueBall = cueBall.body; // Update the global reference to the cue ball's physics body
    cue.cueBallInstance = cueBall; // Update the cue's reference to the current cue ball instance
};

// Confines a point to the 'D' area on the snooker table
function confinePointToD(x, y) {
    // Define 'D' area parameters
    let dRadius = tableWidth / 12; // Radius of the 'D' area
    let dCenterX = width / 4 + ballDiameter * 1.2; // Center X-coordinate of the 'D'
    let dCenterY = height / 2; // Center Y-coordinate of the 'D'

    // Calculate angle from D center to the current mouse position
    let angle = atan2(y - dCenterY, x - dCenterX);
    // Calculate the distance from the current position to D center
    let distance = dist(x, y, dCenterX, dCenterY);

    // Calculate a new position based on the angle and radius
    // This position is on the edge of the D area
    let dx = dCenterX + dRadius * cos(angle);
    let dy = dCenterY + dRadius * sin(angle);

    // If the original position is outside the D area,
    // adjust it to the calculated position on the edge
    if (distance > dRadius) {
        x = dx;
        y = dy;
    };

    // Ensure the x-coordinate of the position does not exceed the center of the D
    // This keeps the cue ball inside the semicircle part of the D
    if (x > dCenterX) {
        x = dCenterX;
    };

    // Return the adjusted position within the D area
    return { x: x, y: y };
};

// Checks if a point is within the 'D' area on the snooker table
function isWithinD(x, y) {
    // Define the radius of the 'D' semicircle based on table width
    let dRadius = tableWidth / 12;
    // Calculate the center point of the 'D' area
    let dCenterX = width / 4 + ballDiameter * 1.2; // Slightly offset from the quarter width
    let dCenterY = height / 2; // Vertically centered

    // Check if the point (x, y) is within the semicircle's radius and to the left of the center
    // This ensures that the point is within the 'D' shape and not just the semicircle
    return dist(x, y, dCenterX, dCenterY) <= dRadius && x <= dCenterX;
};

// This function is called every time a collision starts in the physics engine
function onCollision(event) {
    // Iterate over all pairs of colliding bodies
    let pairs = event.pairs;
    
    // Go through each pair to find any collisions with the cue ball
    for (let i = 0; i < pairs.length; i++) {
        let pair = pairs[i];
        
        // Check if the cue ball is one of the colliding bodies
        if (pair.bodyA === window.cueBall || pair.bodyB === window.cueBall) {
            // Identify the other body involved in the collision
            let otherBody = pair.bodyA === window.cueBall ? pair.bodyB : pair.bodyA;
            
            // Check if the other body is a cushion by its label
            if (otherBody.label === 'Cushion') {
                // Log the collision with a cushion to the console
                lastCollision = 'Cue ball hit a cushion';
                console.log('Cue ball hit a cushion');
            } else if (otherBody.label === 'Ball') {
                // If the other body is not a cushion, it must be a ball
                // Retrieve the colour of the ball from a property where it's stored
                let ballColour = otherBody.render.fillStyle;
                
                // Log the collision with the specific colour of ball to the console
                lastCollision = 'Cue ball hit a ' + ballColour + ' ball';
                console.log('Cue ball hit a ' + ballColour + ' ball');
            };
        };
    };
};

// Function to render the collision information
function displayCollisionInfo() {
    push();
    // Set the text colour to white
    fill(255);
    // No stroke for the text
    noStroke();
    // Set the text size
    textSize(16);
    // Display the text at the bottom left of the canvas
    text(lastCollision, 90, height - 8);
    pop();
};

// Function to check if any ball on the table is moving
function anyBallMoving() {
    // Loop through each ball in the balls array
    for (let ball of balls) {
        // Check if the ball's velocity in either the X or Y direction is greater than 0.01
        if (Math.abs(ball.body.velocity.x) > 0.01 || Math.abs(ball.body.velocity.y) > 0.01) {
            return true; // If any ball is moving, return true immediately
        };
    };
    return false; // If the loop completes and no moving balls are found, return false
};

// Function to check if the cue ball on the table is moving
function isCueBallMoving() {
    // Check if the cue ball's physics body is defined
    if (window.cueBall) {
        // Check if the cue ball's velocity in either the X or Y direction is greater than 0.01
        if (Math.abs(window.cueBall.velocity.x) > 0.01 || Math.abs(window.cueBall.velocity.y) > 0.01) {
            return true; // The cue ball is moving
        }
    }
    return false; // The cue ball is not moving or not defined
}

/////////////////////////////////////
// All Classes
/////////////////////////////////////

// Cue class for managing the snooker cue's behavior and appearance
class Cue {
    // Constructor to initialize cue properties
    constructor(length, width, colour, cueBall) {
        this.length = length; // Length of the cue stick
        this.width = width; // Width of the cue stick
        this.colour = colour; // Colour of the cue stick
        // Initial position of the cue based on the cue ball's position
        this.x = cueBall.position.x;
        this.y = cueBall.position.y;
        this.angle = 0; // Initial angle of the cue, initially set to 0
        this.isStriking = false; // State to indicate if a strike is in progress
        this.cueBallInstance = cueBall; // Reference to the cue ball object
        // Maximum force that can be applied to the cue ball on strike
        this.maxForce = 0.001;
        // Minimum distance of the cue from the cue ball for maximum force application
        this.minCueDistance = 50;
        // Maximum distance the cue can be pulled back for striking
        this.maxCueOffset = 100;
        // Initial force multiplier, which can be modified during gameplay
        this.forceMultiplier = 5;
        // Maximum value that the force multiplier can reach
        this.maxForceMultiplier = 10;
    };

    // Update the position of the cue based on the cue ball's current position
    updatePosition() {
        // Only update the position if the cue ball exists and no strike is happening
        if (this.cueBallInstance && !this.isStriking) {
            let cueBallPos = this.cueBallInstance.body.position;
            // Adjust the cue's position relative to the cue ball's position
            this.x = cueBallPos.x - ballDiameter * cos(this.angle);
            this.y = cueBallPos.y - ballDiameter * sin(this.angle);
            // Ensure the cue ball stays within the table's boundaries
            this.cueBallInstance.constrainPosition();
        };
    };

    // Calculate the angle of the cue based on mouse position
    calculateAngle(mouseX, mouseY, cueBallPos) {
        // Calculate the angle between the cue ball and mouse cursor
        let deltaX = cueBallPos.x - mouseX;
        let deltaY = cueBallPos.y - mouseY;
        // Update the cue's angle
        this.angle = atan2(deltaY, deltaX);
    };

    // Updates the position of the cue's back end based on mouse distance
    updateCuePosition(mouseDist) {
        // Define a threshold to prevent rapid changes in cue position
        let threshold = 10;
        if (mouseDist > threshold) {
            // Calculate the new position within the limits of max cue offset
            let offset = min(mouseDist - threshold, this.maxCueOffset);
            // Update the back end of the cue's position
            this.x += offset * cos(this.angle);
            this.y += offset * sin(this.angle);
        };
    };

    // Calculates the force based on the cue's distance from the cue ball
    getForceBasedOnDistance() {
        let cueBallPos = this.cueBallInstance.body.position;
        let distance = dist(this.x, this.y, cueBallPos.x, cueBallPos.y);
        // Map the distance to a force value, respecting the maximum force limit
        return map(distance, this.minCueDistance, this.length, this.maxForce, 0, true);
    };

    // Adjusts the force multiplier based on user input (up or down arrow keys)
    changeForce(increase) {
        const forceChange = 0.2; // Increment/decrement value for force change
        // Increase or decrease the force multiplier within allowed limits
        if (increase && this.forceMultiplier < this.maxForceMultiplier) {
            this.forceMultiplier += forceChange;
        } else if (!increase && this.forceMultiplier > 1) {
            this.forceMultiplier -= forceChange;
        };
    };

    // Handles the cue strike action
    strike(cueBall) {
        // Execute only if not currently striking and the cue ball is present
        if (!this.isStriking && cueBall) {
            this.isStriking = true;
            // Initiate the cue strike animation
            this.animateCueStrike(cueBall, () => {
                // Calculate the force vector based on angle and magnitude
                let forceMagnitude = this.maxForce * this.forceMultiplier;
                let forceDirection = p5.Vector.fromAngle(this.angle);
                let forceVector = forceDirection.mult(forceMagnitude);
                // Apply the calculated force to the cue ball
                Body.applyForce(cueBall, cueBall.position, forceVector);
                // Reset the striking flag after the animation is complete
                setTimeout(() => {
                    this.isStriking = false;
                }, 500);
            });
        };
    };

    // Animates the cue strike, including the pull-back and forward strike motion
    animateCueStrike(cueBall, callback) {
        // Calculate the duration for the pull-back and strike phases
        let totalAnimationDuration = map(this.forceMultiplier, 1, this.maxForceMultiplier, 375, 625);
        let pullBackDuration = (totalAnimationDuration * 3) / 4; // Pull-back phase
        let strikeDuration = totalAnimationDuration / 4; // Strike phase
        let frames = 60; // Total number of frames for the animation
        // Calculate the number of frames for pull-back and strike phases
        let pullBackFrames = Math.round((frames * pullBackDuration) / totalAnimationDuration);
        let strikeFrames = frames - pullBackFrames;
        // Store the original position of the cue
        let originalPosition = { x: this.x, y: this.y };
        // Calculate the maximum pull-back distance
        let maxPullBack = this.length / 2;
        // Calculate the pull-back distance based on the force multiplier
        let pullBackDistance = map(this.forceMultiplier, 1, this.maxForceMultiplier, 0, maxPullBack);

        // Animate the pull-back phase
        for (let i = 0; i < pullBackFrames; i++) {
            setTimeout(() => {
                let lerpFactor = i / pullBackFrames;
                // Gradually move the cue backwards
                this.x = lerp(originalPosition.x, originalPosition.x + pullBackDistance * cos(this.angle), lerpFactor);
                this.y = lerp(originalPosition.y, originalPosition.y + pullBackDistance * sin(this.angle), lerpFactor);
            }, (pullBackDuration / pullBackFrames) * i);
        };

        // Animate the strike phase
        let strikeStartPosition = {
            x: originalPosition.x + pullBackDistance * cos(this.angle),
            y: originalPosition.y + pullBackDistance * sin(this.angle)
        };
        let cueContactPosition = {
            x: cueBall.position.x + ballRadius * cos(this.angle),
            y: cueBall.position.y + ballRadius * sin(this.angle)
        };

        for (let i = 0; i < strikeFrames; i++) {
            setTimeout(() => {
                let lerpFactor = i / strikeFrames;
                // Gradually move the cue forward to strike
                this.x = lerp(strikeStartPosition.x, cueContactPosition.x - (ballRadius * 2) * cos(this.angle), lerpFactor);
                this.y = lerp(strikeStartPosition.y, cueContactPosition.y - (ballRadius * 2) * sin(this.angle), lerpFactor);

                if (i === strikeFrames - 1 && callback) {
                    callback(); // Execute the callback function after the strike
                };
            }, pullBackDuration + (strikeDuration / strikeFrames) * i);
        };
    };

    // Renders the cue on the canvas with detailed design
    display() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);

        // Total length of the cue in our scale
        let totalCueLength = this.length;

        // Ratios based on real-life measurements
        let shaftRatio = 29 / 58.5;
        let handleRatio = 29 / 58.5;
        let tipRatio = 0.5 / 58.5;

        // Calculate lengths of each part based on ratios
        let shaftLength = shaftRatio * totalCueLength;
        let handleLength = handleRatio * totalCueLength;
        let tipLength = tipRatio * totalCueLength;

        // Calculate widths
        let tipWidthRatio = 0.4 / 1.18; // Ratio of tip width to handle width
        let tipWidth = tipWidthRatio * this.width;
        let handleWidth = this.width;

        // Draw the handle (brown colour)
        fill('#6f482a');
        rect(shaftLength, -handleWidth / 2, handleLength, handleWidth);

        // Draw the shaft (wood colour)
        fill('#fcf2cd');
        rect(0 + tipLength, -this.width / 2, shaftLength, this.width);

        // Draw the tip (white colour)
        fill('#f2f3f2');
        rect(0 + 3 * (tipLength / 4), -tipWidth / 2, tipLength, tipWidth);

        // Draw the very tip (grey colour)
        fill('#505050');
        rect(0 + tipLength / 4, -tipWidth / 2, tipLength / 2, tipWidth);

        pop();
    };

    // Displays the force bar to indicate the current force multiplier
    displayForceBar() {
        push();
        fill(100);
        rect(width - 30, 50, 20, 100);
        fill(255, 0, 0);
        let barHeight = map(this.forceMultiplier, 1, this.maxForceMultiplier, 0, 98);
        rect(width - 30, 150 - barHeight, 20, barHeight);
        pop();
    };
};

// Table class defines the snooker table
class Table {
    // Constructor to initialize table properties
    constructor(width, height) {
        this.width = width; // Width of the table
        this.height = height; // Height of the table
        this.colour = tableColour; // Colour of the table surface
        this.pocketColour = pocketColour; // Colour of the table pockets
        this.createCushionBodies();
    };     

    // Draws the "D" on the table
    drawD() {
        let dRadius = this.width / 12; // Radius of the "D" semicircle
        let dCenterX = width / 4 + ballDiameter * 1.2; // Center X-coordinate of the "D"
        let dCenterY = height / 2; // Center Y-coordinate of the "D"

        push();
        translate(dCenterX, dCenterY); // Move the origin to the center of the semicircle
        rotate(-PI / 2); // Rotate by -90 degrees

        noFill(); // No fill for the semicircle
        stroke(255); // White colour for visibility
        strokeWeight(2); // Thickness of the semicircle line
        arc(0, 0, dRadius * 2, dRadius * 2, -PI, 0); // Drawing the semicircle

        // Drawing the line at the straight part of the "D"
        line(this.width, 0, -this.width, 0);

        pop(); // Restore original transformation state
    };

    // This method creates and positions the cushion bodies using Matter.js
    createCushionBodies() {
        // Define the physical properties for all cushion bodies
        let options = {
            isStatic: true, // Cushions shouldn't move
            restitution: 0.8, // Slightly bouncy, typical for snooker cushions
            label: 'Cushion' // Add a label to the cushion
        };

        // Define additional static body options for the table border
        let borderOptions = {
            isStatic: true,   // Table border shouldn't move
            restitution: 0.8 // Slightly bouncy
        };
        // The thickness of the border (as visualized) should match the cushion width plus any additional border thickness
        let borderThickness = ballDiameter * 1.5 ; // Adjust this if the visual thickness is different

        // Calculate the positions of the border bodies. The x and y coordinates should place the body at the center of the border
        // Top border body
        let borderTop = Bodies.rectangle(width / 2, (height - this.height) / 2 - borderThickness, this.width + borderThickness * 2, borderThickness, borderOptions);
        // Bottom border body
        let borderBottom = Bodies.rectangle(width / 2, (height + this.height) / 2 + borderThickness, this.width + borderThickness * 2, borderThickness, borderOptions);
        // Left border body
        let borderLeft = Bodies.rectangle((width - this.width) / 2 - borderThickness, height / 2, borderThickness, this.height + borderThickness * 2, borderOptions);
        // Right border body
        let borderRight = Bodies.rectangle((width + this.width) / 2 + borderThickness, height / 2, borderThickness, this.height + borderThickness * 2, borderOptions);

        // Add the border bodies to the world
        World.add(engine.world, [borderTop, borderBottom, borderLeft, borderRight]);

        // Determine the diameter and radius of pockets to help position the cushions
        let pocketDiameter = ballDiameter * 1.5;
        let pocketRadius = pocketDiameter / 2;
        
        // Calculate the length of the cushions, taking into account the pocket diameters
        let cushionLengthHorizontal = (this.width - 2 * pocketDiameter) / 2;
        // Calculate the vertical length of the cushions, accounting for the pocket size
        let cushionLengthVertical = this.height - pocketDiameter;
        // Set the cushion width to be the same as the ball diameter for visual consistency
        let cushionWidth = ballDiameter * 1.5;

        // Define the position and rotation data for each cushion, ensuring they are placed correctly
        let cushionData = [
            // Top left horizontal cushion, no rotation needed
            { x: (width - this.width) / 2 + pocketDiameter / 2 + cushionLengthHorizontal / 2, 
            y: (height - this.height) / 2 + pocketRadius - cushionWidth / 2, rotation: 0, horizontal: true },
            // Top right horizontal cushion, no rotation needed
            { x: (width - this.width) / 2 + this.width - pocketDiameter / 2 - cushionLengthHorizontal / 2, 
            y: (height - this.height) / 2 + pocketRadius - cushionWidth / 2, rotation: 0, horizontal: true },
            // Bottom left horizontal cushion, rotated 180 degrees to flip vertically
            { x: (width - this.width) / 2 + pocketDiameter / 2 + cushionLengthHorizontal / 2, 
            y: (height - this.height) / 2 + this.height - pocketRadius + cushionWidth / 2, rotation: 180, horizontal: true },
            // Bottom right horizontal cushion, rotated 180 degrees to flip vertically
            { x: (width - this.width) / 2 + this.width - pocketDiameter / 2 - cushionLengthHorizontal / 2, 
            y: (height - this.height) / 2 + this.height - pocketRadius + cushionWidth / 2, rotation: 180, horizontal: true },
            // Left vertical cushion, rotated 270 degrees to orient vertically
            { x: (width - this.width) / 2 + pocketRadius - cushionWidth / 2, 
            y: (height - this.height) / 2 + pocketDiameter / 2 + cushionLengthVertical / 2, rotation: 270, horizontal: false },
            // Right vertical cushion, rotated 90 degrees to orient vertically
            { x: (width - this.width) / 2 + this.width - pocketRadius + cushionWidth / 2, 
            y: (height - this.height) / 2 + pocketDiameter / 2 + cushionLengthVertical / 2, rotation: 90, horizontal: false }
        ];

        // Iterate over each cushion's configuration data to create and draw them
        cushionData.forEach(cushion => {
            // Calculate the length of the cushion based on its orientation
            let length = cushion.horizontal ? cushionLengthHorizontal : cushionLengthVertical;
        
            // Define vertices for the shape of the cushion in local space
            let vertices = [
              { x: -length / 2, y: -cushionWidth / 2 },
              { x: length / 2, y: -cushionWidth / 2 },
              { x: length / 2 - cushionWidth, y: cushionWidth / 2 },
              { x: -length / 2 + cushionWidth, y: cushionWidth / 2 }
            ];
        
            // Create the cushion body from the vertices
            let cushionBody = Matter.Bodies.fromVertices(cushion.x, cushion.y, vertices, options, true);
        
            // Set the angle of the body if needed
            Matter.Body.setAngle(cushionBody, radians(cushion.rotation));
        
            // Add the cushion body to the Matter.js world for physics simulation
            World.add(engine.world, cushionBody);
          });
    };

    // Method to visually display the snooker table including the cushions, pockets, and "D" marking
    display() {
        // Fill colour for the table surface is set to the predefined table colour, usually green
        fill(this.colour);
        // Draw the main rectangle for the snooker table surface using the table's width and height
        rect((width - this.width) / 2, (height - this.height) / 2, this.width, this.height);
        // Draw a larger rectangle to cover the area underneath the borders and pockets
        rect(this.width*0.103 - ballDiameter * 1.5, (height - this.height) / 3, this.width*1.085 + ballDiameter * 1.5, this.width*0.5 + ballDiameter * 1.7);
        // Render the "D" shape by calling a dedicated method for it
        this.drawD();

        // Save current drawing settings
        push();
        // Set the fill colour for the borders to a wood-like colour
        fill('#40240c');
        // Set the stroke thickness
        stroke(2);
        // Draw the top border with rounded corners on the left and right side
        rect(this.width*0.103 - ballDiameter * 1.5, -1, this.width*1.085 + ballDiameter * 1.5, ballDiameter * 1.5, 100, 100, 0, 0);
        // Draw the bottom border with rounded corners on the left and right side
        rect(this.width*0.103 - ballDiameter * 1.5, height*0.936, this.width*1.085 + ballDiameter * 1.5, ballDiameter * 1.5 , 0, 0, 100, 100);
        // Draw the left border without rounded corners
        rect(this.width*0.103 - ballDiameter * 1.5, ballDiameter * 1.4, ballDiameter * 1.5, this.width*0.5 + ballDiameter * 1.7);
        // Draw the right border without rounded corners
        rect(this.width*1.105 + ballDiameter * 1.5, ballDiameter * 1.4, ballDiameter * 1.5, this.width*0.5 + ballDiameter * 1.7);

        // Set the fill colour for the decorative golden edges
        fill('#f2d84a')
        // Draw the top left decorative corner with rounded edges
        rect(this.width*0.102 - ballDiameter * 1.5, -1, ballDiameter * 2.5, ballDiameter * 2.5, 15, 0, 0, 0);
        // Draw the top middle decorative edge
        rect(width/2 - (ballDiameter * 1.5)/2, -1, ballDiameter * 1.5, ballDiameter * 2);
        // Draw the top right decorative corner with rounded edges
        rect(this.width*1.12, -1, ballDiameter * 2.5, ballDiameter * 2.5, 0, 15, 0, 0);
        // Draw the bottom right decorative corner with rounded edges
        rect(this.width*1.12, height*0.89, ballDiameter * 2.5, ballDiameter * 2.5, 0, 0, 15, 0);
        // Draw the bottom middle decorative edge
        rect(width/2 - (ballDiameter * 1.5)/2, height*0.91, ballDiameter * 1.5, ballDiameter * 2);
        // Draw the bottom left decorative corner with rounded edges
        rect(this.width*0.102 - ballDiameter * 1.5, height*0.89, ballDiameter * 2.5, ballDiameter * 2.5, 0, 0, 0, 15);
        // Restore previous drawing settings
        pop();
        
        // Determine the pocket size based on the ball diameter, typically larger than the ball
        let pocketDiameter = ballDiameter * 1.5;
        // Calculate the radius from the pocket diameter for positioning and drawing
        let pocketRadius = pocketDiameter / 2;

        // Loop over potential x and y positions to place pockets at each corner and the middle of each long side
        for (let x of [0, this.width / 2, this.width]) {
            for (let y of [0, this.height]) {
                // Use the pocket colour for the fill before drawing the pocket
                fill(this.pocketColour);
                // Draw pockets as ellipses at the calculated positions on the snooker table
                ellipse((width - this.width) / 2 + x, (height - this.height) / 2 + y, pocketDiameter);
            };
        };

        // Calculate the length of the cushions, taking into account the pocket diameters
        let cushionLengthHorizontal = (this.width - 2 * pocketDiameter) / 2;
        // Calculate the vertical length of the cushions, accounting for the pocket size
        let cushionLengthVertical = this.height - pocketDiameter;
        // Set the cushion width to be the same as the ball diameter for visual consistency
        let cushionWidth = ballDiameter * 1.5;

        // Define the position and rotation data for each cushion, ensuring they are placed correctly
        let cushionData = [
            // Top left horizontal cushion, no rotation needed
            { x: (width - this.width) / 2 + pocketDiameter / 2 + cushionLengthHorizontal / 2, 
            y: (height - this.height) / 2 + pocketRadius - cushionWidth / 2, rotation: 0, horizontal: true },
            // Top right horizontal cushion, no rotation needed
            { x: (width - this.width) / 2 + this.width - pocketDiameter / 2 - cushionLengthHorizontal / 2, 
            y: (height - this.height) / 2 + pocketRadius - cushionWidth / 2, rotation: 0, horizontal: true },
            // Bottom left horizontal cushion, rotated 180 degrees to flip vertically
            { x: (width - this.width) / 2 + pocketDiameter / 2 + cushionLengthHorizontal / 2, 
            y: (height - this.height) / 2 + this.height - pocketRadius + cushionWidth / 2, rotation: 180, horizontal: true },
            // Bottom right horizontal cushion, rotated 180 degrees to flip vertically
            { x: (width - this.width) / 2 + this.width - pocketDiameter / 2 - cushionLengthHorizontal / 2, 
            y: (height - this.height) / 2 + this.height - pocketRadius + cushionWidth / 2, rotation: 180, horizontal: true },
            // Left vertical cushion, rotated 270 degrees to orient vertically
            { x: (width - this.width) / 2 + pocketRadius - cushionWidth / 2, 
            y: (height - this.height) / 2 + pocketDiameter / 2 + cushionLengthVertical / 2, rotation: 270, horizontal: false },
            // Right vertical cushion, rotated 90 degrees to orient vertically
            { x: (width - this.width) / 2 + this.width - pocketRadius + cushionWidth / 2, 
            y: (height - this.height) / 2 + pocketDiameter / 2 + cushionLengthVertical / 2, rotation: 90, horizontal: false }
        ];

        // Set the colour for the cushions before drawing them
        fill('#326218');
        
        // Iterate over each cushion's configuration data to draw them on the canvas
        cushionData.forEach(cushion => {
            // Save the current drawing state
            push();

            // Rotate the canvas to align with the cushion's orientation
            translate(cushion.x, cushion.y);
            rotate(radians(cushion.rotation));

            // Calculate the length of the cushion based on its orientation
            let length = cushion.horizontal ? cushionLengthHorizontal : cushionLengthVertical;

            // Draw the cushion using the quad() function
            quad(
                -length / 2, -cushionWidth / 2,  // First vertex: top-left corner of the cushion
                length / 2, -cushionWidth / 2,   // Second vertex: top-right corner
                length / 2 - cushionWidth, cushionWidth / 2, // Third vertex: bottom-right corner, inset for beveled edge
                -length / 2 + cushionWidth, cushionWidth / 2 // Fourth vertex: bottom-left corner, also inset for beveled edge
            );

            // Restore the drawing state to ensure subsequent operations are not affected
            pop();
        });
    };
};

// Ball class defines the properties and behavior of a snooker ball
class Ball {
    // Constructor for the Ball class
    constructor(colour, position, hasPhysics = true) {
        this.colour = colour; // Colour of the ball
        this.position = position; // Starting position of the ball
        this.diameter = ballDiameter; // Diameter of the ball, defined globally
        this.radius = this.diameter / 2; // Radius of the ball

        // Create a physics body for the ball if hasPhysics is true
        if (hasPhysics) {
            this.body = this.createPhysicalBall(); // Creating a Matter.js body for the ball
            World.add(engine.world, this.body); // Add the ball's body to the Matter.js world
        };
    };

    // Creates a physical ball with physics properties
    createPhysicalBall() {
        let ballOptions = {
            restitution: 0.8, // Bounciness of the ball
            friction: 0.05, // Friction with the table
            frictionAir: 0.01, // Air friction
            mass: 0.17, // Mass of the ball
            label: 'Ball', // Add a label to the ball
            render: { fillStyle: this.colour } // Rendering colour in the physics engine
        };
        return Bodies.circle(this.position.x, this.position.y, this.radius, ballOptions);
    };

    // Displays the ball on the canvas
    display() {
        fill(this.colour); // Set the fill colour for the ball
        // Check if the ball has a physics body before drawing
        if (this.body) {
            // Draw the ball as an ellipse at the body's current position
            ellipse(this.body.position.x, this.body.position.y, this.diameter, this.diameter);
        } else {
            // If no physics body, draw the ball at its initial position
            ellipse(this.position.x, this.position.y, this.diameter, this.diameter);
        };
    };

    // Generates a random position within the table boundaries
    static createRandomPosition() {
        return {
            x: random((width - tableWidth) / 2 + ballRadius, (width + tableWidth) / 2 - ballRadius),
            y: random((height - tableHeight) / 2 + ballRadius, (height + tableHeight) / 2 - ballRadius)
        };
    };

    // Static method to initialize balls on the table based on the selected game mode
    static initializeBalls(mode) {
        // First, remove any existing balls from the physics world to reset the game
        balls.forEach(ball => World.remove(engine.world, ball.body));
        
        balls = []; // Clear the balls array for a fresh start

        // Mode 0: Standard starting positions
        if (mode === 0) {
            Ball.setUpStartingPositions(); // Call static method to arrange balls in standard formation
        } 
        // Modes 1 and 2: Random positioning for red balls
        else if (mode === 1 || mode === 2) {
            // Create 15 red balls at random positions on the table
            for (let i = 0; i < 15; i++) {
                balls.push(new Ball(ballColours.red, Ball.createRandomPosition()));
            }
            // Mode 2 only: Additionally, place coloured balls at random positions
            if (mode === 2) {
                Object.values(ballColours)
                    .filter(colour => colour !== 'red' && colour !== 'white') // Exclude red and white balls
                    .forEach(colour => balls.push(new Ball(colour, Ball.createRandomPosition())));
            };
        } 
        // Mode 3: Apply Weather Effects to the Standard starting positions
        else if(mode === 3) {
            Ball.setUpStartingPositions(); // Call static method to arrange balls in standard formation
        };

        // Create and add the cue ball to the game
        let cueBall = new CueBall({ x: width / 4, y: height / 2 });
        balls.push(cueBall); // Add the cue ball to the balls array
        window.cueBall = cueBall.body; // Store reference to the cue ball's physics body globally
        cue.cueBallInstance = cueBall; // Update the cue object with the new cue ball instance
    };


    // Static method to set up starting positions of balls for standard game
    static setUpStartingPositions() {
        // Define the starting position for the red balls in a triangular formation
        let redStartPosition = { x: width / 2 + ballDiameter * 9, y: height / 2 };
        let rowLength = 5; // Triangle consists of 5 rows

        // Loop to place red balls in a triangle formation
        for (let row = 0; row < rowLength; row++) {
            for (let col = 0; col <= row; col++) {
                let position = {
                    x: redStartPosition.x + (row * ballDiameter * Math.sqrt(3) / 2),
                    y: redStartPosition.y - (row * ballDiameter / 2) + (col * ballDiameter)
                };
                balls.push(new Ball(ballColours.red, position)); // Add each red ball
            };
        };

        // Place coloured balls at specific positions on the table
        balls.push(new Ball(ballColours.yellow, { x: width / 2 - ballDiameter * 10, y: height / 2 + ballDiameter * 3 }));
        balls.push(new Ball(ballColours.green, { x: width / 2 - ballDiameter * 10, y: height / 2 - ballDiameter * 3 }));
        balls.push(new Ball(ballColours.brown, { x: width / 2 - ballDiameter * 10, y: height / 2 }));
        balls.push(new Ball(ballColours.blue, { x: width / 2, y: height / 2 }));
        balls.push(new Ball(ballColours.pink, { x: width / 2 + ballDiameter * 9 - ballDiameter, y: height / 2 }));
        balls.push(new Ball(ballColours.black, { x: width / 2 + ballDiameter * 15, y: height / 2 }));    
    };
};

// CueBall class extends the Ball class for the cue ball
class CueBall extends Ball {
    constructor(position, hasPhysics = true) {
        super(ballColours.white, position, hasPhysics); // Calling the constructor of the Ball class with the colour set to white
    };

    // Constrains the position of the cue ball within the table boundaries
    constrainPosition() {
        if (this.body) {
            // Constrain the position only if the ball has a physics body
            this.position.x = constrain(this.position.x, (width - tableWidth) / 2 + this.radius, (width + tableWidth) / 2 - this.radius);
            this.position.y = constrain(this.position.y, (height - tableHeight) / 2 + this.radius, (height + tableHeight) / 2 - this.radius);
        };
    };

    // Method to enable physics for the cue ball
    enablePhysics() {
        this.body = this.createPhysicalBall(); // Create a physics body for the cue ball
        World.add(engine.world, this.body); // Add the body to the Matter.js world
    };
};