/** createa a user stats */
import { EntityHealthComponent, Player} from "@minecraft/server";
export function updateUserStats(player:Player) {
    const money = player.getDynamicProperty("money");
    const healthComp = player.getComponent(EntityHealthComponent.componentId);
    let health = 0;
    if (healthComp instanceof EntityHealthComponent) {
        health = healthComp.current;
    }
    const stats = `   角角的服务器       
  名字: ${player.name}
  金币：${money}
  生命值：${health}
  `;
    player.onScreenDisplay.setTitle(stats);
}

//# sourceMappingURL=../../_cottaDebug/userStats.js.map
