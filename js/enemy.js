// 敌人基类
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;

        // 物理属性
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.facingRight = true;

        // AI状态
        this.aiState = 'idle';
        this.aiTimer = 0;
        this.target = null;
    }

    update(players, particles) {
        if (!this.active) return;

        // AI逻辑
        this.updateAI(players, particles);

        // 物理更新
        Physics.applyGravity(this);
        Physics.applyFriction(this);
        Physics.updatePosition(this);
        Physics.checkGroundCollision(this);
        Physics.checkBoundaries(this);

        this.aiTimer++;
    }

    updateAI(players, particles) {
        // 在子类中实现
    }

    findNearestTarget(players) {
        let nearest = null;
        let minDist = Infinity;

        players.forEach(player => {
            if (player.health > 0) {
                const dist = Utils.distance(
                    this.x, this.y,
                    player.x, player.y
                );
                if (dist < minDist) {
                    minDist = dist;
                    nearest = player;
                }
            }
        });

        return nearest;
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }

    draw(ctx) {
        // 在子类中实现
    }
}

// 敌对火柴人
class EnemyStickman extends Enemy {
    constructor(x, y) {
        super(x, y, 'stickman');
        this.width = 20;
        this.height = 60;
        this.color = '#ff0000';
        this.maxHealth = 50;
        this.health = 50;
        this.weapon = createWeapon('knife');
        this.moveSpeed = 3;
    }

