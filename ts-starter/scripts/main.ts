import { 
  world, 
  system,
  WorldInitializeEvent,
  DynamicPropertiesDefinition,
  MinecraftEntityTypes,
  Player
} from "@minecraft/server";
import { updateUserStats }from "./tool";
import Log from "./Log.js";

let tickIndex = 0;
const worldsub = (e:WorldInitializeEvent)=>{
  try{
    let def = new DynamicPropertiesDefinition();
    def.defineNumber("money");
    e.propertyRegistry.registerEntityTypeDynamicProperties( def, MinecraftEntityTypes.player )
  } catch(error:any){
    Log.debug(error.toString())
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
})

world.events.dataDrivenEntityTriggerEvent.subscribe((e)=>{
  if( e.entity instanceof Player ) {
    e.entity.tell(`your data is changed`)
  }
})

world.events.worldInitialize.subscribe(worldsub);

world.events.beforeChat.subscribe((e)=>{
  if(e.message === "check"){
    
  }
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
