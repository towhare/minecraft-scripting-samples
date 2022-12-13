import { 
  world, 
  system, 
  BlockLocation, 
  MinecraftBlockTypes,
  PlayerInventoryComponentContainer,
  EntityInventoryComponent,
  InventoryComponentContainer,
  ItemType,
  EntityHealthComponent,
  MinecraftEffectTypes,
  MinecraftEntityTypes,
  Player,
  DynamicPropertiesDefinition,
  BlockRecordPlayerComponent,
  ItemStack,
  MinecraftItemTypes,
} from "@minecraft/server";
import Utilities from "./Utilities.js";
import { ActionFormData } from "@minecraft/server-ui"

const ARENA_X_SIZE = 30;
const ARENA_Z_SIZE = 30;
const ARENA_X_OFFSET = 0;
const ARENA_Y_OFFSET = -60;
const ARENA_Z_OFFSET = 0;
const START_TICK = 100;



// global variables
let curTick = 0;

let score = 0;
let cottaX = 0;
let cottaZ = 0;
let spawnCountdown = 1;

function initializeBreakTheTerracotta() {
  const overworld = world.getDimension("overworld");

  // catch in case we've already added this score before.
  try {
    overworld.runCommandAsync('scoreboard objectives add score dummy "Level"');
  } catch (e) {}

  // eliminate pesky nearby mobs
  try {
    overworld.runCommandAsync("kill @e[type=!player]");
  } catch (e) {}

  overworld.runCommandAsync("scoreboard objectives setdisplay sidebar score");

  overworld.runCommandAsync("give @p diamond_sword");
  overworld.runCommandAsync("give @p dirt 64");

  overworld.runCommandAsync("scoreboard players set @p score 0");

  world.say("BREAK THE TERRACOTTA");

  Utilities.fillBlock(
    MinecraftBlockTypes.air,
    ARENA_X_OFFSET - ARENA_X_SIZE / 2 + 1,
    ARENA_Y_OFFSET,
    ARENA_Z_OFFSET - ARENA_Z_SIZE / 2 + 1,
    ARENA_X_OFFSET + ARENA_X_SIZE / 2 - 1,
    ARENA_Y_OFFSET + 10,
    ARENA_Z_OFFSET + ARENA_Z_SIZE / 2 - 1
  );
  
  Utilities.fourWalls(
    MinecraftBlockTypes.cobblestone,
    ARENA_X_OFFSET - ARENA_X_SIZE / 2,
    ARENA_Y_OFFSET,
    ARENA_Z_OFFSET - ARENA_Z_SIZE / 2,
    ARENA_X_OFFSET + ARENA_X_SIZE / 2,
    ARENA_Y_OFFSET + 10,
    ARENA_Z_OFFSET + ARENA_Z_SIZE / 2
  );
  
  overworld.runCommandAsync("tp @p " + String(ARENA_X_OFFSET - 3) + " " + ARENA_Y_OFFSET + " " + String(ARENA_Z_OFFSET - 3));
}
addEventListener();
function addEventListener(){

  const overWorld = world.getDimension("overworld");
  

  
  world.events.worldInitialize.subscribe((e) => {
    // def player entity dynamic properties
    let def = new DynamicPropertiesDefinition();

    def.defineNumber("gold");
    world.say("?? define gold")
    // def.defineString("rpgRole", 16);
    // def.defineBoolean("rpgIsHero");

    e.propertyRegistry.registerEntityTypeDynamicProperties(def, MinecraftEntityTypes.player);


    let mobDefine = new DynamicPropertiesDefinition();
    mobDefine.defineNumber("maxGold");
    mobDefine.defineNumber("minGold");
    e.propertyRegistry.registerEntityTypeDynamicProperties( mobDefine, MinecraftEntityTypes.chicken );

    
  });

  const signal = world.events.beforeItemUse
  signal.subscribe((arg)=>{
    // 使用物品
    world.say('source:'+arg.source.typeId);
    world.say('item:'+arg.item.typeId);
    if( arg.item.typeId === MinecraftItemTypes.bone.id ) {
      world.say(`打开菜单`);

      const selections:Array<{
        name:string,
        price:number,
        type:ItemType
      }> = [
        {
          name:"金子",
          price:10,
          type:MinecraftItemTypes.goldIngot
        },
        {
          name:"钻石",
          price:50,
          type:MinecraftItemTypes.diamond
        },
        {
          name:"铁",
          price:8,
          type:MinecraftItemTypes.ironIngot
        },
        {
          name:"木头",
          price:1,
          type:MinecraftItemTypes.log
        }
      ]
      const form = new ActionFormData()
        .title("菜单")
        .body("购买");
      for( let item of selections ) {
        form.button(`${item.name} ${item.price}块`);
      }
      if( arg.source instanceof Player ) {
        const player:Player = arg.source;
        form.show(arg.source).then((result)=>{
          if( result.canceled ) {
            player.tell(`取消菜单`)
          } else if( typeof result.selection === 'number') {

            const gold = player.getDynamicProperty("gold");
            if(typeof gold === "number") {
              const selectedItem = selections[result.selection];
              if( gold > selectedItem.price ) {
                const currentGold = gold - selectedItem.price;
                
                const playerInventoryComponent = player.getComponent( EntityInventoryComponent.componentId );
                if( playerInventoryComponent instanceof EntityInventoryComponent ) {
                  player.setDynamicProperty("gold",currentGold);
                  playerInventoryComponent.container.addItem(
                    new ItemStack( selectedItem.type, 1,0 )
                  )
                  player.tell(`你成功购买一个${ selectedItem.name },花费 ${selectedItem.price}, 剩余金币：${currentGold}`)
                }
              } else {
                player.tell('你的钱不够')
              }
            }
          }
        }).catch( error =>{
          player.tell(`取消菜单`)
        })
      }
      
    }
  })

  const worldEntityHit = world.events.entityHit;
  
  worldEntityHit.subscribe((arg)=>{
    if( arg.entity instanceof Player ) {

      if( arg.hitBlock ) {

        world.say('点source'+arg.entity.typeId + ' hit' + arg.hitBlock.typeId);
        
      } else if( arg.hitEntity ) {
        
        const hitEntityHealthCom = arg.hitEntity.getComponent(EntityHealthComponent.componentId);
        if( hitEntityHealthCom instanceof EntityHealthComponent ) {
          
          // world.say('source'+ arg.entity.typeId + ' hit a entity:' + arg.hitEntity.typeId + ' current health :'+ hitEntityHealthCom.current );
          if( hitEntityHealthCom.current <=0){
            
            let playerGold = arg.entity.getDynamicProperty("gold");
            
            if( typeof playerGold ==='number' ) {
              let goldTake = ~ ~ (Math.random() * 4 + 1 );
              
              const currentGold =  playerGold + goldTake;
              arg.entity.setDynamicProperty("gold", currentGold);
              arg.entity.tell(`获得${goldTake}金币, 总共: ${ currentGold }`);
              
            } else {
              arg.entity.tell(` error no player gold `);
            }
            // overWorld.runCommandAsync("scoreboard players set @p score " + score);
          }
        }
      }
    }
    
  })

  const beforeChat = world.events.beforeChat;
  beforeChat.subscribe((bfc)=>{
    const message = bfc.message;
    bfc.sender.tell(`行我知道了你说的是 ${ message }`);
    const messageCmd = message.split(' ');

    bfc.sender.tell('messageCmd[0]'+messageCmd[0])
    if( messageCmd[0] === "给点" ) {
      
      const cpo = bfc.sender.getComponent(EntityInventoryComponent.componentId);
      if( cpo instanceof EntityInventoryComponent ) {
        if ( cpo.container instanceof PlayerInventoryComponentContainer ) {
          // get freee slot
          if( messageCmd[1] === "鸡肉" ) {
            try {
              cpo.container.addItem(new ItemStack(MinecraftItemTypes.chicken,50, 0 ))
              bfc.sender.tell(`行 给你 鸡肉50块`)
            } catch( error ) {
              bfc.sender.tell(`不行了`)
            }
          } else if ( messageCmd[1] === "钻石" ) {
            
            cpo.container.addItem( new ItemStack( MinecraftItemTypes.diamond, 1, 0 ));

            
          } else {
            bfc.sender.tell(`这个给不了`)
            bfc.cancel = true;
          }
        }
      }
      
    }
  })

  const afterChat = world.events.chat;
  afterChat.subscribe((afc)=>{
    const message = afc.message;
    afc.sender.tell(`你说 §4${message}§4 `)
  })
}

