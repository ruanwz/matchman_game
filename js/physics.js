// 物理系统
class Physics {
    static applyGravity(entity) {
        if (!entity.onGround) {
            entity.velocityY += CONSTANTS.GRAVITY;
            entity.velocityY = Math.min(entity.velocityY, CONSTANTS.MAX_FALL_SPEED);
        }
    }

    static applyFriction(entity) {
        if (entity.onGround) {
            entity.velocityX *= CONSTANTS.FRICTION;
        }
    }

    static updatePosition(entity) {
        entity.x += entity.velocityX;
        entity.y += entity.velocityY;
    }

    static checkGroundCollision(entity, groundHeight = CONSTANTS.GROUND_HEIGHT) {
        if (entity.y + entity.height >= groundHeight) {
            entity.y = groundHeight - entity.height;
            entity.velocityY = 0;
            entity.onGround = true;
            entity.jumpCount = 0;
        } else {
            entity.onGround = false;
        }
    }

    static checkBoundaries(entity, canvasWidth = CONSTANTS.CANVAS_WIDTH) {
        // 左右边界
        if (entity.x < 0) {
            entity.x = 0;
            entity.velocityX = 0;
        } else if (entity.x + entity.width > canvasWidth) {
            entity.x = canvasWidth - entity.width;
            entity.velocityX = 0;
        }

        // 防止掉出底部
        if (entity.y > CONSTANTS.CANVAS_HEIGHT + 100) {
            entity.takeDamage(entity.health); // 摔死
        }
    }

    static checkCollision(entity1, entity2) {
        return Utils.rectCollision(
            {x: entity1.x, y: entity1.y, width: entity1.width, height: entity1.height},
            {x: entity2.x, y: entity2.y, width: entity2.width, height: entity2.height}
        );
    }

    static resolveCollision(entity1, entity2) {
        const dx = (entity1.x + entity1.width / 2) - (entity2.x + entity2.width / 2);
        const dy = (entity1.y + entity1.height / 2) - (entity2.y + entity2.height / 2);

        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX > absY) {
            // 水平方向碰撞
            if (dx > 0) {
                entity1.x = entity2.x + entity2.width;
            } else {
                entity1.x = entity2.x - entity1.width;
            }
            entity1.velocityX = 0;
        } else {
            // 垂直方向碰撞
            if (dy > 0) {
                entity1.y = entity2.y + entity2.height;
                entity1.velocityY = 0;
            } else {
                entity1.y = entity2.y - entity1.height;
                entity1.velocityY = 0;
                entity1.onGround = true;
            }
        }
    }

    static checkPlatformCollision(entity, platform) {
        // 检查是否在平台上
        if (entity.velocityY >= 0 &&
            entity.x + entity.width > platform.x &&
            entity.x < platform.x + platform.width &&
            entity.y + entity.height >= platform.y &&
            entity.y + entity.height <= platform.y + 20) {
            entity.y = platform.y - entity.height;
            entity.velocityY = 0;
            entity.onGround = true;
            entity.jumpCount = 0;
            return true;
        }
        return false;
    }
}
