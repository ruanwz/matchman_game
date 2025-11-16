// 火柴人玩家类
class Player {
    constructor(x, y, color, playerNumber) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 60;
        this.color = color;
        this.playerNumber = playerNumber;

        // 物理属性
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.facingRight = true;
        this.jumpCount = 0;
        this.maxJumps = 2;

        // 战斗属性
        this.maxHealth = 100;
        this.health = 100;
        this.weapons = [
            createWeapon('knife'),
            createWeapon('sword'),
            createWeapon('pistol'),
            createWeapon('gatling')
        ];
        this.currentWeaponIndex = 2; // 初始武器改为手枪
        this.invulnerable = false;
        this.invulnerableTime = 0;

        // 自动回血
        this.healTimer = 0;
        this.healInterval = 600; // 10秒 = 600帧 (60fps)
        this.healAmount = 50; // 每次回复50点生命值（一半血量）

        // 载具
        this.vehicle = null;
        this.inVehicle = false;

        // 动画
        this.attacking = false;
        this.attackFrame = 0;

        // 输入缓冲
        this.lastAttack = false;
        this.lastSwitch = false;
        this.lastInteract = false;
        this.lastJump = false;
    }

    get currentWeapon() {
        return this.weapons[this.currentWeaponIndex];
    }

    update(input, targets, particles, vehicles) {
        // 更新武器冷却
        this.weapons.forEach(weapon => weapon.update());

        // 无敌时间
        if (this.invulnerableTime > 0) {
            this.invulnerableTime--;
            if (this.invulnerableTime === 0) {
                this.invulnerable = false;
            }
        }

        // 自动回血系统
        if (this.health > 0 && this.health < this.maxHealth) {
            this.healTimer++;
            if (this.healTimer >= this.healInterval) {
                this.heal(this.healAmount);
                this.healTimer = 0;
                // 回血特效
                particles.emitHeal(this.x + this.width / 2, this.y + this.height / 2);
                console.log('自动回血！当前生命值:', this.health);
            }
        } else if (this.health >= this.maxHealth) {
            this.healTimer = 0; // 满血时重置计时器
        }

        if (this.inVehicle && this.vehicle) {
            this.updateInVehicle(input, targets, particles);
        } else {
            this.updateOnFoot(input, targets, particles, vehicles);
        }

        // 更新攻击动画
        if (this.attacking) {
            this.attackFrame++;
            if (this.attackFrame > 10) {
                this.attacking = false;
                this.attackFrame = 0;
            }
        }
    }

    updateOnFoot(input, targets, particles, vehicles) {
        // 移动
        if (input.left) {
            this.velocityX = -CONSTANTS.MOVE_SPEED;
            this.facingRight = false;
        } else if (input.right) {
            this.velocityX = CONSTANTS.MOVE_SPEED;
            this.facingRight = true;
        }

        // 跳跃
        if (input.up && !this.lastJump && this.jumpCount < this.maxJumps) {
            this.velocityY = CONSTANTS.JUMP_FORCE;
            this.onGround = false;
            this.jumpCount++;
        }
        this.lastJump = input.up;

        // 攻击
        let bulletToReturn = null;
        if (input.attack && !this.lastAttack) {
            const result = this.currentWeapon.attack(this, targets, particles);
            if (result) {
                this.attacking = true;
                this.attackFrame = 0;

                if (result instanceof Bullet) {
                    // 子弹会在game中处理
                    bulletToReturn = result;
                }
            }
        }
        this.lastAttack = input.attack;

        if (bulletToReturn) {
            return bulletToReturn;
        }

        // 切换武器
        if (input.switchWeapon && !this.lastSwitch) {
            this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
        }
        this.lastSwitch = input.switchWeapon;

        // 上车/下车
        if (input.interact && !this.lastInteract) {
            this.tryEnterVehicle(vehicles);
        }
        this.lastInteract = input.interact;

        // 物理更新
        Physics.applyGravity(this);
        Physics.applyFriction(this);
        Physics.updatePosition(this);
        Physics.checkGroundCollision(this);
        Physics.checkBoundaries(this);
    }

    updateInVehicle(input, targets, particles) {
        // 在载具中的更新
        if (this.vehicle) {
            // 更新攻击按键状态
            this.lastAttack = input.attack;

            const shell = this.vehicle.update(input, targets, particles);
            this.x = this.vehicle.x;
            this.y = this.vehicle.y - this.height;

            // 下车
            if (input.interact && !this.lastInteract) {
                this.exitVehicle();
            }
            this.lastInteract = input.interact;

            // 返回坦克炮弹
            if (shell) {
                return shell;
            }
        }
    }

    tryEnterVehicle(vehicles) {
        for (let vehicle of vehicles) {
            const distance = Utils.distance(
                this.x + this.width / 2,
                this.y + this.height / 2,
                vehicle.x + vehicle.width / 2,
                vehicle.y + vehicle.height / 2
            );

            if (distance < 100 && !vehicle.driver) {
                this.enterVehicle(vehicle);
                return;
            }
        }
    }

    enterVehicle(vehicle) {
        this.inVehicle = true;
        this.vehicle = vehicle;
        vehicle.driver = this;
    }

    exitVehicle() {
        if (this.vehicle) {
            this.inVehicle = false;
            this.x = this.vehicle.x + this.vehicle.width + 10;
            this.vehicle.driver = null;
            this.vehicle = null;
        }
    }

    takeDamage(damage) {
        if (this.invulnerable) return;

        this.health -= damage;
        this.health = Math.max(0, this.health);

        // 短暂无敌
        this.invulnerable = true;
        this.invulnerableTime = 30;

        return this.health <= 0;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    draw(ctx) {
        if (this.inVehicle) return; // 在载具中不绘制

        ctx.save();

        // 无敌闪烁效果
        if (this.invulnerable && Math.floor(this.invulnerableTime / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // 绘制火柴人
        this.drawStickman(ctx);

        // 绘制武器
        if (this.attacking) {
            this.drawWeapon(ctx);
        }

        ctx.restore();
    }

    drawStickman(ctx) {
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
        const armAngle = this.attacking ? Math.PI / 3 : Math.PI / 4;
        const armLength = 15;
        const armY = bodyStartY + 10;
        const armDirection = this.facingRight ? 1 : -1;

        ctx.beginPath();
        ctx.moveTo(centerX, armY);
        ctx.lineTo(
            centerX + Math.cos(armAngle) * armLength * armDirection,
            armY + Math.sin(armAngle) * armLength
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, armY);
        ctx.lineTo(
            centerX - Math.cos(armAngle) * armLength * armDirection,
            armY + Math.sin(armAngle) * armLength
        );
        ctx.stroke();

        // 腿部
        const legSpread = 8;
        ctx.beginPath();
        ctx.moveTo(centerX, bodyEndY);
        ctx.lineTo(centerX - legSpread, legEndY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, bodyEndY);
        ctx.lineTo(centerX + legSpread, legEndY);
        ctx.stroke();
    }

    drawWeapon(ctx) {
        const centerX = this.x + this.width / 2;
        const armY = this.y + 30;
        const direction = this.facingRight ? 1 : -1;

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;

        if (this.currentWeapon.type === 'melee') {
            // 绘制近战武器
            const weaponLength = this.currentWeapon.name === '长剑' ? 30 : 20;
            ctx.beginPath();
            ctx.moveTo(centerX + 10 * direction, armY);
            ctx.lineTo(centerX + (10 + weaponLength) * direction, armY);
            ctx.stroke();
        } else {
            // 绘制远程武器
            ctx.fillStyle = '#333';
            ctx.fillRect(
                centerX + 10 * direction,
                armY - 3,
                15 * direction,
                6
            );
        }
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = this.maxHealth;
        this.currentWeaponIndex = 2; // 重置时也使用手枪
        this.weapons.forEach(weapon => weapon.reload());
        this.healTimer = 0; // 重置回血计时器
        this.inVehicle = false;
        if (this.vehicle) {
            this.vehicle.driver = null;
            this.vehicle = null;
        }
    }
}
