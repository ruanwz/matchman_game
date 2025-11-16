// 武器系统
class Weapon {
    constructor(name, type, damage, range, cooldown, ammo = -1) {
        this.name = name;
        this.type = type; // 'melee' 或 'ranged'
        this.damage = damage;
        this.range = range;
        this.cooldown = cooldown;
        this.currentCooldown = 0;
        this.maxAmmo = ammo;
        this.ammo = ammo;
    }

    canAttack() {
        return this.currentCooldown <= 0 && (this.ammo > 0 || this.ammo === -1);
    }

    attack(owner, targets, particles) {
        if (!this.canAttack()) {
            console.log('无法攻击 - 冷却:', this.currentCooldown, '弹药:', this.ammo);
            return null;
        }

        console.log('攻击！武器:', this.name, '类型:', this.type);
        this.currentCooldown = this.cooldown;

        if (this.ammo > 0) {
            this.ammo--;
        }

        if (this.type === 'melee') {
            return this.meleeAttack(owner, targets, particles);
        } else {
            return this.rangedAttack(owner, particles);
        }
    }

    meleeAttack(owner, targets, particles) {
        const hits = [];
        targets.forEach(target => {
            const distance = Utils.distance(
                owner.x + owner.width / 2,
                owner.y + owner.height / 2,
                target.x + target.width / 2,
                target.y + target.height / 2
            );

            if (distance < this.range) {
                // 检查方向
                const dx = (target.x + target.width / 2) - (owner.x + owner.width / 2);
                if ((owner.facingRight && dx > 0) || (!owner.facingRight && dx < 0)) {
                    target.takeDamage(this.damage);
                    particles.emitBlood(target.x + target.width / 2, target.y + target.height / 2);
                    hits.push(target);
                }
            }
        });
        return hits;
    }

    rangedAttack(owner, particles) {
        // 让子弹从火柴人中心位置开始，这样不会超出边界
        const bulletX = owner.x + owner.width / 2;
        const bulletY = owner.y + owner.height / 2;
        const direction = owner.facingRight ? 1 : -1;

        particles.emitSpark(bulletX, bulletY);

        const bullet = new Bullet(
            bulletX,
            bulletY,
            direction,
            this.damage,
            this.range,
            owner
        );

        console.log('创建子弹:', {
            x: bullet.x,
            y: bullet.y,
            direction: bullet.direction,
            speed: bullet.speed,
            active: bullet.active,
            maxDistance: bullet.maxDistance,
            ownerX: owner.x,
            facingRight: owner.facingRight
        });

        return bullet;
    }

    update() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }

    reload() {
        this.ammo = this.maxAmmo;
    }
}

// 子弹类
class Bullet {
    constructor(x, y, direction, damage, maxDistance, owner) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = 8; // 降低速度，更容易看到
        this.damage = damage;
        this.maxDistance = maxDistance;
        this.traveledDistance = 0;
        this.active = true;
        this.owner = owner;
        this.width = 15; // 增大尺寸
        this.height = 8;
    }

    update() {
        const movement = this.speed * this.direction;
        this.x += movement;
        this.traveledDistance += Math.abs(movement);

        // 只有飞行超过100像素后才检查边界，避免刚创建就被销毁
        if (this.traveledDistance >= this.maxDistance) {
            console.log('子弹超出最大距离，设为inactive');
            this.active = false;
        } else if (this.traveledDistance > 100 && (this.x < -50 || this.x > CONSTANTS.CANVAS_WIDTH + 50)) {
            console.log('子弹超出边界，设为inactive', 'x=', this.x, 'traveled=', this.traveledDistance);
            this.active = false;
        }
    }

    checkHit(targets, particles) {
        if (!this.active) return;

        targets.forEach(target => {
            // 不要击中发射者或发射者的载具
            if (target === this.owner || target === this.owner.vehicle) return;

            if (Utils.rectCollision(
                {x: this.x, y: this.y, width: this.width, height: this.height},
                {x: target.x, y: target.y, width: target.width, height: target.height}
            )) {
                target.takeDamage(this.damage);
                particles.emitBlood(this.x, this.y);
                this.active = false;
            }
        });
    }

    draw(ctx) {
        if (!this.active) return;

        // 绘制超明显的子弹
        ctx.save();

        // 发光效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';

        // 黄色填充
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

        // 红色边框
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

        ctx.restore();
    }
}

// 预定义武器
const WEAPONS = {
    knife: new Weapon('小刀', 'melee', 15, 50, 10),
    sword: new Weapon('长剑', 'melee', 30, 70, 20),
    pistol: new Weapon('手枪', 'ranged', 25, 400, 30, 15),
    gatling: new Weapon('加特林', 'ranged', 10, 600, 5, 100)
};

// 创建武器副本
function createWeapon(type) {
    const template = WEAPONS[type];
    return new Weapon(
        template.name,
        template.type,
        template.damage,
        template.range,
        template.cooldown,
        template.maxAmmo
    );
}
