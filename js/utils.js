// 工具函数
const Utils = {
    // 随机数生成
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    // 随机整数
    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    // 距离计算
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // 角度计算
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    // 矩形碰撞检测
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    // 圆形碰撞检测
    circleCollision(c1, c2) {
        const dist = this.distance(c1.x, c1.y, c2.x, c2.y);
        return dist < c1.radius + c2.radius;
    },

    // 限制数值范围
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // 线性插值
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    // 从数组中随机选择
    randomChoice(array) {
        return array[this.randomInt(0, array.length - 1)];
    }
};

// 常量定义
const CONSTANTS = {
    GRAVITY: 0.8,
    FRICTION: 0.85,
    JUMP_FORCE: -15,
    MOVE_SPEED: 5,
    MAX_FALL_SPEED: 20,
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 600,
    GROUND_HEIGHT: 550
};
