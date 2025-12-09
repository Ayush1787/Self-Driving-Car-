class Car {
    constructor(x, y, width, height, controlType = "KEYS", maxSpeed = 3) {
        this.x = x - width / 2;  // Center the car on x position
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 0;
        this.acceleration = 0.2;
        this.friction = 0.05;
        this.maxSpeed = maxSpeed;
        this.baseMaxSpeed = maxSpeed;  // Store base speed
        this.angle = 0;
        this.flip = 1;
        this.damaged = false;
        this.fitness = 0;  // Fitness score for training
        
        this.controlType = controlType;
        this.useBrain = controlType === "AI";
        
        if (controlType !== "DUMMY") {
            this.sensor = new Sensor(this);
            if (this.useBrain) {
                // Network receives: 12 sensor offsets (8 forward + 4 back) + 12 angles = 24 inputs
                const totalSensors = this.sensor.rayCount + this.sensor.backRayCount;
                this.brain = new Network(
                    [totalSensors * 2, 16, 4]  // 24 inputs, 16 hidden, 4 outputs
                );
                // Strong bias towards forward movement for better initial behavior
                if (this.brain.levels.length > 0) {
                    const outputLevel = this.brain.levels[this.brain.levels.length - 1];
                    outputLevel.biases[0] = -2.0;  // Very strong forward bias
                    outputLevel.biases[1] = 0.5;   // Left (moderate)
                    outputLevel.biases[2] = 0.5;   // Right (moderate)
                    outputLevel.biases[3] = 2.0;   // Reverse (very hard)
                }
            }
        }
        this.controls = new Controls(controlType);
    }

    update(roadBorders, traffic = []) {
        if (!this.damaged) {
            this.#moment();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, traffic);
        }
        if (this.sensor) {
            this.sensor.update(roadBorders, traffic);
            if (this.useBrain && !this.damaged) {
                // Prepare network inputs: sensor offsets + ray angles
                const offsets = this.sensor.readings.map(
                    s => s == null ? 0 : 1 - s.offset
                );
                const angles = this.sensor.rayAngles;  // Already normalized (-1 to 1)
                
                // Combine offsets and angles as network input
                const networkInputs = [...offsets, ...angles];
                const outputs = Network.feedForward(networkInputs, this.brain);
                
                // Dynamic speed based on situation
                const frontSensors = offsets.slice(0, this.sensor.rayCount);
                const hasObstacleAhead = frontSensors.some(s => s > 0.5);
                
                if (!hasObstacleAhead) {
                    this.maxSpeed = this.baseMaxSpeed * 2;  // Double speed when clear
                } else {
                    this.maxSpeed = this.baseMaxSpeed;  // Normal speed near obstacles
                }
                
                // Let neural network have full control
                this.controls.forward = outputs[0];
                this.controls.reverse = outputs[3];
                
                // Mutual exclusion for left/right - only allow one at a time
                if (outputs[1] > 0.5 && outputs[2] > 0.5) {
                    // Both want to activate, choose the stronger one
                    if (outputs[1] > outputs[2]) {
                        this.controls.left = 1;
                        this.controls.right = 0;
                    } else {
                        this.controls.left = 0;
                        this.controls.right = 1;
                    }
                } else {
                    this.controls.left = outputs[1];
                    this.controls.right = outputs[2];
                }
            }
        }
    }
    
    #createPolygon() {
        const points = [];
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        // Adjust for the car's center point (matching the draw translation)
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Top-left corner
        points.push({
            x: centerX + (-halfWidth * cos - (-halfHeight) * sin),
            y: centerY + (-halfWidth * sin + (-halfHeight) * cos)
        });
        // Top-right corner
        points.push({
            x: centerX + (halfWidth * cos - (-halfHeight) * sin),
            y: centerY + (halfWidth * sin + (-halfHeight) * cos)
        });
        // Bottom-right corner
        points.push({
            x: centerX + (halfWidth * cos - halfHeight * sin),
            y: centerY + (halfWidth * sin + halfHeight * cos)
        });
        // Bottom-left corner
        points.push({
            x: centerX + (-halfWidth * cos - halfHeight * sin),
            y: centerY + (-halfWidth * sin + halfHeight * cos)
        });

        return points;
    }

    #assessDamage(roadBorders, traffic = []) {
        // Check collision with road borders (convert line segments to thin polygons)
        for (let i = 0; i < roadBorders.length; i++) {
            if (polysIntersect(this.polygon, roadBorders[i])) {
                return true;
            }
        }
        
        // Check collision with traffic cars
        for (let i = 0; i < traffic.length; i++) {
            if (traffic[i].polygon && polysIntersect(this.polygon, traffic[i].polygon)) {
                return true;
            }
        }
        
        return false;
    }

    #moment() {
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.reverse) {
            this.speed -= this.acceleration;
        }

        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if (this.speed < -this.maxSpeed / 2) {
            this.speed = -this.maxSpeed / 2;
        }

        if (Math.abs(this.speed) > this.friction) {
            if (this.speed > 0) {
                this.speed -= this.friction;
            } else if (this.speed < 0) {
                this.speed += this.friction;
            }
        } else {
            this.speed = 0;
        }

        if (this.speed > 0) {
            this.flip = 1;
        } else if (this.speed < 0) {
            this.flip = -1;
        }

        if (Math.abs(this.speed) > 0.5) {
            if (this.controls.left) {
                this.angle -= 0.03 * this.flip;
            }
            if (this.controls.right) {
                this.angle += 0.03 * this.flip;
            }
        }

        this.x += Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }


    draw(ctx, color, drawSensor = false) {
        if (this.damaged) {
            ctx.fillStyle = "gray";
        } else {
            ctx.fillStyle = color;
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);

        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        if (!this.damaged) {
            ctx.fillStyle = "white";
            ctx.fillRect(-this.width / 2 + 3, -this.height / 2, this.width - 6, this.height * 0.3);

            ctx.fillStyle = "black";
            ctx.fillRect(-this.width / 2 - 2, -this.height / 2 + 5, 2, this.height * 0.25);
            
            ctx.fillRect(this.width / 2, -this.height / 2 + 5, 2, this.height * 0.25);

            ctx.fillRect(-this.width / 2 - 2, this.height / 2 - 5 - this.height * 0.25, 2, this.height * 0.25);
            
            ctx.fillRect(this.width / 2, this.height / 2 - 5 - this.height * 0.25, 2, this.height * 0.25);
        }

        ctx.restore();
        
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
    }
    
}