// 粒子系统
class Particle {
    constructor(x, y, velocityX, velocityY, color, size, life) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.alpha = 1;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.3; // 重力
        this.life--;
        this.alpha = this.life / this.maxLife;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(2, 8);
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed - 2;
            const size = Utils.random(3, 8);
            const life = Utils.randomInt(20, 40);

            this.particles.push(new Particle(x, y, velocityX, velocityY, color, size, life));
        }
    }

    // 血液效果
    emitBlood(x, y) {
        this.emit(x, y, 10, '#ff0000');
    }

    // 火花效果（枪口火光）
    emitSpark(x, y) {
        this.emit(x, y, 3, '#ffff00'); // 减少粒子数量，避免误认为爆炸
    }

    // 爆炸效果
    emitExplosion(x, y) {
        this.emit(x, y, 30, '#ff6600');
        this.emit(x, y, 20, '#ffff00');
    }

    // 回血效果
    emitHeal(x, y) {
        this.emit(x, y, 15, '#00ff00'); // 绿色治疗粒子
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}
