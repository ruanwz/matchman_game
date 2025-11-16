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
        if (!this.canAttack()) return null;

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
        const bulletX = owner.facingRight ? owner.x + owner.width : owner.x;
        const bulletY = owner.y + owner.height / 2;
        const direction = owner.facingRight ? 1 : -1;

        particles.emitSpark(bulletX, bulletY);

        return new Bullet(
            bulletX,
            bulletY,
            direction,
            this.damage,
            this.range,
            owner
        );
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
        this.speed = 15;
        this.damage = damage;
        this.maxDistance = maxDistance;
        this.traveledDistance = 0;
        this.active = true;
        this.owner = owner;
        this.width = 8;
        this.height = 4;
    }

    update() {
        const movement = this.speed * this.direction;
        this.x += movement;
        this.traveledDistance += Math.abs(movement);

        if (this.traveledDistance >= this.maxDistance ||
            this.x < 0 ||
            this.x > CONSTANTS.CANVAS_WIDTH) {
            this.active = false;
        }
    }

    checkHit(targets, particles) {
        if (!this.active) return;

        targets.forEach(target => {
            if (target === this.owner) return;

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

        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
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
