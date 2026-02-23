// ===========================================
// ARKHAM CORE SYSTEM v2.0 - UNIFICADO (SEM TEMAS)
// ===========================================
(function() {
    // ===========================================
    // CONFIGURAÇÕES GLOBAIS
    // ===========================================
    const CONFIG = {
        storageKeys: {
            points: 'batmanPoints',
            highScores: 'arkhamHighScores',
            settings: 'arkhamSettings',
            user: 'wayne_current_user',
            player: 'arkham_player',
            achievements: 'arkham_achievements',
            stats: 'arkham_stats',
            chestDaily: 'chest_daily_last',
            chestCounter: 'chest_phase_counter',
            dailyChallenge: 'daily_challenge_date',
            dailyChallenges: 'daily_challenges',
            dailyProgress: 'daily_progress',
            dailyStreak: 'daily_streak',
            tutorial: 'tutorial_completed',
            prestige: 'arkham_prestige_done'
        },
        defaultSettings: {
            theme: 'dark',
            soundEnabled: true,
            musicVolume: 50,
            sfxVolume: 70,
            language: 'pt'
        },
        version: '2.0.0'
    };

    // ===========================================
    // EVENT BUS (HUB VIVO)
    // ===========================================
    const ArkhamEvents = {
        emit(event, data) {
            window.dispatchEvent(new CustomEvent(event, { detail: data }));
        },
        on(event, callback) {
            window.addEventListener(event, callback);
        },
        off(event, callback) {
            window.removeEventListener(event, callback);
        }
    };

    // ===========================================
    // ESTADO GLOBAL DO JOGADOR
    // ===========================================
    const Player = {
        // Dados básicos
        points: 0,
        username: 'Visitante',
        highScores: {},
        
        // Progressão
        level: 1,
        xp: 0,
        xpToNext: 100,
        title: 'RECRUTA',
        
        // Missões
        missions: {
            completed: 0,
            total: 8
        },
        completedMissions: [],
        earnedWidgets: [],
        missionProgress: {
            coringa: { phasesCompleted: 0, totalPhases: 5, widgetUnlocked: false },
            pinguim: { phasesCompleted: 0, totalPhases: 5, widgetUnlocked: false },
            duascaras: { phasesCompleted: 0, totalPhases: 5, widgetUnlocked: false },
            harley: { phasesCompleted: 0, totalPhases: 5, widgetUnlocked: false },
            espantalho: { phasesCompleted: 0, totalPhases: 5, widgetUnlocked: false },
            charada: { phasesCompleted: 0, totalPhases: 5, widgetUnlocked: false },
            bane: { phasesCompleted: 0, totalPhases: 5, widgetUnlocked: false },
            mulhergato: { phasesCompleted: 0, totalPhases: 5, widgetUnlocked: false }
        },
        
        // Economia
        credits: 2400,
        gems: 5,
        jewels: 3,
        
        // Status
        lives: 5,
        armor: 50,
        attack: 30,
        energy: 100,
        
        // Timestamps
        lastDailyClaim: null,
        lastEnergyTimestamp: Date.now(),
        
        // Widgets posicionados
        widgetPositions: {},
        
        // Inventário
        inventory: [],
        
        init() {
            this.load();
            this.loadUsername();
            this.loadHighScores();
            console.log(`🎮 Arkham Core v${CONFIG.version} inicializado. Bem-vindo, ${this.username}!`);
        },
        
        // ===== PERSISTÊNCIA =====
        load() {
            const saved = localStorage.getItem(CONFIG.storageKeys.player);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    
                    // Atualizar propriedades básicas
                    this.level = data.level || 1;
                    this.xp = data.xp || 0;
                    this.xpToNext = data.xpToNext || 100;
                    this.title = data.title || 'RECRUTA';
                    this.credits = data.credits || 2400;
                    this.gems = data.gems || 5;
                    this.jewels = data.jewels || 3;
                    this.lives = data.lives || 5;
                    this.armor = data.armor || 50;
                    this.attack = data.attack || 30;
                    this.energy = data.energy || 100;
                    this.completedMissions = data.completedMissions || [];
                    this.earnedWidgets = data.earnedWidgets || [];
                    this.lastDailyClaim = data.lastDailyClaim || null;
                    this.lastEnergyTimestamp = data.lastEnergyTimestamp || Date.now();
                    this.widgetPositions = data.widgetPositions || {};
                    this.inventory = data.inventory || [];
                    
                    // Garantir que missionProgress existe
                    if (data.missionProgress) {
                        Object.keys(this.missionProgress).forEach(key => {
                            if (data.missionProgress[key]) {
                                this.missionProgress[key] = {
                                    ...this.missionProgress[key],
                                    ...data.missionProgress[key]
                                };
                            }
                        });
                    }
                    
                    // Sincronizar widgets earned com missionProgress
                    Object.keys(this.missionProgress).forEach(missionId => {
                        if (this.missionProgress[missionId].widgetUnlocked) {
                            if (!this.earnedWidgets.includes(missionId)) {
                                this.earnedWidgets.push(missionId);
                            }
                            if (!this.completedMissions.includes(missionId)) {
                                this.completedMissions.push(missionId);
                            }
                        }
                    });
                    
                    this.missions.completed = this.completedMissions.length;
                    this.xpToNext = this.level * 100;
                    
                } catch (e) {
                    console.error('Erro ao carregar save:', e);
                }
            }
            
            // Carregar pontos do sistema antigo
            const savedPoints = localStorage.getItem(CONFIG.storageKeys.points);
            if (savedPoints && this.xp === 0) {
                this.xp = parseInt(savedPoints, 10);
            }
        },
        
        save() {
            try {
                const saveData = {
                    level: this.level,
                    xp: this.xp,
                    xpToNext: this.xpToNext,
                    title: this.title,
                    credits: this.credits,
                    gems: this.gems,
                    jewels: this.jewels,
                    lives: this.lives,
                    armor: this.armor,
                    attack: this.attack,
                    energy: this.energy,
                    completedMissions: this.completedMissions,
                    earnedWidgets: this.earnedWidgets,
                    missionProgress: this.missionProgress,
                    lastDailyClaim: this.lastDailyClaim,
                    lastEnergyTimestamp: this.lastEnergyTimestamp,
                    widgetPositions: this.widgetPositions || {},
                    inventory: this.inventory || []
                };
                localStorage.setItem(CONFIG.storageKeys.player, JSON.stringify(saveData));
                localStorage.setItem(CONFIG.storageKeys.points, this.xp.toString());
            } catch (e) {
                console.error('Erro ao salvar:', e);
            }
        },
        
        // ===== GERENCIAMENTO DE PONTOS =====
        addPoints(amount, gameId = 'geral') {
            if (amount <= 0) return false;
            
            const oldPoints = this.xp;
            this.xp += amount;
            
            // Registrar progresso de fase se for uma missão
            if (gameId && gameId !== 'geral') {
                this.registerPhaseCompletion(gameId);
            }
            
            this.checkLevelUp();
            this.save();
            
            const isHighScore = this.checkHighScore(gameId, amount);
            
            ArkhamEvents.emit('player:xpChanged', { 
                oldPoints, newPoints: this.xp, added: amount, gameId, isHighScore 
            });
            
            return isHighScore;
        },
        
        // ===== FUNÇÃO CORRIGIDA - registerPhaseCompletion =====
        registerPhaseCompletion(missionId) {
            console.log('🎯 registerPhaseCompletion chamado com:', missionId);
            
            const missionMap = {
                'coringa': 'coringa',
                'pinguim': 'pinguim',
                'duascaras': 'duascaras',
                'harley': 'harley',
                'espantalho': 'espantalho',
                'charada': 'charada',
                'bane': 'bane',
                'mulhergato': 'mulhergato'
            };
            
            const mappedId = missionMap[missionId];
            if (!mappedId || !this.missionProgress[mappedId]) {
                console.warn(`❌ Missão não encontrada: ${missionId}`);
                return false;
            }
            
            const progress = this.missionProgress[mappedId];
            
            if (progress.widgetUnlocked) {
                return true;
            }
            
            if (progress.phasesCompleted < progress.totalPhases) {
                progress.phasesCompleted++;
                console.log(`✅ Missão ${mappedId} avançou para ${progress.phasesCompleted}/${progress.totalPhases}`);
                
                this.save();
                ArkhamEvents.emit('mission:completed', { missionId: mappedId, phase: progress.phasesCompleted });
                
                // Verificar se completou todas as fases
                if (progress.phasesCompleted >= progress.totalPhases) {
                    console.log(`🎉 DESBLOQUEANDO WIDGET ${mappedId}!`);
                    this.unlockWidget(mappedId);
                }
                
                return true;
            }
            
            return false;
        },
        
        // ===== FUNÇÃO CORRIGIDA - unlockWidget =====
        unlockWidget(missionId) {
            const missionNames = {
                coringa: 'CORINGA',
                pinguim: 'PINGÜIM',
                duascaras: 'DUAS-CARAS',
                harley: 'HARLEY QUINN',
                espantalho: 'ESPANTALHO',
                charada: 'CHARADA',
                bane: 'BANE',
                mulhergato: 'MULHER-GATO'
            };
            
            console.log('🎯 Tentando desbloquear widget:', missionId);
            
            // Garantir que missionProgress[missionId] existe
            if (!this.missionProgress[missionId]) {
                console.log('⚠️ Criando missionProgress para', missionId);
                this.missionProgress[missionId] = { phasesCompleted: 5, totalPhases: 5, widgetUnlocked: false };
            }
            
            if (!this.earnedWidgets.includes(missionId)) {
                this.earnedWidgets.push(missionId);
                console.log('✅ Widget adicionado aos earnedWidgets');
                console.log('📊 earnedWidgets agora:', this.earnedWidgets);
            }
            
            if (!this.completedMissions.includes(missionId)) {
                this.completedMissions.push(missionId);
                console.log('✅ Missão adicionada às completedMissions');
                console.log('📊 completedMissions agora:', this.completedMissions);
            }
            
            // Marcar como desbloqueado
            this.missionProgress[missionId].widgetUnlocked = true;
            this.missions.completed = this.completedMissions.length;
            
            console.log(`🎉 Widget ${missionNames[missionId] || missionId} desbloqueado com sucesso!`);
            
            this.save();
            
            // Emitir evento para o hub
            ArkhamEvents.emit('widget:unlocked', { 
                widgetId: missionId, 
                widgetName: missionNames[missionId] || missionId 
            });
            
            return true;
        },
        
        // ===== SISTEMA DE NÍVEL =====
        checkLevelUp() {
            const oldLevel = this.level;
            
            while (this.xp >= this.xpToNext) {
                this.level++;
                this.xp -= this.xpToNext;
                this.xpToNext = this.level * 100;
                
                const levelInfo = this.getCurrentLevelInfo();
                this.title = levelInfo.title;
                
                ArkhamEvents.emit('player:levelUp', { 
                    newLevel: this.level, 
                    oldLevel,
                    title: this.title 
                });
            }
        },
        
        getCurrentLevelInfo() {
            const ARKHAM_LEVELS = [
                { level: 1, min: 0, max: 200, title: 'RECRUTA' },
                { level: 2, min: 201, max: 500, title: 'DETETIVE' },
                { level: 3, min: 501, max: 1000, title: 'VIGILANTE' },
                { level: 4, min: 1001, max: 1800, title: 'PROTETOR' },
                { level: 5, min: 1801, max: 3000, title: 'LENDA' },
                { level: 6, min: 3001, max: 5000, title: 'SOMBRA' }
            ];
            
            for (let i = ARKHAM_LEVELS.length - 1; i >= 0; i--) {
                if (this.xp >= ARKHAM_LEVELS[i].min) {
                    return ARKHAM_LEVELS[i];
                }
            }
            return ARKHAM_LEVELS[0];
        },
        
        getLevelProgress() {
            const currentLevel = this.getCurrentLevelInfo();
            return ((this.xp - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;
        },
        
        // ===== USUÁRIO =====
        loadUsername() {
            const savedUser = localStorage.getItem(CONFIG.storageKeys.user);
            this.username = savedUser || 'Visitante';
        },
        
        setUsername(name) {
            this.username = name;
            localStorage.setItem(CONFIG.storageKeys.user, name);
        },
        
        // ===== HIGH SCORES =====
        loadHighScores() {
            const saved = localStorage.getItem(CONFIG.storageKeys.highScores);
            this.highScores = saved ? JSON.parse(saved) : {};
        },
        
        saveHighScores() {
            localStorage.setItem(CONFIG.storageKeys.highScores, JSON.stringify(this.highScores));
        },
        
        checkHighScore(gameId, score) {
            this.loadHighScores();
            
            if (!this.highScores[gameId] || score > this.highScores[gameId]) {
                this.highScores[gameId] = score;
                this.saveHighScores();
                return true;
            }
            return false;
        },
        
        getHighScore(gameId) {
            return this.highScores[gameId] || 0;
        },
        
        // ===== ECONOMIA =====
        addCredits(amount) {
            this.credits += amount;
            this.save();
            ArkhamEvents.emit('economy:changed', { credits: this.credits });
        },
        
        spendCredits(amount) {
            if (this.credits >= amount) {
                this.credits -= amount;
                this.save();
                ArkhamEvents.emit('economy:changed', { credits: this.credits });
                return true;
            }
            return false;
        },
        
        addLife() {
            if (this.lives < 10) {
                this.lives++;
                this.save();
                ArkhamEvents.emit('lives:changed', { lives: this.lives });
                return true;
            }
            return false;
        },
        
        removeLife() {
            if (this.lives > 0) {
                this.lives--;
                this.save();
                ArkhamEvents.emit('lives:changed', { lives: this.lives });
                
                if (this.lives === 0) {
                    ArkhamEvents.emit('player:gameOver', { message: 'Game Over!' });
                }
                return true;
            }
            return false;
        },
        
        // ===== ENERGIA =====
        regenerateEnergy() {
            const now = Date.now();
            const diffMinutes = (now - this.lastEnergyTimestamp) / (60 * 1000);
            
            const pointsToAdd = Math.floor(diffMinutes / 5);
            if (pointsToAdd > 0) {
                this.energy = Math.min(100, this.energy + pointsToAdd);
                this.lastEnergyTimestamp = now;
                this.save();
                ArkhamEvents.emit('energy:changed', { energy: this.energy });
            }
        },
        
        // ===== WIDGET POSITIONS =====
        saveWidgetPosition(widgetId, x, y) {
            if (!this.widgetPositions) this.widgetPositions = {};
            this.widgetPositions[widgetId] = { x, y };
            this.save();
        },
        
        removeWidgetPosition(widgetId) {
            if (this.widgetPositions && this.widgetPositions[widgetId]) {
                delete this.widgetPositions[widgetId];
                this.save();
            }
        },
        
        getWidgetPositions() {
            return this.widgetPositions || {};
        },
        
        // ===== MISSÕES =====
        getNextMissionIndex() {
            const ARKHAM_MISSIONS = [
                { id: 'coringa' },
                { id: 'pinguim' },
                { id: 'duascaras' },
                { id: 'harley' },
                { id: 'espantalho' },
                { id: 'charada' },
                { id: 'bane' },
                { id: 'mulhergato' }
            ];
            
            for (let i = 0; i < ARKHAM_MISSIONS.length; i++) {
                const missionId = ARKHAM_MISSIONS[i].id;
                if (!this.missionProgress[missionId]?.widgetUnlocked) {
                    return i;
                }
            }
            return ARKHAM_MISSIONS.length - 1;
        },
        
        getNextMission() {
            const ARKHAM_MISSIONS = [
                { id: 'coringa', name: 'CORINGA', icon: '🤡' },
                { id: 'pinguim', name: 'PINGÜIM', icon: '🐧' },
                { id: 'duascaras', name: 'DUAS-CARAS', icon: '🎭' },
                { id: 'harley', name: 'HARLEY QUINN', icon: '🃏' },
                { id: 'espantalho', name: 'ESPANTALHO', icon: '👻' },
                { id: 'charada', name: 'CHARADA', icon: '❓' },
                { id: 'bane', name: 'BANE', icon: '💪' },
                { id: 'mulhergato', name: 'MULHER-GATO', icon: '🐱' }
            ];
            
            const nextIndex = this.getNextMissionIndex();
            return ARKHAM_MISSIONS[nextIndex] || null;
        },
        
        getMissionName(missionId) {
            const names = {
                coringa: 'CORINGA',
                pinguim: 'PINGÜIM',
                duascaras: 'DUAS-CARAS',
                harley: 'HARLEY QUINN',
                espantalho: 'ESPANTALHO',
                charada: 'CHARADA',
                bane: 'BANE',
                mulhergato: 'MULHER-GATO'
            };
            return names[missionId] || missionId;
        }
    };

    // ===========================================
    // SISTEMA DE CONFIGURAÇÕES (SOM)
    // ===========================================
    const Settings = {
        current: { ...CONFIG.defaultSettings },
        
        init() {
            this.load();
        },
        
        load() {
            const saved = localStorage.getItem(CONFIG.storageKeys.settings);
            if (saved) {
                try {
                    this.current = { ...CONFIG.defaultSettings, ...JSON.parse(saved) };
                } catch (e) {
                    console.warn('Erro ao carregar configurações:', e);
                }
            }
        },
        
        save() {
            localStorage.setItem(CONFIG.storageKeys.settings, JSON.stringify(this.current));
        },
        
        update(key, value) {
            this.current[key] = value;
            this.save();
            ArkhamEvents.emit('settingsUpdated', { key, value });
        },
        
        playSfx(type = 'click') {
            if (!this.current.soundEnabled) return;
            
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                let frequency = 800;
                let duration = 0.1;
                
                switch(type) {
                    case 'click': frequency = 800; duration = 0.1; break;
                    case 'success': frequency = 523.25; duration = 0.3; break;
                    case 'error': frequency = 349.23; duration = 0.5; break;
                    case 'victory': frequency = 659.25; duration = 0.4; break;
                    case 'coin': frequency = 987.77; duration = 0.15; break;
                    case 'logout': frequency = 349.23; duration = 0.4; break;
                }
                
                oscillator.frequency.value = frequency;
                gainNode.gain.value = (this.current.sfxVolume / 100) * 0.1;
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + duration);
            } catch (e) {
                // Áudio não essencial
            }
        }
    };

    // ===========================================
    // SISTEMA DE CONQUISTAS
    // ===========================================
    const Achievements = {
        list: [
            { id: 'ach_first_widget', name: 'COMEÇANDO', desc: 'Desbloqueie seu primeiro widget', reward: 100, icon: '🎮', condition: (p) => p.earnedWidgets.length >= 1 },
            { id: 'ach_collector', name: 'COLECIONADOR', desc: 'Desbloqueie todos os 8 widgets', reward: 500, icon: '🏆', condition: (p) => p.earnedWidgets.length >= 8 },
            { id: 'ach_shadow', name: 'SOMBRA', desc: 'Alcance o nível 6', reward: 300, icon: '🌑', condition: (p) => p.level >= 6 },
            { id: 'ach_rich', name: 'MAGNATA', desc: 'Acumule 10.000 créditos', reward: 200, icon: '💰', condition: (p) => p.credits >= 10000 },
            { id: 'ach_immortal', name: 'IMORTAL', desc: 'Complete 10 fases sem perder vida', reward: 150, icon: '♾️', condition: (p, s, stats) => (stats?.deaths || 0) === 0 && (stats?.phasesCompleted || 0) >= 10 },
            { id: 'ach_early', name: 'MADRUGADOR', desc: 'Reivindique 7 bônus diários', reward: 250, icon: '🌅', condition: (p, s, stats) => (stats?.dailyClaims || 0) >= 7 }
        ],
        
        playerAchievements: [],
        
        init() {
            const saved = localStorage.getItem(CONFIG.storageKeys.achievements);
            this.playerAchievements = saved ? JSON.parse(saved) : [];
        },
        
        checkAll(stats) {
            this.list.forEach(ach => {
                if (!this.playerAchievements.includes(ach.id)) {
                    let earned = false;
                    earned = ach.condition(Player, null, stats);
                    if (earned) this.unlock(ach);
                }
            });
        },
        
        unlock(achievement) {
            if (this.playerAchievements.includes(achievement.id)) return;
            this.playerAchievements.push(achievement.id);
            localStorage.setItem(CONFIG.storageKeys.achievements, JSON.stringify(this.playerAchievements));
            
            Player.credits += achievement.reward;
            Player.save();
            ArkhamEvents.emit('achievement:unlocked', achievement);
        },
        
        isUnlocked(id) {
            return this.playerAchievements.includes(id);
        }
    };

    // ===========================================
    // ESTATÍSTICAS DETALHADAS
    // ===========================================
    const Stats = {
        data: {
            totalPlayTime: 0,
            phasesPlayed: 0,
            phasesCompleted: 0,
            deaths: 0,
            creditsEarned: 0,
            gemsCollected: 0,
            itemsBought: 0,
            dailyClaims: 0,
            lastSession: Date.now()
        },
        
        init() {
            const saved = localStorage.getItem(CONFIG.storageKeys.stats);
            if (saved) {
                try {
                    this.data = { ...this.data, ...JSON.parse(saved) };
                } catch (e) {}
            }
            
            // Hook no addPoints original
            const originalAdd = Player.addPoints;
            Player.addPoints = function(amount, gameId) {
                Stats.data.phasesPlayed++;
                if (amount > 0) Stats.data.phasesCompleted++;
                Stats.data.creditsEarned += Math.floor(amount / 10);
                Stats.save();
                return originalAdd.call(this, amount, gameId);
            };
            
            // Hook no removeLife
            const originalRemove = Player.removeLife;
            Player.removeLife = function() {
                Stats.data.deaths++;
                Stats.save();
                return originalRemove.call(this);
            };
        },
        
        save() {
            localStorage.setItem(CONFIG.storageKeys.stats, JSON.stringify(this.data));
        },
        
        recordDailyClaim() {
            this.data.dailyClaims++;
            this.save();
        },
        
        recordItemBought() {
            this.data.itemsBought++;
            this.save();
        }
    };

    // ===========================================
    // SISTEMA DE BÔNUS DIÁRIO
    // ===========================================
    const Daily = {
        check() {
            const lastClaim = Player.lastDailyClaim;
            if (!lastClaim) {
                return { canClaim: true, timeLeft: 0 };
            }
            
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            const timeSinceLast = now - lastClaim;
            
            if (timeSinceLast >= oneDay) {
                return { canClaim: true, timeLeft: 0 };
            } else {
                const timeLeft = oneDay - timeSinceLast;
                return { canClaim: false, timeLeft };
            }
        },
        
        claim() {
            const status = this.check();
            if (!status.canClaim) {
                return false;
            }
            
            Player.credits += 500;
            Player.energy = Math.min(100, Player.energy + 20);
            Player.xp += 100;
            Player.lastDailyClaim = Date.now();
            
            Stats.recordDailyClaim();
            Player.save();
            
            ArkhamEvents.emit('economy:changed', { credits: Player.credits });
            ArkhamEvents.emit('player:xpChanged', { newXp: Player.xp });
            
            return true;
        }
    };

    // ===========================================
    // SISTEMA DE BAÚS (LOOT BOXES)
    // ===========================================
    const Chests = {
        daily: {
            lastOpen: 0,
            
            init() {
                this.lastOpen = parseInt(localStorage.getItem(CONFIG.storageKeys.chestDaily) || '0');
            },
            
            canOpen() {
                const last = this.lastOpen;
                const today = new Date().setHours(0, 0, 0, 0);
                return last < today;
            },
            
            open() {
                if (!this.canOpen()) return false;
                
                const reward = Math.floor(Math.random() * 151) + 50;
                Player.credits += reward;
                
                if (Math.random() < 0.3) {
                    Player.gems++;
                    ArkhamEvents.emit('chest:opened', { reward, gems: true });
                } else {
                    ArkhamEvents.emit('chest:opened', { reward, gems: false });
                }
                
                this.lastOpen = new Date().setHours(0, 0, 0, 0);
                localStorage.setItem(CONFIG.storageKeys.chestDaily, this.lastOpen.toString());
                Player.save();
                return true;
            }
        },
        
        phase: {
            counter: 0,
            
            init() {
                this.counter = parseInt(localStorage.getItem(CONFIG.storageKeys.chestCounter) || '0');
            },
            
            addProgress() {
                this.counter++;
                if (this.counter >= 5) {
                    this.counter = 0;
                    this.open();
                }
                localStorage.setItem(CONFIG.storageKeys.chestCounter, this.counter.toString());
            },
            
            open() {
                const reward = Math.floor(Math.random() * 100) + 20;
                Player.credits += reward;
                Player.save();
                ArkhamEvents.emit('chest:phaseOpened', { reward });
            }
        },
        
        init() {
            this.daily.init();
            this.phase.init();
        }
    };

    // ===========================================
    // DESAFIOS DIÁRIOS
    // ===========================================
    const DailyChallenges = {
        challenges: [
            { id: 'daily_phases', name: 'GUERREIRO', desc: 'Complete 3 fases', goal: 3, reward: 150, icon: '⚔️', type: 'phases' },
            { id: 'daily_perfect', name: 'PERFEITO', desc: 'Complete 1 fase sem morrer', goal: 1, reward: 200, icon: '✨', type: 'perfect' },
            { id: 'daily_widgets', name: 'ESTRATEGISTA', desc: 'Use 2 widgets', goal: 2, reward: 100, icon: '🎮', type: 'widgets' },
            { id: 'daily_spend', name: 'INVESTIDOR', desc: 'Gaste 500 créditos', goal: 500, reward: 75, icon: '💰', type: 'spend' }
        ],
        
        current: [],
        progress: {},
        streak: 0,
        completed: {},
        
        init() {
            const savedStreak = localStorage.getItem(CONFIG.storageKeys.dailyStreak);
            this.streak = savedStreak ? parseInt(savedStreak) : 0;
            
            this.resetIfNeeded();
            
            // Hooks
            const originalAdd = Player.addPoints;
            Player.addPoints = function(amount, gameId) {
                DailyChallenges.addProgress('phases', 1);
                if (amount > 0) DailyChallenges.addProgress('perfect', 1);
                return originalAdd.call(this, amount, gameId);
            };
        },
        
        resetIfNeeded() {
            const today = new Date().toDateString();
            const lastReset = localStorage.getItem(CONFIG.storageKeys.dailyChallenge);
            
            if (lastReset !== today) {
                const shuffled = [...this.challenges].sort(() => 0.5 - Math.random());
                this.current = shuffled.slice(0, 2);
                this.progress = {};
                this.completed = {};
                this.current.forEach(c => this.progress[c.id] = 0);
                
                localStorage.setItem(CONFIG.storageKeys.dailyChallenge, today);
                localStorage.setItem(CONFIG.storageKeys.dailyChallenges, JSON.stringify(this.current));
                localStorage.setItem(CONFIG.storageKeys.dailyProgress, JSON.stringify(this.progress));
                
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                if (lastReset !== yesterday) {
                    this.streak = 0;
                    localStorage.setItem(CONFIG.storageKeys.dailyStreak, '0');
                }
            } else {
                const saved = localStorage.getItem(CONFIG.storageKeys.dailyChallenges);
                this.current = saved ? JSON.parse(saved) : [];
                
                const savedProgress = localStorage.getItem(CONFIG.storageKeys.dailyProgress);
                this.progress = savedProgress ? JSON.parse(savedProgress) : {};
            }
        },
        
        addProgress(type, amount = 1, value = null) {
            if (!this.current.length) return;
            
            this.current.forEach(challenge => {
                if (challenge.type === type && !this.completed[challenge.id]) {
                    if (value !== null) {
                        this.progress[challenge.id] = Math.min(challenge.goal, value);
                    } else {
                        this.progress[challenge.id] = Math.min(challenge.goal, (this.progress[challenge.id] || 0) + amount);
                    }
                    
                    if (this.progress[challenge.id] >= challenge.goal) {
                        this.complete(challenge);
                    }
                }
            });
            
            localStorage.setItem(CONFIG.storageKeys.dailyProgress, JSON.stringify(this.progress));
        },
        
        complete(challenge) {
            if (this.completed[challenge.id]) return;
            this.completed[challenge.id] = true;
            
            let reward = challenge.reward;
            if (this.streak >= 7) reward *= 2;
            else if (this.streak >= 3) reward *= 1.5;
            
            Player.credits += reward;
            this.streak++;
            
            localStorage.setItem(CONFIG.storageKeys.dailyStreak, this.streak.toString());
            Player.save();
            
            ArkhamEvents.emit('challenge:completed', { challenge, reward });
        }
    };

    // ===========================================
    // PRESTÍGIO (SEM TEMA OURO)
    // ===========================================
    const Prestige = {
        canPrestige() {
            return Player.level >= 6 &&
                Player.earnedWidgets.length >= 8 &&
                !localStorage.getItem(CONFIG.storageKeys.prestige);
        },
        
        doPrestige() {
            if (!this.canPrestige()) {
                return false;
            }
            
            const achievements = Achievements.playerAchievements;
            
            Player.level = 1;
            Player.xp = 0;
            Player.xpToNext = 100;
            Player.earnedWidgets = [];
            Player.completedMissions = [];
            
            Object.keys(Player.missionProgress).forEach(key => {
                Player.missionProgress[key] = { phasesCompleted: 0, totalPhases: 5, widgetUnlocked: false };
            });
            
            Achievements.playerAchievements = achievements;
            
            localStorage.setItem(CONFIG.storageKeys.prestige, 'true');
            
            Player.credits += 1000;
            Player.gems += 10;
            Player.save();
            
            ArkhamEvents.emit('player:prestige', { credits: 1000, gems: 10 });
            
            return true;
        }
    };

    // ===========================================
    // UTILITÁRIOS
    // ===========================================
    const Utils = {
        addLog(message, type = 'info', elementId = 'combatLog') {
            const logElement = document.getElementById(elementId);
            if (!logElement) return;
            
            const entry = document.createElement('div');
            entry.className = `log-entry ${type}`;
            entry.textContent = '> ' + message;
            
            logElement.insertBefore(entry, logElement.firstChild);
            
            while (logElement.children.length > 10) {
                logElement.removeChild(logElement.lastChild);
            }
        },
        
        showAlert(message, duration = 3000, elementId = 'alertBar') {
            const alertBar = document.getElementById(elementId);
            if (!alertBar) {
                alert(message);
                return;
            }
            
            alertBar.textContent = message;
            alertBar.style.display = 'block';
            
            setTimeout(() => {
                alertBar.style.display = 'none';
            }, duration);
        },
        
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        },
        
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        
        isMobile() {
            return window.innerWidth <= 768;
        },
        
        generateId() {
            return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        },
        
        showToast(msg, type = 'info') {
            const colors = {
                success: { bg: 'rgba(0,255,136,0.15)', border: '#00ff88' },
                warning: { bg: 'rgba(255,170,0,0.15)', border: '#ffaa00' },
                info: { bg: 'rgba(0,217,255,0.15)', border: '#00d9ff' },
                error: { bg: 'rgba(255,0,64,0.15)', border: '#ff0040' }
            };
            const c = colors[type] || colors.info;
            
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
                background: ${c.bg}; border: 1px solid ${c.border}; color: #fff;
                padding: 10px 20px; border-radius: 6px; z-index: 9999;
                animation: fadeInOut 2s ease;
                backdrop-filter: blur(10px);
                font-size: 14px;
                font-weight: bold;
            `;
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }
    };

    // ===========================================
    // SISTEMA DE ALERTAS
    // ===========================================
    const AlertSystem = {
        secondsToNextAlert: 180,
        emergencyCountdown: 30,
        alertInterval: null,
        emergencyInterval: null,
        
        init() {
            this.startAlertSystem();
        },
        
        startAlertSystem() {
            this.alertInterval = setInterval(() => {
                if (this.secondsToNextAlert > 0) {
                    this.secondsToNextAlert--;
                    ArkhamEvents.emit('alert:tick', { seconds: this.secondsToNextAlert });
                } else {
                    ArkhamEvents.emit('alert:ready');
                }
            }, 1000);
        },
        
        triggerEmergency() {
            this.emergencyCountdown = 30;
            
            if (this.emergencyInterval) clearInterval(this.emergencyInterval);
            
            this.emergencyInterval = setInterval(() => {
                if (this.emergencyCountdown <= 0) {
                    this.dismissEmergency();
                    return;
                }
                
                this.emergencyCountdown--;
                ArkhamEvents.emit('emergency:tick', { seconds: this.emergencyCountdown });
            }, 1000);
            
            ArkhamEvents.emit('emergency:triggered');
            Settings.playSfx('error');
        },
        
        dismissEmergency() {
            if (this.emergencyInterval) {
                clearInterval(this.emergencyInterval);
                this.emergencyInterval = null;
            }
            
            this.secondsToNextAlert = 180;
            ArkhamEvents.emit('emergency:dismissed');
            Settings.playSfx('success');
        },
        
        skipAlert() {
            this.secondsToNextAlert = 0;
            ArkhamEvents.emit('alert:skipped');
            Settings.playSfx('click');
        },
        
        stop() {
            if (this.alertInterval) clearInterval(this.alertInterval);
            if (this.emergencyInterval) clearInterval(this.emergencyInterval);
        }
    };

    // ===========================================
    // LOJA
    // ===========================================
    const Shop = {
        items: [
            { id: 'capacete', name: 'CAPACETE TÁTICO', desc: '+20 de defesa', price: 500, icon: 'fa-shield-alt', type: 'equipment' },
            { id: 'luva', name: 'LUVA DE COMBATE', desc: '+15 de ataque', price: 350, icon: 'fa-fist-raised', type: 'equipment' },
            { id: 'jetpack', name: 'JETPACK', desc: 'Mobilidade +30', price: 800, icon: 'fa-tachometer-alt', type: 'equipment' },
            { id: 'analisador', name: 'ANALISADOR', desc: '+25% precisão', price: 600, icon: 'fa-microchip', type: 'equipment' },
            { id: 'capacitor', name: 'CAPACITOR', desc: '+20 energia', price: 400, icon: 'fa-bolt', type: 'equipment' },
            { id: 'gemas', name: 'PACOTE DE GEMAS', desc: '+10 gemas', price: 200, icon: 'fa-gem', type: 'consumable' },
            { id: 'boost_xp', name: 'BOOST DE XP', desc: 'Dobra XP por 1 hora', price: 100, icon: 'fa-bolt', type: 'consumable' },
            { id: 'recarga', name: 'RECARGA TOTAL', desc: 'Energia máxima instantânea', price: 50, icon: 'fa-battery-full', type: 'consumable' },
            { id: 'caixa', name: 'CAIXA MISTERIOSA', desc: 'Recompensa surpresa!', price: 150, icon: 'fa-box', type: 'lootbox' }
        ],
        
        buyItem(itemId) {
            const item = this.items.find(i => i.id === itemId);
            if (!item) return false;
            
            if (Player.credits < item.price) {
                ArkhamEvents.emit('shop:insufficientFunds', { item, missing: item.price - Player.credits });
                return false;
            }
            
            Player.credits -= item.price;
            
            switch(itemId) {
                case 'capacete':
                    Player.armor += 20;
                    break;
                case 'luva':
                    Player.attack += 15;
                    break;
                case 'jetpack':
                    Player.energy = Math.min(100, Player.energy + 30);
                    break;
                case 'analisador':
                    // Efeito abstrato
                    break;
                case 'capacitor':
                    Player.energy = Math.min(100, Player.energy + 20);
                    break;
                case 'gemas':
                    Player.gems += 10;
                    break;
                case 'boost_xp':
                    localStorage.setItem('xp_boost_until', (Date.now() + 3600000).toString());
                    break;
                case 'recarga':
                    Player.energy = 100;
                    break;
                case 'caixa':
                    const reward = Math.floor(Math.random() * 300) + 50;
                    Player.credits += reward;
                    if (Math.random() < 0.1) Player.gems++;
                    ArkhamEvents.emit('shop:lootbox', { reward });
                    break;
            }
            
            Player.inventory.push({ ...item, purchasedAt: Date.now() });
            Stats.recordItemBought();
            Player.save();
            
            ArkhamEvents.emit('shop:purchase', { item });
            Settings.playSfx('success');
            
            return true;
        }
    };

    // ===========================================
    // MISSÕES (DADOS ESTÁTICOS)
    // ===========================================
    const Missions = {
        list: [
            { id: 'coringa', name: 'CORINGA', order: 1, points: 100, icon: '🤡', desc: 'Caos total - 5 fases', game: 'jogos/1.1ClashRoyale.html', category: 'threat' },
            { id: 'pinguim', name: 'PINGÜIM', order: 2, points: 200, icon: '🐧', desc: 'Operação porto - 5 fases', game: 'jogos/1.2TirosArmas.html', category: 'combat' },
            { id: 'duascaras', name: 'DUAS-CARAS', order: 3, points: 300, icon: '🎭', desc: 'Caos distritos - 5 fases', game: 'jogos/1.3TaticoCrimes.html', category: 'threat' },
            { id: 'harley', name: 'HARLEY QUINN', order: 4, points: 400, icon: '🃏', desc: 'Perseguição - 5 fases', game: 'jogos/1.4BatmovelGame.html', category: 'vehicle' },
            { id: 'espantalho', name: 'ESPANTALHO', order: 5, points: 500, icon: '👻', desc: 'Toxina do medo - 5 fases', game: 'jogos/1.5Perguntas.Cameras.html', category: 'security' },
            { id: 'charada', name: 'CHARADA', order: 6, points: 600, icon: '❓', desc: 'Decodificar - 5 fases', game: 'jogos/1.6Criptografia.html', category: 'security' },
            { id: 'bane', name: 'BANE', order: 7, points: 700, icon: '💪', desc: 'Análise do veneno - 5 fases', game: 'jogos/1.7Dna.html', category: 'security' },
            { id: 'mulhergato', name: 'MULHER-GATO', order: 8, points: 800, icon: '🐱', desc: 'Rastreamento - 5 fases', game: 'jogos/1.8Gerenciamento.html', category: 'vehicle' }
        ],
        
        getById(id) {
            return this.list.find(m => m.id === id);
        },
        
        getNext(currentId) {
            const index = this.list.findIndex(m => m.id === currentId);
            return index >= 0 && index < this.list.length - 1 ? this.list[index + 1] : null;
        },
        
        getPrevious(currentId) {
            const index = this.list.findIndex(m => m.id === currentId);
            return index > 0 ? this.list[index - 1] : null;
        }
    };

    // ===========================================
    // INICIALIZAÇÃO
    // ===========================================
    function init() {
        Player.init();
        Settings.init();
        Achievements.init();
        Stats.init();
        DailyChallenges.init();
        Chests.init();
        AlertSystem.init();
        
        // Iniciar regeneração de energia
        setInterval(() => {
            Player.regenerateEnergy();
        }, 60000);
        
        console.log('⚙️ Arkham Core unificado pronto (sem sistema de cores).');
    }

    // ===========================================
    // EXPOR PARA O ESCOPO GLOBAL
    // ===========================================
    window.ArkhamCore = {
        // Configurações
        CONFIG,
        
        // Sub-sistemas
        Player,
        Settings,
        Achievements,
        Stats,
        Daily,
        Chests,
        DailyChallenges,
        Prestige,
        Shop,
        Missions,
        AlertSystem,
        Utils,
        Events: ArkhamEvents,
        
        // Versão
        version: CONFIG.version,
        
        // Métodos de conveniência
        addPoints(amount, gameId) {
            return Player.addPoints(amount, gameId);
        },

        registerPhaseCompletion(missionId) {
            return Player.registerPhaseCompletion(missionId);
        },

        getPoints() {
            return Player.xp;
        },

        getLevel() {
            return Player.level;
        },

        getLevelProgress() {
            return Player.getLevelProgress();
        },

        playSound(type) {
            Settings.playSfx(type);
        },

        showToast(msg, type) {
            Utils.showToast(msg, type);
        },

        triggerEmergency() {
            AlertSystem.triggerEmergency();
        },

        dismissEmergency() {
            AlertSystem.dismissEmergency();
        },

        skipAlert() {
            AlertSystem.skipAlert();
        },

        buyItem(itemId) {
            return Shop.buyItem(itemId);
        },

        claimDaily() {
            return Daily.claim();
        },

        prestige() {
            return Prestige.doPrestige();
        },

        init
    };

    // ===========================================
    // COMPATIBILIDADE COM O SISTEMA ANTIGO
    // ===========================================
    window.BatHUD = {
        addPoints: function(points, gameId) {
            console.log('🦇 BatHUD.addPoints(' + points + ', ' + gameId + ')');
            if (window.ArkhamCore) {
                return window.ArkhamCore.addPoints(points, gameId);
            }
            return false;
        },

        completeMission: function(missionId) {
            console.log('🦇 BatHUD.completeMission(' + missionId + ')');
            if (window.ArkhamCore) {
                return window.ArkhamCore.registerPhaseCompletion(missionId);
            }
            return false;
        },

        addScore: function(points, missionId) {
            console.log('🦇 BatHUD.addScore(' + points + ', ' + missionId + ')');
            if (window.ArkhamCore) {
                return window.ArkhamCore.addPoints(points, missionId);
            }
            return false;
        },

        dismissEmergency: function() {
            if (window.ArkhamCore) window.ArkhamCore.dismissEmergency();
        },

        skipAlert: function() {
            if (window.ArkhamCore) window.ArkhamCore.skipAlert();
        },

        triggerEmergency: function() {
            if (window.ArkhamCore) window.ArkhamCore.triggerEmergency();
        },

        claimDaily: function() {
            if (window.ArkhamCore) return window.ArkhamCore.claimDaily();
            return false;
        },

        prestige: function() {
            if (window.ArkhamCore) return window.ArkhamCore.prestige();
            return false;
        },

        showToast: function(msg, type) {
            if (window.ArkhamCore) window.ArkhamCore.showToast(msg, type);
        },

        playSound: function(type) {
            if (window.ArkhamCore) window.ArkhamCore.playSound(type);
        }
    };

    // Auto-inicializar
    window.ArkhamCore.init();
})();