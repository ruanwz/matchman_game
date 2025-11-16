// 主入口文件
let currentGame = null;
let selectedScene = 'grassland';

// DOM元素
const menuScreen = document.getElementById('menu-screen');
const controlsScreen = document.getElementById('controls-screen');
const gameScreen = document.getElementById('game-screen');
const canvas = document.getElementById('gameCanvas');

// 菜单按钮
const menuButtons = document.querySelectorAll('.menu-btn[data-mode]');
const controlsBtn = document.getElementById('controls-btn');
const backBtn = document.querySelector('.back-btn');

// 场景选择按钮
const sceneButtons = document.querySelectorAll('.scene-btn');

// 游戏内按钮
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const quitBtn = document.getElementById('quit-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const menuBtnInGame = document.getElementById('menu-btn');

// 事件监听器
menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        startGame(mode);
    });
});

controlsBtn.addEventListener('click', () => {
    showScreen('controls');
});

backBtn.addEventListener('click', () => {
    showScreen('menu');
});

sceneButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 移除所有active类
        sceneButtons.forEach(b => b.classList.remove('active'));
        // 添加active类到当前按钮
        btn.classList.add('active');
        // 更新选中的场景
        selectedScene = btn.getAttribute('data-scene');
    });
});

resumeBtn.addEventListener('click', () => {
    if (currentGame) {
        currentGame.togglePause();
    }
});

restartBtn.addEventListener('click', () => {
    if (currentGame) {
        document.getElementById('pause-menu').classList.add('hidden');
        currentGame.restart();
        currentGame.paused = false;
        currentGame.running = true;
        currentGame.gameLoop();
    }
});

quitBtn.addEventListener('click', () => {
    if (currentGame) {
        currentGame.stop();
        currentGame = null;
    }
    showScreen('menu');
    document.getElementById('pause-menu').classList.add('hidden');
});

playAgainBtn.addEventListener('click', () => {
    if (currentGame) {
        currentGame.restart();
        currentGame.running = true;
        currentGame.gameLoop();
    }
});

menuBtnInGame.addEventListener('click', () => {
    if (currentGame) {
        currentGame.stop();
        currentGame = null;
    }
    showScreen('menu');
});

// 显示指定屏幕
function showScreen(screenName) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));

    switch (screenName) {
        case 'menu':
            menuScreen.classList.add('active');
            break;
        case 'controls':
            controlsScreen.classList.add('active');
            break;
        case 'game':
            gameScreen.classList.add('active');
            break;
    }
}

// 开始游戏
function startGame(mode) {
    showScreen('game');

    // 停止当前游戏（如果有）
    if (currentGame) {
        currentGame.stop();
    }

    // 创建新游戏
    currentGame = new Game(canvas, mode, selectedScene);
    currentGame.start();

    // 隐藏暂停和游戏结束菜单
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
}

// 页面加载完成后初始化
window.addEventListener('load', () => {
    console.log('🎮 火柴人对战游戏已加载!');
    console.log('选择游戏模式开始游戏');

    // 显示菜单
    showScreen('menu');
});

// 防止页面刷新时的意外操作
window.addEventListener('beforeunload', (e) => {
    if (currentGame && currentGame.running) {
        e.preventDefault();
        e.returnValue = '';
    }
});