    updateAI(players, particles) {
        this.target = this.findNearestTarget(players);
        if (!this.target) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 更新面向
        this.facingRight = dx > 0;

        // 更新武器
        this.weapon.update();

        if (distance > 60) {
            // 追逐玩家
            this.velocityX = (dx > 0 ? 1 : -1) * this.moveSpeed;

            // 跳跃障碍
            if (this.onGround && Math.random() < 0.02) {
                this.velocityY = CONSTANTS.JUMP_FORCE;
            }
        } else {
            // 攻击范围内
            this.velocityX = 0;

            if (this.weapon.canAttack()) {
                this.weapon.attack(this, [this.target], particles);
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        const centerX = this.x + this.width / 2;
        const headY = this.y + 10;
        const bodyStartY = this.y + 20;
        const bodyEndY = this.y + 40;
        const legEndY = this.y + this.height;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // 头部
        ctx.beginPath();
        ctx.arc(centerX, headY, 8, 0, Math.PI * 2);
        ctx.stroke();

        // 身体
        ctx.beginPath();
        ctx.moveTo(centerX, bodyStartY);
        ctx.lineTo(centerX, bodyEndY);
        ctx.stroke();

        // 手臂
        const armLength = 15;
        const armY = bodyStartY + 10;
        ctx.beginPath();
        ctx.moveTo(centerX, armY);
        ctx.lineTo(centerX + armLength, armY + 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, armY);
        ctx.lineTo(centerX - armLength, armY + 10);
        ctx.stroke();

        // 腿部
        ctx.beginPath();
        ctx.moveTo(centerX, bodyEndY);
        ctx.lineTo(centerX - 8, legEndY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, bodyEndY);
        ctx.lineTo(centerX + 8, legEndY);
        ctx.stroke();

        // 血条
        this.drawHealthBar(ctx);

        ctx.restore();
    }

    drawHealthBar(ctx) {
        const barWidth = 40;
        const barHeight = 4;
        const barX = this.x + this.width / 2 - barWidth / 2;
        const barY = this.y - 10;

        ctx.fillStyle = '#000';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#ff0000';
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
    }
}

// 怪兽
class Monster extends Enemy {
    constructor(x, y) {
        super(x, y, 'monster');
        this.width = 50;
        this.height = 50;
        this.color = '#8b4513';
        this.maxHealth = 100;
        this.health = 100;
        this.damage = 20;
        this.moveSpeed = 2;
        this.attackCooldown = 0;
    }

    updateAI(players, particles) {
        this.target = this.findNearestTarget(players);
        if (!this.target) return;

        const dx = this.target.x - this.x;
        const distance = Utils.distance(this.x, this.y, this.target.x, this.target.y);

        this.facingRight = dx > 0;

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        if (distance > 70) {
            // 追逐
            this.velocityX = (dx > 0 ? 1 : -1) * this.moveSpeed;
        } else {
            // 攻击
            this.velocityX = 0;
            if (this.attackCooldown === 0) {
                if (Physics.checkCollision(this, this.target)) {
                    this.target.takeDamage(this.damage);
                    particles.emitBlood(this.target.x + this.target.width / 2, this.target.y + this.target.height / 2);
                    this.attackCooldown = 60;
                }
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // 身体
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 眼睛
        ctx.fillStyle = '#ff0000';
        const eyeY = this.y + 15;
        ctx.fillRect(this.x + 10, eyeY, 8, 8);
        ctx.fillRect(this.x + 32, eyeY, 8, 8);

        // 嘴巴
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + 35);
        ctx.lineTo(this.x + 40, this.y + 35);
        ctx.stroke();

        // 血条
        this.drawHealthBar(ctx);

        ctx.restore();
    }

    drawHealthBar(ctx) {
        const barWidth = 50;
        const barHeight = 5;
        const barX = this.x;
        const barY = this.y - 10;

        ctx.fillStyle = '#000';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
    }
}

// 敌对坦克
class EnemyTank extends Enemy {
    constructor(x, y) {
        super(x, y, 'tank');
        this.width = 80;
        this.height = 50;
        this.color = '#4a4a4a';
        this.maxHealth = 200;
        this.health = 200;
        this.turretAngle = 0;
        this.shootCooldown = 0;
        this.moveSpeed = 1.5;
    }

    updateAI(players, particles) {
        this.target = this.findNearestTarget(players);
        if (!this.target) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Utils.distance(this.x + this.width / 2, this.y + this.height / 2,
                                       this.target.x + this.target.width / 2, this.target.y + this.target.height / 2);

        // 更新炮塔角度
        this.turretAngle = Utils.angle(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.target.x + this.target.width / 2,
            this.target.y + this.target.height / 2
        );

        this.facingRight = dx > 0;

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        if (distance > 300) {
            // 靠近目标
            this.velocityX = (dx > 0 ? 1 : -1) * this.moveSpeed;
        } else {
            // 停止并射击
            this.velocityX = 0;

            if (this.shootCooldown === 0 && distance < 500) {
                this.shoot(particles);
                this.shootCooldown = 90;
            }
        }
    }

    shoot(particles) {
        const bulletX = this.x + this.width / 2 + Math.cos(this.turretAngle) * 30;
        const bulletY = this.y + this.height / 2 + Math.sin(this.turretAngle) * 30;

        particles.emitSpark(bulletX, bulletY);

        return {
            type: 'tank_bullet',
            x: bulletX,
            y: bulletY,
            angle: this.turretAngle,
            speed: 10,
            damage: 40,
            owner: this
        };
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // 履带
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(this.x, this.y + 35, this.width, 15);

        // 主体
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 10, this.y + 15, this.width - 20, 30);

        // 炮塔
        ctx.fillStyle = '#3a3a3a';
        const turretX = this.x + this.width / 2;
        const turretY = this.y + this.height / 2;
        ctx.beginPath();
        ctx.arc(turretX, turretY, 15, 0, Math.PI * 2);
        ctx.fill();

        // 炮管
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(turretX, turretY);
        ctx.lineTo(
            turretX + Math.cos(this.turretAngle) * 30,
            turretY + Math.sin(this.turretAngle) * 30
        );
        ctx.stroke();

        // 血条
        this.drawHealthBar(ctx);

        ctx.restore();
    }

    drawHealthBar(ctx) {
        const barWidth = 80;
        const barHeight = 5;
        const barX = this.x;
        const barY = this.y - 10;

        ctx.fillStyle = '#000';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
    }
}
