// 载具系统 - 坦克
class Tank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 50;
        this.color = '#4a7c59';

        // 物理属性
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.facingRight = true;

        // 战斗属性
        this.maxHealth = 300;
        this.health = 300;
        this.turretAngle = 0;
        this.shootCooldown = 0;
        this.driver = null;

        // 移动属性
        this.moveSpeed = 3;
        this.turretRotateSpeed = 0.05;
    }

    update(input, targets, particles) {
        if (!this.driver) return;

        // 移动
        if (input.left) {
            this.velocityX = -this.moveSpeed;
            this.facingRight = false;
            this.turretAngle = Math.PI; // 向左
        } else if (input.right) {
            this.velocityX = this.moveSpeed;
            this.facingRight = true;
            this.turretAngle = 0; // 向右
        }

        // 炮塔旋转
        if (input.up) {
            this.turretAngle -= this.turretRotateSpeed;
        } else if (input.down) {
            this.turretAngle += this.turretRotateSpeed;
        }

        // 射击
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        if (input.attack && this.shootCooldown === 0) {
            const bullet = this.shoot(particles);
            this.shootCooldown = 60;
            return bullet;
        }

        // 物理更新
        Physics.applyGravity(this);
        Physics.applyFriction(this);
        Physics.updatePosition(this);
        Physics.checkGroundCollision(this);
        Physics.checkBoundaries(this);

        return null;
    }

    shoot(particles) {
        const bulletX = this.x + this.width / 2 + Math.cos(this.turretAngle) * 35;
        const bulletY = this.y + this.height / 2 + Math.sin(this.turretAngle) * 35;

        particles.emitSpark(bulletX, bulletY);
        particles.emitExplosion(bulletX, bulletY);

        return {
            type: 'tank_shell',
            x: bulletX,
            y: bulletY,
            velocityX: Math.cos(this.turretAngle) * 12,
            velocityY: Math.sin(this.turretAngle) * 12,
            damage: 50,
            radius: 8,
            owner: this,
            active: true
        };
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }

    draw(ctx) {
        ctx.save();

        // 履带
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(this.x, this.y + 35, this.width, 15);

        // 履带细节
        ctx.fillStyle = '#1a1a1a';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(this.x + i * 16, this.y + 35, 12, 15);
        }

        // 主体
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 10, this.y + 15, this.width - 20, 30);

        // 主体边框
        ctx.strokeStyle = '#3a5a45';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 10, this.y + 15, this.width - 20, 30);

        // 炮塔
        const turretX = this.x + this.width / 2;
        const turretY = this.y + this.height / 2;

        ctx.fillStyle = '#3a5a45';
        ctx.beginPath();
        ctx.arc(turretX, turretY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 炮管
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(turretX, turretY);
        ctx.lineTo(
            turretX + Math.cos(this.turretAngle) * 35,
            turretY + Math.sin(this.turretAngle) * 35
        );
        ctx.stroke();

        // 炮口
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(
            turretX + Math.cos(this.turretAngle) * 35,
            turretY + Math.sin(this.turretAngle) * 35,
            3,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // 血条
        this.drawHealthBar(ctx);

        ctx.restore();
    }

    drawHealthBar(ctx) {
        const barWidth = 80;
        const barHeight = 5;
        const barX = this.x;
        const barY = this.y - 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        ctx.fillRect(barX, barY, healthWidth, barHeight);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

// 坦克炮弹
class TankShell {
    constructor(data) {
        this.x = data.x;
        this.y = data.y;
        this.velocityX = data.velocityX;
        this.velocityY = data.velocityY;
        this.damage = data.damage;
        this.radius = data.radius;
        this.owner = data.owner;
        this.active = true;
        this.explosionRadius = 60;
    }

    update() {
        if (!this.active) return;

        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.3; // 重力

        // 边界检查
        if (this.x < 0 || this.x > CONSTANTS.CANVAS_WIDTH ||
            this.y > CONSTANTS.GROUND_HEIGHT) {
            this.active = false;
        }
    }

    checkHit(targets, particles) {
        if (!this.active) return [];

        const hits = [];

        targets.forEach(target => {
            if (target === this.owner || target === this.owner.driver) return;

            const distance = Utils.distance(
                this.x, this.y,
                target.x + target.width / 2,
                target.y + target.height / 2
            );

            if (distance < this.explosionRadius) {
                const damageMult = 1 - (distance / this.explosionRadius);
                target.takeDamage(Math.floor(this.damage * damageMult));
                hits.push(target);
            }
        });

        if (hits.length > 0 || this.y >= CONSTANTS.GROUND_HEIGHT - 10) {
            particles.emitExplosion(this.x, this.y);
            this.active = false;
        }

        return hits;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}
