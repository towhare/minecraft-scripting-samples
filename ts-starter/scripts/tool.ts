/** createa a user stats */
import { ActionFormData } from "@minecraft/server-ui";
import { EntityHealthComponent, Player, EntityInventoryComponent} from "@minecraft/server";
export function updateUserStats(player:Player) {
    const money = player.getDynamicProperty("money");
    const healthComp = player.getComponent(EntityHealthComponent.componentId);
    let health = 0;
    if (healthComp instanceof EntityHealthComponent) {
        health = healthComp.current;
    }
    const stats = `
  角角的服务器   
  名字: ${player.name}
  金币：${money}
  生命值：${health}
  `;
    player.onScreenDisplay.setTitle(stats);
}

/** get a random number from min to max */
export function random(min:number, max:number, int:boolean = true):number{
  let value = ((max-min)*Math.random() + min);
  if( int ) {
    return Math.round(value);
  } else {
    return value;
  }
}

export function checkHas(inv:EntityInventoryComponent, typeId:string):boolean{
  for( let i = 0; i < inv.container.size; i++ ) {
    const currentItem = inv.container.getItem( i );
    if( currentItem && currentItem.typeId === typeId ) {
      return true;
    }
  }
  return false;
}

export async function openMenu(player:Player) {
  const newFormdata = new ActionFormData();
    newFormdata.button("快速回城");
    newFormdata.button("传送");
    newFormdata.button("检查");
    const result = await newFormdata.show(player);
    if(result.selection){
      player.tell(`U select ${result.selection}`)
    } else{
      player.tell(`没有选择任何东西`)
    }
}