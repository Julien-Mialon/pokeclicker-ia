IA.stop();

class IA {
    static _intervals = [];
    static EnableHatchery = true;
    static EnableChampionsLoop = true;
    static EnableDungeonsLoop = true;
    static DisableChampionOnAchievementsCompleted = true;
    static DisableDungeonOnAchievementsCompleted = true;
    static EnableBerries = true;
    static EnableUnderground = true;

    static EnableTimeHack = true;

    static _ChangedPokeballForQuest = false;

    static _FarAwayDate = new Date(1991, 1, 12);

    static start() {
        IA.stop();

        console.log("Auto attack");
        IA._intervals.push(setInterval(IA.AutoAttack, 1));
        console.log("Quests");
        IA._intervals.push(setInterval(IA.CompleteQuests, 2000));
        console.log("Hatchery");
        IA._intervals.push(setInterval(IA.Breeding, 1000));
        console.log("Champion loop");
        IA._intervals.push(setInterval(IA.PlayChampion, 500));
        console.log("Dungeon loop");
        IA._intervals.push(setInterval(IA.StartDungeon, 100));
        console.log("Renew berries");
        IA._intervals.push(setInterval(IA.RenewBerries, 2000));
        console.log("Underground");
        IA._intervals.push(setInterval(IA.DigUnderground, 2000));
        
        console.log("Add: ", IA._intervals);

        if(IA.EnableTimeHack) {
            for(const pokeball of App.game.pokeballs.pokeballs) {
                pokeball.catchTime = 25;
            }
        }
    }

    static stop() {
        console.log("Clear: ", IA._intervals);
        for(const id of IA._intervals) {
            clearInterval(id);
        }

        while(IA._intervals.length > 0) {
            IA._intervals.pop();
        }
    }

    static AutoAttack() {
        if (App.game.gameState === GameConstants.GameState.fighting) {
            if(IA.EnableTimeHack) {
                Battle.lastClickAttack = IA._FarAwayDate;
            }
            IA._WildPokemonAttack();
        }
        else if (App.game.gameState == GameConstants.GameState.dungeon) {
            if(IA.EnableTimeHack) {
                DungeonBattle.lastClickAttack = IA._FarAwayDate;
            }
            IA._PlayDungeon();
        }
        else if (App.game.gameState == GameConstants.GameState.gym) {
            if(IA.EnableTimeHack) {
                GymBattle.lastClickAttack = IA._FarAwayDate;
            }
            GymBattle.clickAttack();
        }
        else if (App.game.gameState == GameConstants.GameState.battleFrontier) {
    
        }
    }

    static _CheckChangePokeballForEnemy(enemy) {
        if(App.game.pokeballs.alreadyCaughtSelection < 0 || IA._ChangedPokeballForQuest) {
            let captureQuests = App.game.quests.currentQuests().filter(x => x instanceof CapturePokemonTypesQuest);

            var forceCapture = enemy.shiny;
            for(const q of captureQuests) {
                if(q.type == enemy.type1 || q.type == enemy.type2) {
                    forceCapture = true;
                    break;
                }
            }

            if(forceCapture) {
                if(App.game.pokeballs.alreadyCaughtSelection < 0) {
                    App.game.pokeballs._alreadyCaughtSelection(2);
                    IA._ChangedPokeballForQuest = true;
                }
            } 
            else if(IA._ChangedPokeballForQuest) {
                App.game.pokeballs._alreadyCaughtSelection(-1);
                IA._ChangedPokeballForQuest = false;
            }
        }

    }

    static _WildPokemonAttack() {
        if(Battle.catching()) {
            return;
        }

        if(Battle.enemyPokemon().health() <= 0) {
            return;
        }

        IA._CheckChangePokeballForEnemy(Battle.enemyPokemon());

        Battle.clickAttack();
    }