function clearScoreBoard(){
  const players = world.getPlayers();
  const allPlayers = Array.from( players );
  allPlayers.forEach((player,index)=>{
    player.scoreboard
  })
}

function gameTick() {
  try {
    if (curTick === START_TICK) {

    }

    curTick++;

    if (curTick > START_TICK && curTick % 20 === 0) {
      let overworld = world.getDimension("overworld");
  
      // no terracotta exists, and we're waiting to spawn a new one.
      if (spawnCountdown > 0) {
        spawnCountdown--;
  
        if (spawnCountdown <= 0) {

        }
      } else {

      }
    }

    let spawnInterval = Math.ceil(200 / ((score + 1) / 3));
    if (curTick > START_TICK && curTick % spawnInterval === 0) {
    }

    if (curTick > START_TICK && curTick % 29 === 0) {
      // addFuzzyLeaves();
    }
  } catch (e) {
    console.warn("Tick error: " + e);
  }

  system.run(gameTick);
}

system.run(gameTick);

function spawnNewTerracotta() {
  let overworld = world.getDimension("overworld");

  // create new terracotta
  cottaX = Math.floor(Math.random() * (ARENA_X_SIZE - 1)) - (ARENA_X_SIZE / 2 - 1);
  cottaZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 1)) - (ARENA_Z_SIZE / 2 - 1);

  world.say("Creating new terracotta!");
  overworld
    .getBlock(new BlockLocation(cottaX + ARENA_X_OFFSET, 1 + ARENA_Y_OFFSET, cottaZ + ARENA_Z_OFFSET))
    .setType(MinecraftBlockTypes.yellowGlazedTerracotta);

  
}

