// 游戏主类
class Game {
    constructor(canvas, mode, sceneType) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mode = mode; // 'campaign', 'pvp', 'coop'
        this.sceneType = sceneType;

        // 调整canvas大小
        this.canvas.width = CONSTANTS.CANVAS_WIDTH;
        this.canvas.height = CONSTANTS.CANVAS_HEIGHT;

        // 游戏系统
        this.inputManager = new InputManager();
        this.particleSystem = new ParticleSystem();
        this.scene = new Scene(sceneType);

        // 游戏对象
        this.players = [];
        this.enemies = [];
        this.bullets = [];
        this.vehicles = [];
        this.tankShells = [];

        // 游戏状态
        this.running = false;
        this.paused = false;
        this.gameOver = false;
        this.score = 0;
        this.wave = 1;
        this.enemiesThisWave = 0;
        this.enemiesKilled = 0;
        this.waveDelay = 0;

        this.setupGame();
        this.setupEventListeners();
    }

    setupGame() {
        // 创建玩家
        if (this.mode === 'campaign' || this.mode === 'coop') {
            this.players.push(new Player(100, 400, '#FF6600', 1)); // 橙色玩家

            if (this.mode === 'coop') {
                this.players.push(new Player(200, 400, '#0066FF', 2)); // 蓝色玩家
            }
        } else if (this.mode === 'pvp') {
            this.players.push(new Player(100, 400, '#FF6600', 1));
            this.players.push(new Player(1000, 400, '#0066FF', 2));
        }

        // 创建载具
        if (this.mode !== 'pvp') {
            this.vehicles.push(new Tank(600, 400));
        }

        // 开始游戏
        if (this.mode === 'campaign' || this.mode === 'coop') {
            this.startWave();
        }
    }

    setupEventListeners() {
        // ESC键暂停
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.running && !this.gameOver) {
                this.togglePause();
            }
        });
    }

    startWave() {
        this.wave++;
        this.enemiesThisWave = 3 + this.wave * 2;
        this.enemiesKilled = 0;
        this.waveDelay = 120; // 2秒延迟

        this.updateWaveDisplay();
    }

    spawnEnemy() {
        const spawnX = Utils.randomChoice([0, CONSTANTS.CANVAS_WIDTH]);
        const spawnY = 300;

        const rand = Math.random();
        let enemy;

        if (this.wave < 3) {
            enemy = new EnemyStickman(spawnX, spawnY);
        } else if (rand < 0.5) {
            enemy = new EnemyStickman(spawnX, spawnY);
        } else if (rand < 0.8) {
            enemy = new Monster(spawnX, spawnY);
        } else {
            enemy = new EnemyTank(spawnX, spawnY);
        }

        this.enemies.push(enemy);
    }

    update() {
        if (!this.running || this.paused || this.gameOver) return;

        // 闯关模式波次管理
        if (this.mode === 'campaign' || this.mode === 'coop') {
            if (this.waveDelay > 0) {
                this.waveDelay--;
            } else if (this.enemies.length < 8 && this.enemiesKilled < this.enemiesThisWave) {
                if (Math.random() < 0.02) {
                    this.spawnEnemy();
                }
            }

            // 检查波次完成
            if (this.enemiesKilled >= this.enemiesThisWave && this.enemies.length === 0) {
                this.startWave();
            }
        }

        // 更新玩家
        const player1Input = this.inputManager.getPlayer1Input();
        const player2Input = this.mode === 'pvp' || this.mode === 'coop'
            ? this.inputManager.getPlayer2Input()
            : null;

        this.players.forEach((player, index) => {
            if (player.health <= 0) return;

            const input = index === 0 ? player1Input : player2Input;
            if (!input) return;

            // 根据模式确定目标
            let targets = [];
            if (this.mode === 'pvp') {
                targets = this.players.filter(p => p !== player && p.health > 0);
            } else {
                targets = this.enemies.filter(e => e.active);
            }

            const result = player.update(input, targets, this.particleSystem, this.vehicles);
            if (result instanceof Bullet) {
                this.bullets.push(result);
                console.log('子弹已发射！位置:', result.x, result.y, '方向:', result.direction);
            } else if (result && result.type === 'tank_shell') {
                // 玩家驾驶坦克开炮
                this.tankShells.push(new TankShell(result));
                console.log('坦克炮弹已发射！');
            }

            // 检查平台碰撞
            if (!player.inVehicle) {
                this.scene.checkPlatformCollisions(player);
            }
        });

        // 更新敌人
        this.enemies = this.enemies.filter(enemy => {
            if (!enemy.active) {
                this.enemiesKilled++;
                this.score += 100;
                this.updateScore();
                return false;
            }

            const activePlayers = this.players.filter(p => p.health > 0);
            enemy.update(activePlayers, this.particleSystem);

            // 敌方坦克射击
            if (enemy instanceof EnemyTank) {
                const shellData = enemy.shoot(this.particleSystem);
                if (shellData && shellData.type === 'tank_bullet') {
                    const shell = new TankShell(shellData);
                    this.tankShells.push(shell);
                }
            }

            this.scene.checkPlatformCollisions(enemy);
            return true;
        });

        // 更新子弹
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();

            if (!bullet.active) return false;

            // 检查击中
            let targets = [];
            if (this.mode === 'pvp') {
                targets = this.players.filter(p => p !== bullet.owner && p.health > 0);
            } else {
                targets = this.enemies.filter(e => e.active);
            }

            bullet.checkHit(targets, this.particleSystem);

            return bullet.active;
        });

        // 更新载具
        this.vehicles.forEach(vehicle => {
            if (!vehicle.driver) {
                // 无人驾驶时的物理更新
                Physics.applyGravity(vehicle);
                Physics.applyFriction(vehicle);
                Physics.updatePosition(vehicle);
                Physics.checkGroundCollision(vehicle);
                Physics.checkBoundaries(vehicle);
                this.scene.checkPlatformCollisions(vehicle);
            }
        });

        // 更新坦克炮弹
        this.tankShells = this.tankShells.filter(shell => {
            shell.update();
            if (!shell.active) return false;

            // 检查击中
            let targets = [];
            if (this.mode === 'pvp') {
                targets = this.players.filter(p => p.health > 0);
            } else {
                targets = [...this.players.filter(p => p.health > 0), ...this.enemies.filter(e => e.active)];
            }

            shell.checkHit(targets, this.particleSystem);

            return shell.active;
        });

        // 更新粒子系统
        this.particleSystem.update();

        // 检查游戏结束
        this.checkGameOver();

        // 更新HUD
        this.updateHUD();
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制场景
        this.scene.draw(this.ctx);

        // 绘制载具
        this.vehicles.forEach(vehicle => vehicle.draw(this.ctx));

        // 绘制玩家
        this.players.forEach(player => player.draw(this.ctx));

        // 绘制敌人
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // 绘制子弹
        if (this.bullets.length > 0) {
            console.log('准备绘制', this.bullets.length, '个子弹');
        }
        this.bullets.forEach((bullet, index) => {
            console.log(`绘制子弹${index}:`, bullet.x, bullet.y, 'active:', bullet.active);
            bullet.draw(this.ctx);
        });

        // 绘制坦克炮弹
        this.tankShells.forEach(shell => shell.draw(this.ctx));

        // 绘制粒子
        this.particleSystem.draw(this.ctx);

        // 调试信息面板
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(5, 5, 250, 80);

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('🔫 调试信息', 15, 25);

        this.ctx.font = '14px Arial';
        this.ctx.fillText(`子弹数: ${this.bullets.length}`, 15, 45);
        this.ctx.fillText(`敌人数: ${this.enemies.length}`, 15, 65);

        if (this.players[0]) {
            const weapon = this.players[0].currentWeapon;
            const ammoText = weapon.maxAmmo > 0 ? `${weapon.ammo}/${weapon.maxAmmo}` : '无限';
            this.ctx.fillText(`武器: ${weapon.name} (${ammoText})`, 15, 80);
        }

        this.ctx.restore();

        // 绘制波次延迟提示
        if (this.waveDelay > 0 && (this.mode === 'campaign' || this.mode === 'coop')) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(CONSTANTS.CANVAS_WIDTH / 2 - 150, CONSTANTS.CANVAS_HEIGHT / 2 - 50, 300, 100);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`第 ${this.wave} 波`, CONSTANTS.CANVAS_WIDTH / 2, CONSTANTS.CANVAS_HEIGHT / 2);

            this.ctx.font = '20px Arial';
            this.ctx.fillText(`准备中... ${Math.ceil(this.waveDelay / 60)}秒`, CONSTANTS.CANVAS_WIDTH / 2, CONSTANTS.CANVAS_HEIGHT / 2 + 30);
            this.ctx.restore();
        }
    }

    gameLoop() {
        this.update();
        this.draw();

        if (this.running) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    start() {
        this.running = true;
        this.gameLoop();
    }

    stop() {
        this.running = false;
    }

    togglePause() {
        this.paused = !this.paused;
        const pauseMenu = document.getElementById('pause-menu');
        pauseMenu.classList.toggle('hidden', !this.paused);
    }

    restart() {
        // 重置游戏状态
        this.score = 0;
        this.wave = 0;
        this.enemiesKilled = 0;
        this.gameOver = false;
        this.paused = false;

        // 清空对象
        this.enemies = [];
        this.bullets = [];
        this.tankShells = [];
        this.particleSystem.clear();

        // 重置玩家
        if (this.mode === 'campaign' || this.mode === 'coop') {
            this.players[0].reset(100, 400);
            if (this.mode === 'coop' && this.players[1]) {
                this.players[1].reset(200, 400);
            }
        } else if (this.mode === 'pvp') {
            this.players[0].reset(100, 400);
            this.players[1].reset(1000, 400);
        }

        // 重置载具
        this.vehicles.forEach(vehicle => {
            vehicle.health = vehicle.maxHealth;
            vehicle.x = 600;
            vehicle.y = 400;
            vehicle.driver = null;
        });

        // 重新开始
        if (this.mode === 'campaign' || this.mode === 'coop') {
            this.startWave();
        }

        document.getElementById('game-over').classList.add('hidden');
        this.updateHUD();
    }

    checkGameOver() {
        if (this.mode === 'pvp') {
            // PvP模式：一方死亡
            const alivePlayers = this.players.filter(p => p.health > 0);
            if (alivePlayers.length === 1) {
                this.endGame(`玩家${alivePlayers[0].playerNumber} 获胜!`);
            } else if (alivePlayers.length === 0) {
                this.endGame('平局!');
            }
        } else {
            // 闯关/合作模式：所有玩家死亡
            const alivePlayers = this.players.filter(p => p.health > 0);
            if (alivePlayers.length === 0) {
                this.endGame(`游戏结束! 第${this.wave}波 - 分数: ${this.score}`);
            }
        }
    }

    endGame(message) {
        this.gameOver = true;
        this.running = false;

        const gameOverDiv = document.getElementById('game-over');
        const messageDiv = document.getElementById('game-over-message');

        messageDiv.textContent = message;
        gameOverDiv.classList.remove('hidden');
    }

    updateHUD() {
        // 更新玩家1血条
        if (this.players[0]) {
            const p1Health = document.getElementById('p1-health');
            const healthPercent = (this.players[0].health / this.players[0].maxHealth) * 100;
            p1Health.style.width = healthPercent + '%';

            const p1Weapon = document.getElementById('p1-weapon');
            p1Weapon.textContent = `武器: ${this.players[0].currentWeapon.name}`;

            const p1Ammo = document.getElementById('p1-ammo');
            if (this.players[0].currentWeapon.maxAmmo > 0) {
                p1Ammo.textContent = `弹药: ${this.players[0].currentWeapon.ammo}/${this.players[0].currentWeapon.maxAmmo}`;
            } else {
                p1Ammo.textContent = '';
            }
        }

        // 更新玩家2血条（如果有）
        if (this.players[1]) {
            const p2Health = document.getElementById('p2-health');
            const healthPercent = (this.players[1].health / this.players[1].maxHealth) * 100;
            p2Health.style.width = healthPercent + '%';

            const p2Weapon = document.getElementById('p2-weapon');
            p2Weapon.textContent = `武器: ${this.players[1].currentWeapon.name}`;

            const p2Ammo = document.getElementById('p2-ammo');
            if (this.players[1].currentWeapon.maxAmmo > 0) {
                p2Ammo.textContent = `弹药: ${this.players[1].currentWeapon.ammo}/${this.players[1].currentWeapon.maxAmmo}`;
            } else {
                p2Ammo.textContent = '';
            }

            document.getElementById('p2-hud').style.display = 'block';
        } else {
            document.getElementById('p2-hud').style.display = 'none';
        }
    }

    updateScore() {
        document.getElementById('score').textContent = `分数: ${this.score}`;
    }

    updateWaveDisplay() {
        document.getElementById('wave-info').textContent = `第${this.wave}波`;
    }
}