    static _PlayDungeon() {
        if(DungeonRunner.catching) {
            return;
        }
        else if(DungeonRunner.fighting() || DungeonRunner.fightingBoss()) {
            IA._CheckChangePokeballForEnemy(DungeonBattle.enemyPokemon());
            DungeonRunner.handleClick();
        }
        else if(DungeonRunner.map.currentTile().type() == GameConstants.DungeonTile.chest) {
            DungeonRunner.handleClick();
        }
        else if(DungeonRunner.map.currentTile().type() == GameConstants.DungeonTile.boss) {
            DungeonRunner.handleClick();
        }
        else {
            let board = DungeonRunner.map.board();
            let caseTypes = board.map(row => row.map(x => x.type()));
            let visited = board.map(row => row.map(x => x.isVisited));

            var visitedCount = 0;
            var totalCount = 0;
            var chestCount = 0;
            var bossX = 0;
            var bossY = 0;

            for(var y = 0 ; y < board.length ; y += 1) {
                for(var x = 0 ; x < board[y].length ; x += 1) {
                    totalCount += 1;
                    if(visited[y][x]) {
                        visitedCount += 1;
                    }

                    if(caseTypes[y][x] == GameConstants.DungeonTile.boss) {
                        bossX = x;
                        bossY = y;
                    }
                    else if(caseTypes[y][x] == GameConstants.DungeonTile.chest) {
                        chestCount += 1;
                    }
                }
            }

            var canVisitChests = false;
            if(visitedCount + 1 + chestCount >= totalCount) {
                if(chestCount == 0) {
                    DungeonRunner.map.moveToCoordinates(bossX, bossY);
                    return;
                }

                canVisitChests = true;
            }

            for(var y = 0 ; y < board.length ; y += 1) {
                for(var x = 0 ; x < board[y].length ; x += 1) {
                    if(caseTypes[y][x] == GameConstants.DungeonTile.boss) {
                        continue;
                    }
                    if(!canVisitChests && caseTypes[y][x] == GameConstants.DungeonTile.chest) {
                        continue;
                    }
                    if(visited[y][x]) {
                        continue;
                    }

                    let offsets = [
                        {x: 0, y: 1},
                        {x: 0, y: -1},
                        {x: 1, y: 0},
                        {x: -1, y: 0},
                    ];

                    for(const offset of offsets) {
                        let nextX = x + offset.x;
                        let nextY = y + offset.y;
                        if(nextX < 0 || nextX >= board[y].length) {
                            continue;
                        }
                        if(nextY < 0 || nextY >= board.length) {
                            continue;
                        }

                        if(visited[nextY][nextX]) {
                            DungeonRunner.map.moveToCoordinates(x, y);
                            return;
                        }
                    }
                }
            }

            canVisitChests = true;
            for(var y = 0 ; y < board.length ; y += 1) {
                for(var x = 0 ; x < board[y].length ; x += 1) {
                    if(caseTypes[y][x] == GameConstants.DungeonTile.boss) {
                        continue;
                    }
                    if(!canVisitChests && caseTypes[y][x] == GameConstants.DungeonTile.chest) {
                        continue;
                    }
                    if(visited[y][x]) {
                        continue;
                    }

                    let offsets = [
                        {x: 0, y: 1},
                        {x: 0, y: -1},
                        {x: 1, y: 0},
                        {x: -1, y: 0},
                    ];

                    for(const offset of offsets) {
                        let nextX = x + offset.x;
                        let nextY = y + offset.y;
                        if(nextX < 0 || nextX >= board[y].length) {
                            continue;
                        }
                        if(nextY < 0 || nextY >= board.length) {
                            continue;
                        }

                        if(visited[nextY][nextX]) {
                            DungeonRunner.map.moveToCoordinates(x, y);
                            return;
                        }
                    }
                }
            }
        }
    }
    
