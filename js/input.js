// 输入管理器
class InputManager {
    constructor() {
        this.keys = {};
        this.player1Keys = {
            left: 'a',
            right: 'd',
            up: 'w',
            down: 's',
            attack: 'j',
            switchWeapon: 'k',
            interact: 'l'
        };
        this.player2Keys = {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            up: 'ArrowUp',
            down: 'ArrowDown',
            attack: '1',
            switchWeapon: '2',
            interact: '3'
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.key] = true; // 保留原始大小写
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.key] = false;
        });

        // 防止空格键滚动页面
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' && e.target === document.body) {
                e.preventDefault();
            }
        });
    }

    isKeyPressed(key) {
        return this.keys[key] || this.keys[key.toLowerCase()] || false;
    }

    // 获取玩家1的输入
    getPlayer1Input() {
        return {
            left: this.isKeyPressed(this.player1Keys.left),
            right: this.isKeyPressed(this.player1Keys.right),
            up: this.isKeyPressed(this.player1Keys.up),
            down: this.isKeyPressed(this.player1Keys.down),
            attack: this.isKeyPressed(this.player1Keys.attack),
            switchWeapon: this.isKeyPressed(this.player1Keys.switchWeapon),
            interact: this.isKeyPressed(this.player1Keys.interact)
        };
    }

    // 获取玩家2的输入
    getPlayer2Input() {
        return {
            left: this.isKeyPressed(this.player2Keys.left),
            right: this.isKeyPressed(this.player2Keys.right),
            up: this.isKeyPressed(this.player2Keys.up),
            down: this.isKeyPressed(this.player2Keys.down),
            attack: this.isKeyPressed(this.player2Keys.attack),
            switchWeapon: this.isKeyPressed(this.player2Keys.switchWeapon),
            interact: this.isKeyPressed(this.player2Keys.interact)
        };
    }

    // 重置按键状态
    reset() {
        this.keys = {};
    }
}