function checkForTerracotta() {
  let overworld = world.getDimension("overworld");
  overworld
  let block = overworld.getBlock(
    new BlockLocation(cottaX + ARENA_X_OFFSET, 1 + ARENA_Y_OFFSET, cottaZ + ARENA_Z_OFFSET)
  );

  if (block.type !== MinecraftBlockTypes.yellowGlazedTerracotta) {
    // we didn't find the terracotta! set a new spawn countdown
    score++;
    spawnCountdown = 2;
    cottaX = -1;
    overworld.runCommandAsync("scoreboard players set @p score " + score);
    world.say("You broke the terracotta! Creating new terracotta in a few seconds.");
    cottaZ = -1;
  }
}

function spawnMobs() {
  let overworld = world.getDimension("overworld");

  // spawn mobs = create 1-2 mobs
  let spawnMobCount = Math.floor(Math.random() * 2) + 1;

  for (let j = 0; j < spawnMobCount; j++) {
    let zombieX = Math.floor(Math.random() * (ARENA_X_SIZE - 2)) - ARENA_X_SIZE / 2;
    let zombieZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 2)) - ARENA_Z_SIZE / 2;

    overworld.spawnEntity(
      "minecraft:zombie",
      new BlockLocation(zombieX + ARENA_X_OFFSET, 1 + ARENA_Y_OFFSET, zombieZ + ARENA_Z_OFFSET)
    );
  }
}

function addFuzzyLeaves() {
  let overworld = world.getDimension("overworld");

  for (let i = 0; i < 10; i++) {
    const leafX = Math.floor(Math.random() * (ARENA_X_SIZE - 1)) - (ARENA_X_SIZE / 2 - 1);
    const leafY = Math.floor(Math.random() * 10);
    const leafZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 1)) - (ARENA_Z_SIZE / 2 - 1);

    overworld
      .getBlock(new BlockLocation(leafX + ARENA_X_OFFSET, leafY + ARENA_Y_OFFSET, leafZ + ARENA_Z_OFFSET))
      .setType(MinecraftBlockTypes.leaves);
  }
}