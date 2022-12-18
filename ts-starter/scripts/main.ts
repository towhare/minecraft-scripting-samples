import { 
  world, 
  system,
  WorldInitializeEvent,
  DynamicPropertiesDefinition,
  MinecraftEntityTypes,
  Player,
  EntityHealthComponent,
  EntityInventoryComponent,
  ItemStack,
  MinecraftItemTypes
} from "@minecraft/server";
import { 
  updateUserStats, 
  random,
  checkHas,
  openMenu
}from "./tool";
import { ActionFormData } from "@minecraft/server-ui";
import Log from "./Log.js";
import { PlayerI } from './Player';

let tickIndex = 0;

let playerGroup:Array<PlayerI> = [ ];

const worldsub = (e:WorldInitializeEvent)=>{
  try{
    let def = new DynamicPropertiesDefinition();
    def.defineNumber("money");
    e.propertyRegistry.registerEntityTypeDynamicProperties( def, MinecraftEntityTypes.player )
  } catch(error:any){
    Log.debug(error.toString())
  }
}

function findPlayerI(player:Player):PlayerI|null{
  for( let playerI of playerGroup ) {
    if( playerI.player.id === player.id ) {
      return playerI;
    }
  }
  return null;
}

function removePlayerIByName(playerName:string){
  let removeIndex = -1 ;
  for( let i = 0; i < playerGroup.length; i++ ) {
    const p = playerGroup[i];
    if( p.player.name === playerName ){
      removeIndex = 0;
    }
  }
  if( removeIndex >-1 ) {
    playerGroup.splice( removeIndex, 1 );
  }
}

world.events.playerJoin.subscribe((e)=>{
  // check player got the
  const playerMoney = e.player.getDynamicProperty("money");
  if( playerMoney === undefined ){
    e.player.setDynamicProperty("money",0)
    updateUserStats(e.player);
  } else {
    updateUserStats(e.player);
  }
  const newPlayI = new PlayerI( e.player );
  playerGroup.push(newPlayI);

  // give it a clock ?
  const inv = e.player.getComponent(EntityInventoryComponent.componentId);
  if( inv instanceof EntityInventoryComponent ) {
    //check got a clock or not
    if( checkHas( inv, MinecraftItemTypes.clock.id ) ) {

    } else {
      if( inv.container.emptySlotsCount >=1){
        const clock = new ItemStack(MinecraftItemTypes.clock,1);
        clock.setLore([
          '丢失的话重进可以获得'
        ]);
        clock.nameTag = "钟 右键使用菜单";
        inv.container.addItem( clock );
      }
    }
  }
});

world.events.playerLeave.subscribe((e)=>{
  removePlayerIByName(e.playerName);
})

world.events.beforeItemUse.subscribe((e)=>{

  if( e.source instanceof Player ) {

    switch( e.item.typeId ){
      case MinecraftItemTypes.clock.id:
        // open menu
        // openMenu(e.source);
        const theP = findPlayerI(e.source);
        if( theP ) {
          theP.openMenu();
        }
        break;
      default:
        break;
    }
  }
})



world.events.dataDrivenEntityTriggerEvent.subscribe((e)=>{
  if( e.entity instanceof Player ) {
    e.entity.tell(`your data is changed`)
  }
})

world.events.worldInitialize.subscribe(worldsub);

world.events.beforeChat.subscribe((e)=>{
  if( e.message === "给点钱" ) {
    const p = findPlayerI(e.sender);
    p?.getMoney(200)
  }
})

world.events.entityHurt.subscribe((e)=>{
  if( e.damagingEntity instanceof Player ) {
    if( e.hurtEntity ){
      const health = e.hurtEntity.getComponent( EntityHealthComponent.componentId );
      if( health instanceof EntityHealthComponent ) {
        if( health.current <=0 ) {
          // 
          const money = e.damagingEntity.getDynamicProperty("money");
          if( typeof money === "number" ) {
            const moneyGet = random(2,4);
            const p = findPlayerI(e.damagingEntity);
            if( p ) {
              p.getMoney( moneyGet );
            }
            
          }
        }
      }
    }
  } 
  if( e.hurtEntity instanceof Player ) {
    const p = findPlayerI(e.hurtEntity);
    if( p && p.checkDead() ) {
      p.dropMoneyWhenDead();
    }
  }
})

world.events.beforeItemUse.subscribe(e=>{
  
})

function mainTick() {
  try {
    tickIndex++;

    if (tickIndex === 100) {
      world.getDimension("overworld").runCommandAsync("say Hello starter!");
      
    }
  } catch (e) {
    console.warn("Script error: " + e);
  }

  system.run(mainTick);
}
system.run(mainTick);
