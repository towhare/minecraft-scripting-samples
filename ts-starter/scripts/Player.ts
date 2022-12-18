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
  MinecraftItemTypes,
  CommandResult
} from "@minecraft/server";
import { ActionFormData, ActionFormResponse, ModalFormData, MessageFormData  } from "@minecraft/server-ui";
export class PlayerI{
  player:Player;
  constructor(player:Player){
    this.player = player;
  }

  openMenu():Promise<ActionFormResponse>{
    return new Promise((resolve,reject)=>{
      const form = new ActionFormData();
      form.title("菜单")
      .body("用户菜单")
      .button("快速回家")
      .button("传送")
      .button("时间")
      .show( this.player ).then((response)=>{
        if(response.canceled){

        } else {
          if( response.selection === 0 ) {
            this.backToHome();
          } else if( response.selection === 1 ) {
            this.teleportToPlayer();
          } else if ( response.selection === 2) {
            this.check();
          }
        }
        resolve( response );
      }).catch( error =>{
        world.say( error.toString() );
      })
    })
  }

  backToHome(){
    this.player.tell(`你回家`);
    
  }

  teleportToPlayer(){
    this.player.tell(`传送到谁`);
    const players = world.getAllPlayers();
    
    let list:Array<{
      name:string,
      player:Player,
    }> = [];
    let nameList:Array<string> = [];
    for( let p of players ) {
      if( p !== this.player ) {
        nameList.push(p.name);
        list.push({
          name:p.name,
          player:p
        })
      }
    }
    if( nameList.length < 1){
      this.player.tell(`无其他玩家`);
    } else {
      const newModalFormData = new ModalFormData();
      newModalFormData.title(`传送到玩家`);
      newModalFormData.dropdown('到》？',nameList)
      .show(this.player).then((value)=>{
        if( !value.canceled) {
          if( value.formValues && value.formValues.length > 0){
            const index:number = value.formValues[0];
            const toPlayer = list[index].player;

            const xOffset = ( toPlayer.location.x - this.player.location.x );
            const yOffset = ( toPlayer.location.y - this.player.location.y );
            const zOffset = ( toPlayer.location.z - this.player.location.z );
            
            const distance = Math.sqrt(xOffset * xOffset + yOffset * yOffset + zOffset * zOffset );

            const moneycost = Math.round(distance /100)*2;
            
            const money = this.player.getDynamicProperty("money");

            if( typeof money === "number" ) {
              const confirmActionData = new MessageFormData();

              
              if( money > moneycost ) {
                const remainMoney = money - moneycost;
                confirmActionData.title(`花费${moneycost}传送到${toPlayer.name}?`)
                  .body(`将会花费${moneycost},并且只会剩${remainMoney}`)
                  .button1(`确定`)
                  .button2(`取消`)
                  .show(this.player).then(res=>{
                    this.player.tell(`你选择的是${res.selection}`)
                    if(!res.canceled && res.selection === 1) {
                      const startTime = world.getAbsoluteTime();
                      // confirm
                      const confirmAction = new MessageFormData();
                      confirmAction.title(`传送`)
                      .body(`玩家${this.player.name}想要传送过来，确定？`)
                      .button1("行")
                      .button2("不行")
                      .show(toPlayer).then((response)=>{
                        const timeAfterResponse = world.getAbsoluteTime();
                        const timeUsed = timeAfterResponse - startTime;

                        if( timeUsed > 1000 ) {
                          toPlayer.tell(`请求超时 不给传送`)
                          return;
                        } else {
                          if( response.selection === 1 ) {
                            this.player.setDynamicProperty("money",remainMoney);
        
                            this.player.teleport( toPlayer.location, toPlayer.dimension, 0, 0, false );
  
                            this.player.tell(`花费${moneycost}金币传送到${toPlayer.name}`);
                            this.updateStats();
                          } else {
                            this.player.tell(`${toPlayer.name}不让你传送`);
                          }
                        }
                        
                      })

                      
                    } else {
                      this.player.tell(`你取消了传送`)
                    }
                  })
                  
                

              } else {

                this.player.tell(`not enough money`)

              }
            }
          }
        }
      })
    }
  }

  updateStats(){
  const money = this.player.getDynamicProperty("money");
  const healthComp = this.player.getComponent(EntityHealthComponent.componentId);
  let health = 0;
  if (healthComp instanceof EntityHealthComponent) {
      health = healthComp.current;
  }
  const stats = `
  角角的服务器   
  名字:${this.player.name}
  §6金币§6:${money}
  `;
  this.player.onScreenDisplay.setTitle(stats);
  }

  check(){
    const abs = world.getAbsoluteTime();
    const time = world.getTime();
    this.player.tell(`abs ${abs} time: ${time}`)
  }

  checkDead():boolean{
    const health = this.player.getComponent(EntityHealthComponent.componentId);
    if( health instanceof EntityHealthComponent ) {
      if( health.current <=0 ) {
        return true;
      }
    }
    return false;
  }

  dropMoneyWhenDead(){
    const money = this.player.getDynamicProperty("money");
    if( typeof money === "number" ) {
      const loseMoney = 10 + Math.floor(money * 0.1);

      const currentMoney = Math.max( money - loseMoney, 0 );
      this.player.setDynamicProperty("money", currentMoney );
      this.updateStats();
      this.player.tell(`丢失${loseMoney}金币`);
    }
  }

  getMoney(money:number){
    const currentMoney = this.player.getDynamicProperty("money");
    if( typeof(currentMoney) === "number" ){
      this.player.setDynamicProperty("money", currentMoney + money );
      this.player.tell(`你获得了${money}金币`);
      this.updateStats();
    }
  }
}