    static Breeding() {
        if(IA._HasEggItem() !== true) {
            return;
        }

        for(var i = 0 ; i < App.game.breeding.eggSlots ; i++) {
            let egg = App.game.breeding.eggList[i]();
            if(egg.progress() >= 100) {
                App.game.breeding.hatchPokemonEgg(i);
            }
        }
    
        if(IA.EnableHatchery !== true) {
            return;
        }

        if(App.game.party.hasMaxLevelPokemon() && App.game.breeding.hasFreeEggSlot()) {
            let arr = [...App.game.party.caughtPokemon.filter(p => !p.breeding && p.level == 100)];
            arr.sort((a, b) => {
                let regionA = PokemonHelper.calcNativeRegion(a.name)
                let regionB = PokemonHelper.calcNativeRegion(b.name)

                if(regionA != regionB) {
                    return regionB - regionA;
                }

                return IA._BreedingEfficiency(b) - IA._BreedingEfficiency(a);
            });
            for(const p of arr) {
                console.log("add", p);
                App.game.breeding.addPokemonToHatchery(p);
                break;
            }
        }
    }
    
    static PlayChampion() {
        let defeatGymQuest = App.game.quests.currentQuests()
                .filter(x => x instanceof DefeatGymQuest);

        if(IA.EnableChampionsLoop !== true && defeatGymQuest.length == 0) {
            return;
        }

        if (App.game.gameState !== GameConstants.GameState.town) {
            return;
        }

        if(player.town() instanceof DungeonTown) {
            return;
        }

        let availableGyms = player.town().content
            .filter(x => x instanceof Gym && x.isUnlocked())
            .sort((a, b) => a.clears() - b.clears());

        for(const quest of defeatGymQuest) {
            let gymName = quest.gymTown;

            for(const gym of availableGyms) {
                if(gym.town == gymName) {
                    gym.protectedOnclick();
                    return;
                }
            }
        }

        if(IA.EnableChampionsLoop !== true) {
            return;
        }

        for(const b of availableGyms) {
            if(b.clears() >= 1000 && IA.DisableChampionOnAchievementsCompleted) {
                return;
            }

            b.protectedOnclick();
            return;
        }
    }
   
    static StartDungeon() {
        let defeatDungeonQuest = App.game.quests.currentQuests()
                .filter(x => x instanceof DefeatDungeonQuest);

        if(IA.EnableDungeonsLoop !== true && defeatDungeonQuest.length == 0) {
            return;
        }

        if (App.game.gameState !== GameConstants.GameState.town) {
            return;
        }

        if(!(player.town() instanceof DungeonTown)) {
            return;
        }

        let dungeon = player.town().dungeon;
        if(dungeon.tokenCost > IA._CurrencyAmount(GameConstants.Currency.dungeonToken)){
            return;
        }

        for(const quest of defeatDungeonQuest) {
            if(dungeon.name == quest.dungeon) {
                DungeonRunner.initializeDungeon(dungeon);
                return;
            }
        }

        if(IA.EnableDungeonsLoop !== true) {
            return;
        }

        if(App.game.statistics.dungeonsCleared[GameConstants.getDungeonIndex(dungeon.name)]() >= 500 && IA.DisableDungeonOnAchievementsCompleted) {
            return;
        }

        DungeonRunner.initializeDungeon(dungeon);
    }

    static CompleteQuests() {
        for(const quest of App.game.quests.currentQuests()) {
            if(quest.isCompleted()) {
                App.game.quests.claimQuest(quest.index);
            }
        }
    }

