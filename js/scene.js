// 场景管理
class Scene {
    constructor(type) {
        this.type = type;
        this.platforms = [];
        this.decorations = [];
        this.setupScene();
    }

    setupScene() {
        switch (this.type) {
            case 'grassland':
                this.setupGrassland();
                break;
            case 'desert':
                this.setupDesert();
                break;
            case 'swamp':
                this.setupSwamp();
                break;
            default:
                this.setupGrassland();
        }
    }

    setupGrassland() {
        this.backgroundColor = '#87CEEB'; // 天蓝色
        this.groundColor = '#7CFC00'; // 草绿色
        this.platformColor = '#8B4513'; // 棕色

        // 添加平台
        this.platforms = [
            {x: 200, y: 450, width: 150, height: 20},
            {x: 500, y: 380, width: 120, height: 20},
            {x: 800, y: 450, width: 150, height: 20},
            {x: 350, y: 300, width: 100, height: 20}
        ];

        // 装饰物
        this.decorations = [
            {type: 'tree', x: 100, y: CONSTANTS.GROUND_HEIGHT - 80},
            {type: 'tree', x: 600, y: CONSTANTS.GROUND_HEIGHT - 80},
            {type: 'tree', x: 1000, y: CONSTANTS.GROUND_HEIGHT - 80},
            {type: 'cloud', x: 200, y: 80},
            {type: 'cloud', x: 600, y: 100},
            {type: 'cloud', x: 900, y: 60}
        ];
    }

    setupDesert() {
        this.backgroundColor = '#FFD700'; // 金黄色天空
        this.groundColor = '#F4A460'; // 沙色
        this.platformColor = '#D2691E'; // 暗沙色

        // 添加平台（沙丘）
        this.platforms = [
            {x: 150, y: 470, width: 200, height: 15},
            {x: 450, y: 420, width: 180, height: 15},
            {x: 750, y: 470, width: 200, height: 15},
            {x: 300, y: 350, width: 120, height: 15}
        ];

        // 装饰物
        this.decorations = [
            {type: 'cactus', x: 80, y: CONSTANTS.GROUND_HEIGHT - 40},
            {type: 'cactus', x: 400, y: CONSTANTS.GROUND_HEIGHT - 40},
            {type: 'cactus', x: 900, y: CONSTANTS.GROUND_HEIGHT - 40},
            {type: 'sun', x: 1050, y: 100},
            {type: 'skull', x: 250, y: CONSTANTS.GROUND_HEIGHT - 20}
        ];
    }

    setupSwamp() {
        this.backgroundColor = '#708090'; // 灰色天空
        this.groundColor = '#556B2F'; // 深绿色
        this.platformColor = '#2F4F2F'; // 暗绿色

        // 添加平台（木板）
        this.platforms = [
            {x: 180, y: 460, width: 130, height: 18},
            {x: 400, y: 400, width: 140, height: 18},
            {x: 700, y: 460, width: 130, height: 18},
            {x: 550, y: 330, width: 100, height: 18}
        ];

        // 装饰物
        this.decorations = [
            {type: 'deadtree', x: 120, y: CONSTANTS.GROUND_HEIGHT - 60},
            {type: 'deadtree', x: 650, y: CONSTANTS.GROUND_HEIGHT - 60},
            {type: 'deadtree', x: 950, y: CONSTANTS.GROUND_HEIGHT - 60},
            {type: 'fog', x: 300, y: CONSTANTS.GROUND_HEIGHT - 50},
            {type: 'fog', x: 800, y: CONSTANTS.GROUND_HEIGHT - 50}
        ];
    }

    draw(ctx) {
        // 绘制背景
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);

        // 绘制装饰物
        this.decorations.forEach(deco => this.drawDecoration(ctx, deco));

        // 绘制地面
        ctx.fillStyle = this.groundColor;
        ctx.fillRect(0, CONSTANTS.GROUND_HEIGHT, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT - CONSTANTS.GROUND_HEIGHT);

        // 绘制地面细节
        this.drawGroundDetails(ctx);

        // 绘制平台
        ctx.fillStyle = this.platformColor;
        this.platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            // 平台边框
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

    drawGroundDetails(ctx) {
        if (this.type === 'grassland') {
            // 草地细节
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 2;
            for (let i = 0; i < CONSTANTS.CANVAS_WIDTH; i += 20) {
                const x = i + Utils.random(-5, 5);
                const y = CONSTANTS.GROUND_HEIGHT;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - 3, y - 8);
                ctx.moveTo(x, y);
                ctx.lineTo(x + 3, y - 8);
                ctx.stroke();
            }
        }
    }

    drawDecoration(ctx, deco) {
        ctx.save();

        switch (deco.type) {
            case 'tree':
                this.drawTree(ctx, deco.x, deco.y);
                break;
            case 'cloud':
                this.drawCloud(ctx, deco.x, deco.y);
                break;
            case 'cactus':
                this.drawCactus(ctx, deco.x, deco.y);
                break;
            case 'sun':
                this.drawSun(ctx, deco.x, deco.y);
                break;
            case 'skull':
                this.drawSkull(ctx, deco.x, deco.y);
                break;
            case 'deadtree':
                this.drawDeadTree(ctx, deco.x, deco.y);
                break;
            case 'fog':
                this.drawFog(ctx, deco.x, deco.y);
                break;
        }

        ctx.restore();
    }

    drawTree(ctx, x, y) {
        // 树干
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, 20, 80);

        // 树冠
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x + 10, y - 10, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - 10, y + 10, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 30, y + 10, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCloud(ctx, x, y) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCactus(ctx, x, y) {
        ctx.fillStyle = '#32CD32';

        // 主干
        ctx.fillRect(x, y, 15, 40);

        // 左臂
        ctx.fillRect(x - 10, y + 10, 10, 20);

        // 右臂
        ctx.fillRect(x + 15, y + 15, 10, 15);
    }

    drawSun(ctx, x, y) {
        // 太阳
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fill();

        // 光芒
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * 45, y + Math.sin(angle) * 45);
            ctx.lineTo(x + Math.cos(angle) * 60, y + Math.sin(angle) * 60);
            ctx.stroke();
        }
    }

    drawSkull(ctx, x, y) {
        ctx.fillStyle = '#F5F5DC';

        // 头骨
        ctx.beginPath();
        ctx.arc(x, y - 5, 10, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 5, y - 8, 3, 3);
        ctx.fillRect(x + 2, y - 8, 3, 3);
    }

    drawDeadTree(ctx, x, y) {
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 5;

        // 主干
        ctx.beginPath();
        ctx.moveTo(x, y + 60);
        ctx.lineTo(x, y);
        ctx.stroke();

        // 枯枝
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + 20);
        ctx.lineTo(x - 15, y + 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y + 30);
        ctx.lineTo(x + 20, y + 15);
        ctx.stroke();
    }

    drawFog(ctx, x, y) {
        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y, 80, 30, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    checkPlatformCollisions(entity) {
        this.platforms.forEach(platform => {
            Physics.checkPlatformCollision(entity, platform);
        });
    }
}