    static RenewBerries() {
        if(IA.EnableBerries !== true) {
            return;
        }

        if(IA._HasFarmItem() !== true) {
            return;
        }

        // check if unlocked
        let availablePlots = App.game.farming.plotList.filter(x => x.isUnlocked);
        if(availablePlots.length <= 0) {
            return;
        }

        // clear all and check if there is any empty plots available
        App.game.farming.harvestAll();

        let emptyPlots = availablePlots.filter(x => x.isEmpty());
        if(emptyPlots.length <= 0) {
            return;
        }
    
        // unlock plots if possible
        let plotsToUnlock = App.game.farming.plotList
            .map((x, index) => { 
                return { 
                    index: index, 
                    plot: x,
                    pointCost: App.game.farming.plotFPCost(index),
                    berryCost: App.game.farming.plotBerryCost(index), // { type, amount }
                };
            })
            .filter(x => !x.plot.isUnlocked)
            .filter(x => App.game.farming.unlockedBerries[x.berryCost.type]() && App.game.farming.berryList[x.berryCost.type]() > 0)
            .sort((a, b) => a.pointCost - b.pointCost);

        let farmPoints = IA._CurrencyAmount(GameConstants.Currency.farmPoint);
        for(const plot of plotsToUnlock) {
            if(plot.pointCost > farmPoints) {
                continue;
            }
            
            // this >= is made to keep at least one of each berry
            if(plot.berryCost.amount >= App.game.farming.berryList[plot.berryCost.type]()) {
                continue;
            }

            farmPoints -= plot.pointCost;
            App.game.farming.unlockPlot(plot.index);
        }

        // plant berries for quests
        let berryQuests = App.game.quests.currentQuests()
                .filter(x => x instanceof HarvestBerriesQuest)
                .filter(x => App.game.farming.unlockedBerries[x.berryType]() && App.game.farming.berryList[x.berryType]() > 0);
        if(berryQuests.length > 0) {
            // console.log("quest plant: ", berryQuests[0].berryType);
            App.game.farming.plantAll(berryQuests[0].berryType);
        }

        // plant berries to unlock next plot in priority
        let plotsWithBerryToUnlock = plotsToUnlock
            .filter(x => !x.plot.isUnlocked)
            .filter(x => x.berryCost.amount >= App.game.farming.berryList[x.berryCost.type]());
        
        if(plotsWithBerryToUnlock.length > 0) {
            // console.log("plot requirement plant: ", plotsWithBerryToUnlock[0].berryCost.type);
            App.game.farming.plantAll(plotsWithBerryToUnlock[0].berryCost.type);
            return;
        }

        // replant berries
        let availableBerries = App.game.farming.berryData
            .filter(x => App.game.farming.unlockedBerries[x.type]() && App.game.farming.berryList[x.type]() > 0)
            .sort((a, b) => IA._FarmPointRate(b) - IA._FarmPointRate(a));

        let priorityReplantBerries = availableBerries.filter(x => App.game.farming.berryList[x.type]() < 25);

        if(priorityReplantBerries.length > 0) {
            // console.log("priority replant: ", priorityReplantBerries[0].type);
            App.game.farming.plantAll(priorityReplantBerries[0].type);
        }

        for(const berry of availableBerries) {
            // console.log("plant: ", berry);
            App.game.farming.plantAll(berry.type);
            break;
        }
    }

    static DigUnderground() {
        if(IA.EnableUnderground !== true) {
            return;
        }

        if(IA._HasUndergroundItem() !== true) {
            return;
        }

        if(App.game.underground.energy < 20) {
            return;
        }

        let rewardGrid = Mine.rewardGrid;

        for(var y = 0 ; y < rewardGrid.length ; y += 1) {
            for(var x = 0 ; x < rewardGrid[y].length ; x += 1) {               
                if(rewardGrid[y][x] !== 0) {
                    while(Mine.grid[y][x]() > 0 && App.game.underground.energy >= Underground.CHISEL_ENERGY) {
                        Mine.click(y, x);
                    }
                }

                if(App.game.underground.energy < Underground.CHISEL_ENERGY) {
                    return;
                }
            }
        }
    }

    static _BreedingEfficiency(p) {
        return ((p.baseAttack * (25.0 / 100) + p.proteinsUsed()) / pokemonMap[p.name].eggCycles)
    }

    static _FarmPointRate(b) {
        return b.farmValue / b.growthTime[3];
    }

    static _CurrencyAmount(currencyType) { // GameConstants.Currency.XXX
        return App.game.wallet.currencies[currencyType]();
    }

    static _HasKeyItem(keyItem) {
        return App.game.keyItems.hasKeyItem(keyItem);
    }

    static _HasUndergroundItem() {
        return IA._HasKeyItem(KeyItemType.Explorer_kit);
    }

    static _HasFarmItem() {
        return IA._HasKeyItem(KeyItemType.Wailmer_pail);
    }

    static _HasSafariItem() {
        return IA._HasKeyItem(KeyItemType.Safari_ticket);
    }

    static _HasEggItem() {
        return IA._HasKeyItem(KeyItemType.Mystery_egg);
    }
}

IA.start();