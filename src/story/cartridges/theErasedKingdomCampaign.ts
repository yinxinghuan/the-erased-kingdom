import type { DemoTurn, Locale, SceneImageSubject } from '../types'

function turn(
  locale: Locale,
  matchZh: string[],
  matchEn: string[],
  imagePrompt: string,
  imageSubject: SceneImageSubject,
  contentZh: string,
  contentEn: string,
): DemoTurn {
  return {
    match: locale === 'zh' ? matchZh : matchEn,
    imagePrompt,
    imageSubject,
    content: locale === 'zh' ? contentZh : contentEn,
  }
}

export function buildErasedKingdomCampaign(locale: Locale): DemoTurn[] {
  return [
    turn(locale, ['钟市', '摊主'], ['Bell Market', 'vendors'],
      'Bell Market layered streets at dusk, one market stall and its owner fading while a brass debt bell keeps ringing, courier with Mara and Toma arriving, cinematic grounded high fantasy, 4:5 portrait, no text, no UI', 'player',
      `钟市的铜钟还在替一名欠债摊主报时，摊主本人却从布棚下逐寸褪去。邻居记得她每天给码头工人留热汤，债簿只记得她欠了十二枚银币。
[map_update: new_location="钟市" connected_to="古林" detail="层叠市场仍记录债务，却让欠债者与摊位一起褪色" lore="法律保存债权，却没有登记一个人对邻里的价值" facts="欠债摊主正在消失|铜钟仍自动追债"]
[character_update: character_id="sera-peddler" character="塞拉" role="被删物品商人" detail="用彩线给无主物品标记最后一位可靠保管者" lore="她相信保管必须留下来源，购买不等于抹掉旧主人" vitality="70" stress="39" skills="溯源: 4|交易: 4"]
[state: value="在钟市证明一个人的价值不只等于债务"]
塞拉把一束不同颜色的线递给你：每一根都连着一个仍记得摊主的人。
[choices: "追上正在消失的欠债摊主"|"检查只记债务的铜钟"|"请塞拉展示被删物品的来源"]`,
      `Bell Market's brass bell still calls the hour for an indebted vendor while the vendor herself fades beneath the awning. Neighbours remember the hot soup she kept for dockworkers; the debt book remembers only twelve silver pieces.
[map_update: new_location="Bell Market" connected_to="Oldwood" detail="A layered market preserves debts while debtors and stalls fade" lore="The law records claims but not a person's value to neighbours" facts="An indebted vendor is fading|The brass bell still collects"]
[character_update: character_id="sera-peddler" character="Sera" role="Dealer in erased objects" detail="Marks ownerless objects with coloured threads leading to their last reliable keepers" lore="She believes custody must preserve provenance; purchase does not erase an earlier owner" vitality="70" stress="39" skills="Provenance: 4|Trade: 4"]
[state: value="Prove in Bell Market that a person's value is more than debt"]
Sera hands you a bundle of coloured thread. Each strand leads to someone who still remembers the vendor.
[choices: "Catch the indebted vendor before she fades"|"Inspect the brass bell that remembers only debt"|"Ask Sera to show the provenance of erased goods"]`),

    turn(locale, ['追上正在消失', '只记债务', '展示被删物品'], ['Catch the indebted', 'brass bell', 'provenance of erased'],
      'close street-level investigation in Bell Market, neighbours holding coloured provenance threads around a fading soup vendor while Sera opens a debt bell mechanism, courier and Mara comparing human testimony with metal records, cinematic fantasy, 4:5 portrait, no text, no UI', 'others',
      `你们把彩线系在汤勺、旧围裙和七个人的手腕上。铜钟每响一次，摊主的债就更清楚，她的脸却更模糊；塞拉拆开钟壳，发现偿债记录被人整页割走。
[skill_check: skill="追索物品来源" dc="12" rolls="13" modifier="2" total="15" result="success"]
[fact: id="bell-market-debt-page-cut" value="true"]
市场执役带着封条赶来。要让摊主留下，你必须决定什么样的记录能与债簿抗衡。
[choices: "让每位邻居为摊主的劳动作证"|"用交易账和铜钟证明债已偿还"|"把摊主名字写入社区共同保管册"]`,
      `You tie the threads to a soup ladle, an old apron and seven neighbours' wrists. Each bell strike sharpens the debt and blurs the vendor's face. Sera opens the mechanism and finds the repayment page cut cleanly away.
[skill_check: skill="Trace an object's provenance" dc="12" rolls="13" modifier="2" total="15" result="success"]
[fact: id="bell-market-debt-page-cut" value="true"]
Market bailiffs arrive with sealing wax. To keep the vendor present, you must decide what record can stand against the debt book.
[choices: "Let every neighbour testify to the vendor's work"|"Use trade ledgers and the bell to prove repayment"|"Enter the vendor in a community custody register"]`),

    turn(locale, ['每位邻居', '劳动作证'], ['every neighbour', 'vendor work'],
      'Bell Market neighbours forming a witness circle around a restored soup stall, each holding a coloured thread while a royal bailiff lowers his seal, Sera and Mara recording testimony, emotional grounded fantasy, 4:5 portrait, no text, no UI', 'others',
      `七个人说出的不是赞美，而是可核对的日常：谁在暴雨夜喝过汤，谁替她修过棚，谁看见她交清最后一枚银币。摊主的脸从这些互相独立的记忆里重新长回来。
[fact: id="bell-market-resolution" value="neighbour-witness"]
[fact: id="bell-market-witness-page" value="true"]
[inventory: action="add" item_id="provenance-thread" item="七色溯源线" count="1" rarity="rare" detail="七根线分别连向一位独立见证人，线结记录物品最后一次可信交接" effect="可核验一件被删物品的保管链；若所有见证人离开或说法矛盾，线会松开" lore="塞拉在钟市用邻里证词救回汤摊后交给玩家" metrics="独立见证: 7|已核物品: 1" image_prompt="seven coloured provenance threads tied around a small brass spool and worn soup token, dark cloth, grounded fantasy artifact, no people, no text, square"]
[party_change: character_id="sera-peddler" character="塞拉" change="add" role="被删物品商人" detail="决定带着溯源线同行，让每件被恢复的东西都保留旧主人" lore="钟市的见证页证明保管关系也是事实" vitality="70" stress="31" skills="溯源: 4|交易: 4"]
[session_end: reason="钟市见证页完成。摊主因邻里见证留下，但社区必须持续公开核验。"]
[choices: "前往红堡调查两段战争历史"|"去灯塔海岸寻找不存在的岛"|"回访古林或钟市处理支线"]`,
      `Seven people give verifiable ordinary accounts rather than praise: who drank soup in the storm, who repaired the awning, who watched her pay the last coin. The vendor's face grows back through independent memories.
[fact: id="bell-market-resolution" value="neighbour-witness"]
[fact: id="bell-market-witness-page" value="true"]
[inventory: action="add" item_id="provenance-thread" item="Seven-colour Provenance Thread" count="1" rarity="rare" detail="Seven strands each lead to an independent witness; knots record the last credible transfer of an object" effect="Verifies one erased object's chain of custody; the knot loosens if all witnesses leave or contradict each other" lore="Sera entrusted it to the player after neighbour testimony restored the soup stall" metrics="Independent witnesses: 7|Objects verified: 1" image_prompt="seven coloured provenance threads tied around a small brass spool and worn soup token, dark cloth, grounded fantasy artifact, no people, no text, square"]
[party_change: character_id="sera-peddler" character="Sera" change="add" role="Dealer in erased objects" detail="Travels with the provenance thread so restored objects keep their previous owners" lore="Bell Market's witness page proves custody is also a fact" vitality="70" stress="31" skills="Provenance: 4|Trade: 4"]
[session_end: reason="Bell Market witness page complete. Neighbour testimony keeps the vendor present, but the community must keep verifying it openly."]
[choices: "Travel to Red Bastion and investigate two war histories"|"Go to Lantern Coast after the island that does not exist"|"Return to Oldwood or Bell Market for a side path"]`),

    turn(locale, ['交易账', '债已偿还'], ['trade ledgers', 'prove repayment'],
      'Bell Market brass debt bell opened on a public table, missing repayment gear replaced by witness-marked coins as a fading vendor becomes solid, Sera confronting royal bailiffs, grounded fantasy, 4:5 portrait, no text, no UI', 'others',
      `塞拉让每枚旧钱币沿溯源线回到交付者。七笔独立交易拼出被割走的偿债页，铜钟第一次在没有欠款时安静下来。
[fact: id="bell-market-resolution" value="reconstructed-repayment"]
[fact: id="bell-market-witness-page" value="true"]
[inventory: action="add" item_id="provenance-thread" item="七色溯源线" count="1" rarity="rare" detail="用不同线结记录可信交接的黄铜线轴" effect="可重建一件物品最近七次交接；无法证明没有见证的交易" lore="由钟市七笔偿债交易校准" metrics="可追溯交接: 7|缺口: 无见证交易" image_prompt="seven coloured provenance threads on a brass spool beside worn coins, grounded fantasy artifact, no people, no text, square"]
[party_change: character_id="sera-peddler" character="塞拉" change="add" role="被删物品商人" detail="带着重建的偿债链同行" lore="她看见所有权记录也可以被普通人纠错" vitality="70" stress="32" skills="溯源: 4|交易: 4"]
[session_end: reason="钟市见证页完成。被割走的偿债记录已重建，铜钟今后必须接受公开复核。"]
[choices: "前往红堡调查两段战争历史"|"去灯塔海岸寻找不存在的岛"|"回访古林或钟市处理支线"]`,
      `Sera walks each old coin back along its provenance thread. Seven independent trades reconstruct the cut repayment page, and the bell falls silent for the first time when nothing is owed.
[fact: id="bell-market-resolution" value="reconstructed-repayment"]
[fact: id="bell-market-witness-page" value="true"]
[inventory: action="add" item_id="provenance-thread" item="Seven-colour Provenance Thread" count="1" rarity="rare" detail="A brass spool whose knots record credible transfers" effect="Reconstructs an object's last seven transfers; it cannot prove an exchange without witnesses" lore="Calibrated against seven Bell Market repayments" metrics="Traceable transfers: 7|Gap: unwitnessed trade" image_prompt="seven coloured provenance threads on a brass spool beside worn coins, grounded fantasy artifact, no people, no text, square"]
[party_change: character_id="sera-peddler" character="Sera" change="add" role="Dealer in erased objects" detail="Travels with the reconstructed repayment chain" lore="She has seen ordinary people correct an ownership record" vitality="70" stress="32" skills="Provenance: 4|Trade: 4"]
[session_end: reason="Bell Market witness page complete. The missing repayment record is rebuilt, and the bell must now accept public review."]
[choices: "Travel to Red Bastion and investigate two war histories"|"Go to Lantern Coast after the island that does not exist"|"Return to Oldwood or Bell Market for a side path"]`),

    turn(locale, ['社区共同保管册'], ['community custody register'],
      'Bell Market residents raising a shared custody ledger beneath layered awnings as a restored vendor serves soup, Sera adds coloured threads and royal bailiffs watch without control, grounded high fantasy, 4:5 portrait, no text, no UI', 'others',
      `你没有删掉债，也没有让一份账替摊主决定全部价值。摊主、债主与七位邻居共同签下保管册：债继续存在，但任何删除必须让被登记的人到场申辩。
[fact: id="bell-market-resolution" value="community-custody"]
[fact: id="bell-market-witness-page" value="true"]
[inventory: action="add" item_id="provenance-thread" item="七色溯源线" count="1" rarity="rare" detail="连向七位共同保管人的彩线线轴" effect="让一件物品的保管权由多位见证人共同维持；协商较慢" lore="钟市第一本共同保管册的实体索引" metrics="保管人: 7|决议速度: 慢" image_prompt="seven coloured provenance threads tied to a brass communal seal, grounded fantasy artifact, no people, no text, square"]
[party_change: character_id="sera-peddler" character="塞拉" change="add" role="被删物品商人" detail="带着共同保管册的线轴同行" lore="她开始把保管看作关系，而非单一占有" vitality="70" stress="30" skills="溯源: 4|交易: 4"]
[session_end: reason="钟市见证页完成。共同保管册保住摊主，也让每次裁决变得更慢。"]
[choices: "前往红堡调查两段战争历史"|"去灯塔海岸寻找不存在的岛"|"回访古林或钟市处理支线"]`,
      `You erase neither the debt nor the vendor beneath one account. Vendor, creditor and seven neighbours sign a custody register: the debt remains, but no erasure can happen without the registered person present to appeal.
[fact: id="bell-market-resolution" value="community-custody"]
[fact: id="bell-market-witness-page" value="true"]
[inventory: action="add" item_id="provenance-thread" item="Seven-colour Provenance Thread" count="1" rarity="rare" detail="A spool leading to seven joint custodians" effect="Lets several witnesses maintain custody of one object; agreement is slower" lore="The physical index of Bell Market's first community custody register" metrics="Custodians: 7|Decision speed: slow" image_prompt="seven coloured provenance threads tied to a brass communal seal, grounded fantasy artifact, no people, no text, square"]
[party_change: character_id="sera-peddler" character="Sera" change="add" role="Dealer in erased objects" detail="Travels with the communal register spool" lore="She now treats custody as a relationship rather than sole possession" vitality="70" stress="30" skills="Provenance: 4|Trade: 4"]
[session_end: reason="Bell Market witness page complete. The communal register saves the vendor and makes every ruling slower."]
[choices: "Travel to Red Bastion and investigate two war histories"|"Go to Lantern Coast after the island that does not exist"|"Return to Oldwood or Bell Market for a side path"]`),

    turn(locale, ['红堡', '战争历史'], ['Red Bastion', 'war histories'],
      'Red Bastion border bridge splitting toward two incompatible battlefields, wounded civilians on both banks, Oren standing between royal banners and burned village tokens as courier party arrives, cinematic grounded fantasy, 4:5 portrait, no text, no UI', 'player',
      `红堡的同一座桥同时通向庆功队伍和烧毁的村庄。皇家名单称奥伦的旧部救下三百人；桥下找到的焦黑军牌却属于被他们驱逐的村民。
[map_update: new_location="红堡边境" connected_to="钟市" detail="同一座桥被英雄史与纵火证词拉向两个现实" lore="两份历史都有活人和实物，任何一份被抹掉都会再次伤害人" facts="桥出现双重出口|奥伦认出旧军牌"]
[state: value="让红堡两段有证据的历史在不互相吞噬的情况下被看见"]
奥伦没有拔剑。他先把自己的军章放在地上，承认自己只记得救援，不记得火从何处烧起。
[choices: "先救桥两端同时受伤的人"|"对照两份名单和焦黑军牌"|"要求奥伦亲自走过两段历史"]`,
      `The same Red Bastion bridge leads at once to a victory procession and a burned village. The royal roll says Oren's former unit saved three hundred; charred service tokens beneath the bridge belong to villagers they drove away.
[map_update: new_location="Red Bastion" connected_to="Bell Market" detail="One bridge is pulled toward a heroic history and an arson testimony" lore="Both histories have living witnesses and objects; erasing either harms people again" facts="The bridge has two exits|Oren recognizes an old service token"]
[state: value="Let Red Bastion's two evidenced histories be seen without consuming each other"]
Oren does not draw his sword. He places his own medal on the road and admits he remembers the rescue but not where the fire began.
[choices: "First rescue the wounded on both ends of the bridge"|"Compare both rolls with the charred service tokens"|"Make Oren walk through both histories himself"]`),

    turn(locale, ['桥两端', '焦黑军牌', '亲自走过'], ['both ends of the bridge', 'charred service', 'walk through both histories'],
      'Oren kneeling beside a charred child-sized service token while survivors from two histories face each other across a divided bridge, courier Mara and Sera holding evidence, cinematic emotional fantasy, 4:5 portrait, no text, no UI', 'others',
      `桥的两端都有人认出同一枚军牌：一边记得士兵把孩子抱出火场，另一边记得那支军队先封住了井。奥伦终于想起自己执行过“清空道路”的命令。
[skill_check: skill="承受矛盾证词" dc="14" rolls="14" modifier="2" total="16" result="success"]
[fact: id="oren-war-truth-known" value="true"]
[fact: id="paired-conflicts-one" value="true"]
恢复事实不是挑一个更舒服的版本。你必须决定这座桥怎样让两边的人继续生活。
[choices: "让两段历史在桥的两端有限共存"|"公开纵火证据并保留救援者姓名"|"拆掉两面军旗，把桥改成无名救援路"]`,
      `People at both ends recognize the same service token: one side remembers soldiers carrying a child from the flames; the other remembers that unit sealing the well first. Oren finally recalls obeying an order to "clear the road."
[skill_check: skill="Endure conflicting testimony" dc="14" rolls="14" modifier="2" total="16" result="success"]
[fact: id="oren-war-truth-known" value="true"]
[fact: id="paired-conflicts-one" value="true"]
Restoring truth cannot mean choosing the more comfortable version. You must decide how this bridge lets both sides keep living.
[choices: "Let both histories coexist within opposite ends of the bridge"|"Publish the arson evidence while preserving rescuers' names"|"Remove both war flags and make the bridge an unnamed rescue road"]`),

    turn(locale, ['有限共存'], ['coexist within'],
      'Red Bastion bridge dividing into two stable dawn approaches with witnesses crossing at a shared center, Oren guarding the boundary without a banner, grounded high fantasy, 4:5 portrait, no text, no UI', 'others',
      `玛拉把桥中央画成共同核验区，两端保留各自有证据的历史。人们经过时必须说明自己从哪一段记忆而来，不能再把另一端叫作谎言。
[fact: id="red-bastion-resolution" value="bounded-overlap"]
[fact: id="red-bastion-witness-page" value="true"]
[fact: id="paired-conflicts-two" value="true"]
[party_change: character_id="oren-knight" character="奥伦" change="add" role="皇家骑士与红堡证人" detail="承认自己既参与救援也执行过封井命令，决定护送证据去王都" lore="他的忠诚转向可被公开核验的秩序" vitality="84" stress="61" skills="守护: 4|统率: 3"]
[session_end: reason="红堡见证页完成。两段历史有限共存，桥的地理从此不再简单。"]
[choices: "去灯塔海岸寻找不存在的岛"|"等待归名之夜并返回苹果谷"|"回访红堡另一段历史"]`,
      `Mara makes the bridge centre a joint verification zone while each end keeps its evidenced history. Travellers must say which memory they came from and can no longer call the other end a lie.
[fact: id="red-bastion-resolution" value="bounded-overlap"]
[fact: id="red-bastion-witness-page" value="true"]
[fact: id="paired-conflicts-two" value="true"]
[party_change: character_id="oren-knight" character="Oren" change="add" role="Royal knight and Red Bastion witness" detail="Admits he both rescued civilians and obeyed the order sealing their well, and will escort the evidence to the capital" lore="His loyalty turns toward order that can be publicly verified" vitality="84" stress="61" skills="Guarding: 4|Command: 3"]
[session_end: reason="Red Bastion witness page complete. Both histories coexist within bounds, and the bridge's geography will never be simple again."]
[choices: "Go to Lantern Coast after the island that does not exist"|"Wait for the Night of Returned Names and return to Apple Vale"|"Revisit the other history at Red Bastion"]`),

    turn(locale, ['公开纵火', '保留救援'], ['Publish the arson', 'preserving rescuers'],
      'Red Bastion public memorial showing charred tokens beside rescue ropes, Oren reading testimony to soldiers and villagers while both names remain present, grounded high fantasy, 4:5 portrait, no readable text, no UI', 'others',
      `奥伦亲口公布封井与纵火命令，同时逐一说出违令救人的士兵。英雄名册没有被烧掉，但它旁边永远摆着焦黑军牌和幸存者证词。
[fact: id="red-bastion-resolution" value="public-dual-record"]
[fact: id="red-bastion-witness-page" value="true"]
[fact: id="paired-conflicts-two" value="true"]
[party_change: character_id="oren-knight" character="奥伦" change="add" role="皇家骑士与红堡证人" detail="公开承认旧部的救援与暴行，护送完整记录去王都" lore="他不再用服从替代秩序" vitality="84" stress="58" skills="守护: 4|统率: 3"]
[session_end: reason="红堡见证页完成。完整军史公开，救援与罪责都不能再被单独删除。"]
[choices: "去灯塔海岸寻找不存在的岛"|"等待归名之夜并返回苹果谷"|"回访红堡另一段历史"]`,
      `Oren publicly reads the orders sealing the well and starting the fire, then names every soldier who disobeyed to rescue people. The roll of heroes remains, but charred tokens and survivor testimony stay beside it forever.
[fact: id="red-bastion-resolution" value="public-dual-record"]
[fact: id="red-bastion-witness-page" value="true"]
[fact: id="paired-conflicts-two" value="true"]
[party_change: character_id="oren-knight" character="Oren" change="add" role="Royal knight and Red Bastion witness" detail="Publicly admits both rescue and atrocity, escorting the complete record to the capital" lore="He no longer substitutes obedience for order" vitality="84" stress="58" skills="Guarding: 4|Command: 3"]
[session_end: reason="Red Bastion witness page complete. The full military record is public, and neither rescue nor guilt can be erased alone."]
[choices: "Go to Lantern Coast after the island that does not exist"|"Wait for the Night of Returned Names and return to Apple Vale"|"Revisit the other history at Red Bastion"]`),

    turn(locale, ['无名救援路', '拆掉两面军旗'], ['unnamed rescue road', 'Remove both war flags'],
      'civilians from opposing histories dismantling two war banners over Red Bastion bridge and replacing them with rescue ropes and lamps, Oren helping without insignia, grounded fantasy, 4:5 portrait, no text, no UI', 'others',
      `两边幸存者共同拆掉军旗，只保留绳结、担架痕和失踪者名单。奥伦摘下军章加入修桥；这条路不再替任何军队证明荣耀，只证明有人互相救过。
[fact: id="red-bastion-resolution" value="rescue-road"]
[fact: id="red-bastion-witness-page" value="true"]
[fact: id="safe-routes-two" value="true"]
[party_change: character_id="oren-knight" character="奥伦" change="add" role="无章护路骑士" detail="摘下军章，护送两边幸存者共同维护救援路" lore="他接受失去荣耀叙事是承认真相的代价" vitality="84" stress="55" skills="守护: 4|统率: 3"]
[session_end: reason="红堡见证页完成。无名救援路保住通行，却放弃了一份简单的英雄故事。"]
[choices: "去灯塔海岸寻找不存在的岛"|"等待归名之夜并返回苹果谷"|"回访红堡另一段历史"]`,
      `Survivors from both sides remove the war flags and retain only rescue knots, stretcher marks and names of the missing. Oren removes his medal and repairs the bridge. The road proves no army's glory, only that people once saved each other.
[fact: id="red-bastion-resolution" value="rescue-road"]
[fact: id="red-bastion-witness-page" value="true"]
[fact: id="safe-routes-two" value="true"]
[party_change: character_id="oren-knight" character="Oren" change="add" role="Unbadged road guardian" detail="Removed his medal and escorts survivors maintaining the shared rescue road" lore="He accepts losing a heroic story as the price of admitting truth" vitality="84" stress="55" skills="Guarding: 4|Command: 3"]
[session_end: reason="Red Bastion witness page complete. The unnamed rescue road preserves passage at the cost of a simple heroic story."]
[choices: "Go to Lantern Coast after the island that does not exist"|"Wait for the Night of Returned Names and return to Apple Vale"|"Revisit the other history at Red Bastion"]`),

    turn(locale, ['灯塔海岸', '不存在的岛'], ['Lantern Coast', 'island that does not exist'],
      'stormy Lantern Coast with a ferry turning toward an ivory gap at sea, passengers forgetting their destination while an old lighthouse flashes toward nothing, courier party on wet pier, cinematic fantasy, 4:5 portrait, no text, no UI', 'player',
      `灯塔每晚照向一片官方地图上的空海。渡船仍按旧习惯转舵，乘客却会在靠岸前忘记自己为什么出发；只有船舷上一枚磨损的岛钟图案没有褪色。
[map_update: new_location="灯塔海岸" connected_to="红堡边境" detail="旧渡船仍驶向一座被删除的避难岛，乘客在雾里遗忘目的" lore="一个没有合法名字的家仍被船、物件与归乡习惯记住" facts="渡船保留旧航线|灯塔照向空海"]
[state: value="找到被删除的岛，并让归乡者保有抵达的理由"]
塞拉认出岛钟图案来自一批从未进入王室仓单的救援物资。
[choices: "登上渡船保护逐渐遗忘的乘客"|"沿船身磨痕反推旧航线"|"用灯塔向页边中的岛民发出信号"]`,
      `Each night the lighthouse points into blank sea on every official chart. The ferry still turns by old habit, but passengers forget why they left before landfall. Only a worn island-bell mark on the rail remains.
[map_update: new_location="Lantern Coast" connected_to="Red Bastion" detail="An old ferry still sails toward an erased refuge island while passengers forget their destination in the fog" lore="A home without a legal name is remembered by boats, objects and habits of return" facts="The ferry retains its old route|The lighthouse shines into blank sea"]
[state: value="Find the erased island and let returning people keep their reason to arrive"]
Sera recognizes the island-bell mark from relief supplies that never entered a royal warehouse roll.
[choices: "Board the ferry and protect passengers as memory fades"|"Reconstruct the old route from wear on the hull"|"Signal the islanders in the Margins from the lighthouse"]`),

    turn(locale, ['保护逐渐遗忘', '船身磨痕', '页边中的岛民'], ['protect passengers', 'wear on the hull', 'Signal the islanders'],
      'ferry inside luminous sea fog, Mara measuring worn rail angles while Sera ties provenance thread and passengers repeat the name of home, distant island bell answering, grounded cinematic fantasy, 4:5 portrait, no text, no UI', 'others',
      `玛拉用量尺校准船身旧磨痕，塞拉把每位乘客带来的家物串成一条溯源线。众人轮流说出归乡理由，雾里终于传来一次不属于灯塔的钟声。
[skill_check: skill="守住共同记忆" dc="14" rolls="15" modifier="2" total="17" result="success"]
[fact: id="lantern-island-contact" value="true"]
[inventory: action="add" item_id="island-bell-shard" item="归乡岛钟碎片" count="1" rarity="rare" detail="从渡船龙骨里取出的青铜碎片，靠近旧航线时会与页边中的岛钟共振" effect="可在海雾中确认一次被删航线的方向；离开真实旧航道便沉默" lore="逃难者把碎钟铸进第一艘返乡渡船，船长在确认岛民回应后交给玩家" metrics="回应次数: 1|有效范围: 旧航道" image_prompt="single weathered bronze island bell shard with salt crystals and dark rope, grounded fantasy artifact, no people, no text, square"]
皇家巡船正要切断渡船航线。你只能选择一种长期可维护的归乡方式。
[choices: "修复灯塔并公开标出避难岛"|"让渡船与乘客共同维护记忆航线"|"在页边与海岸之间保留隐秘潮门"]`,
      `Mara uses the ruler to align old wear on the hull while Sera threads every passenger's home object into one provenance line. They take turns saying why they are returning, and a bell answers from somewhere beyond the lighthouse.
[skill_check: skill="Hold a shared memory" dc="14" rolls="15" modifier="2" total="17" result="success"]
[fact: id="lantern-island-contact" value="true"]
[inventory: action="add" item_id="island-bell-shard" item="Home-island Bell Shard" count="1" rarity="rare" detail="A bronze shard removed from the ferry keel; it resonates with the island bell in the Margins when near the old route" effect="Confirms one erased route through sea fog; it falls silent away from the true old channel" lore="Refugees cast the broken bell into their first return ferry, and the captain entrusted it to the player after the island answered" metrics="Replies: 1|Range: old channel" image_prompt="single weathered bronze island bell shard with salt crystals and dark rope, grounded fantasy artifact, no people, no text, square"]
Royal cutters move to sever the ferry route. You can sustain only one kind of return.
[choices: "Restore the lighthouse and publicly chart the refuge island"|"Let ferry crews and passengers maintain a memory route"|"Keep a hidden tide gate between the coast and the Margins"]`),

    turn(locale, ['修复灯塔', '公开标出'], ['Restore the lighthouse', 'publicly chart'],
      'Lantern Coast lighthouse blazing over a newly visible refuge island while ferries arrive openly and royal cutters lower chains, families on the pier, cinematic hopeful fantasy, 4:5 portrait, no text, no UI', 'environment',
      `灯塔重新点亮后，避难岛第一次出现在公开航图上。它获得补给和保护，也失去隐蔽；岛民同意以公开见证换取不再被轻易删除。
[fact: id="lantern-coast-resolution" value="public-lighthouse"]
[fact: id="lantern-coast-witness-page" value="true"]
[fact: id="safe-routes-three" value="true"]
[fact: id="communities-warned-two" value="true"]
[session_end: reason="灯塔海岸见证页完成。公开航图保住补给，也让避难岛必须面对王国目光。"]
[choices: "回苹果谷参加归名之夜"|"先在海岸安置最后一船归乡者"|"沿岛钟回声寻找页边入口"]`,
      `When the lighthouse burns again, the refuge island appears on a public chart for the first time. It gains supply and protection and loses secrecy; islanders accept public witnessing so they cannot be erased easily again.
[fact: id="lantern-coast-resolution" value="public-lighthouse"]
[fact: id="lantern-coast-witness-page" value="true"]
[fact: id="safe-routes-three" value="true"]
[fact: id="communities-warned-two" value="true"]
[session_end: reason="Lantern Coast witness page complete. The public chart preserves supplies and exposes the refuge island to the kingdom's gaze."]
[choices: "Return to Apple Vale for the Night of Returned Names"|"Settle the last ferry of returnees first"|"Follow the island bell toward an entrance to the Margins"]`),

    turn(locale, ['记忆航线'], ['memory route'],
      'three ferries in fog following hand bells and family keepsakes rather than a fixed chart, crews and passengers calling destinations to one another, grounded high fantasy, 4:5 portrait, no text, no UI', 'others',
      `你不把岛钉死在一张图上。每次出航都由船员、乘客和岛民从两端确认，航线会随风暴改变，却不能由一个人单独删除。
[fact: id="lantern-coast-resolution" value="living-route"]
[fact: id="lantern-coast-witness-page" value="true"]
[fact: id="safe-routes-three" value="true"]
[fact: id="communities-warned-two" value="true"]
[session_end: reason="灯塔海岸见证页完成。记忆航线保持自由，但每次归航都需要活人共同维护。"]
[choices: "回苹果谷参加归名之夜"|"先在海岸安置最后一船归乡者"|"沿岛钟回声寻找页边入口"]`,
      `You refuse to pin the island to one fixed chart. Crew, passengers and islanders verify each crossing from both ends. The route changes after storms but cannot be deleted by one authority.
[fact: id="lantern-coast-resolution" value="living-route"]
[fact: id="lantern-coast-witness-page" value="true"]
[fact: id="safe-routes-three" value="true"]
[fact: id="communities-warned-two" value="true"]
[session_end: reason="Lantern Coast witness page complete. The memory route stays free, but every return requires living people to maintain it together."]
[choices: "Return to Apple Vale for the Night of Returned Names"|"Settle the last ferry of returnees first"|"Follow the island bell toward an entrance to the Margins"]`),

    turn(locale, ['隐秘潮门'], ['hidden tide gate'],
      'secret tide cave opening between a storm coast and a warm lamp-lit Margin island, a few families crossing under guard while the lighthouse stays dark, cinematic fantasy, 4:5 portrait, no text, no UI', 'others',
      `岛钟碎片打开一扇只在退潮时出现的门。它保住页边与海岸之间的来往，也迫使每一代人承担守门者；你拒绝把入口交给王室。
[fact: id="lantern-coast-resolution" value="margin-tide-gate"]
[fact: id="lantern-coast-witness-page" value="true"]
[fact: id="margin-route-seed" value="true"]
[fact: id="safe-routes-three" value="true"]
[session_end: reason="灯塔海岸见证页完成。隐秘潮门保护归乡者，但必须有人持续守住它。"]
[choices: "回苹果谷参加归名之夜"|"先在海岸安置最后一船归乡者"|"沿岛钟回声寻找页边入口"]`,
      `The bell shard opens a gate that exists only at low tide. It preserves travel between coast and Margins and binds each generation to keep it. You refuse to give its entrance to the crown.
[fact: id="lantern-coast-resolution" value="margin-tide-gate"]
[fact: id="lantern-coast-witness-page" value="true"]
[fact: id="margin-route-seed" value="true"]
[fact: id="safe-routes-three" value="true"]
[session_end: reason="Lantern Coast witness page complete. The hidden tide gate protects returnees but always needs a keeper."]
[choices: "Return to Apple Vale for the Night of Returned Names"|"Settle the last ferry of returnees first"|"Follow the island bell toward an entrance to the Margins"]`),

    turn(locale, ['归名之夜', '参加归名'], ['Night of Returned Names'],
      'Apple Vale at night with erased families returning around the restored landmark, Mara facing her mother who now carries signs of another life, courier seeing Eli silhouette at an old post road, emotional grounded fantasy, 4:5 portrait, no text, no UI', 'others',
      `四张见证页同时发热，被删去的人在最被思念的地方短暂归来。玛拉的母亲拥抱她，却身后还跟着两个在页边长大的孩子；旧驿道尽头，伊莱的背影只停留了一息。
[map_update: new_location="苹果谷 · 归名之夜" connected_to="灯塔海岸" detail="被删者短暂回到最被思念的地点，但带着页边十二年的新生活" lore="归来不是把人恢复成离开前的旧照片" facts="玛拉母亲已有新家庭|伊莱短暂现身"]
[clock: value="修订前第 3 天 · 23:40"]
[state: value="在天亮前尊重归来者现在的生活，并找到进入页边的路"]
玛拉想问母亲是否愿意留下，塞拉提醒每件归乡物只能锚住一个关系，奥伦看见自己的旧部也从两段记忆中同时归来。
[choices: "陪玛拉听完母亲在页边的十二年"|"追向旧驿道上的伊莱背影"|"帮助归来者自己决定留下或返回"]`,
      `All four witness pages grow warm, and erased people briefly return to the places where they are most missed. Mara's mother embraces her with two children raised in the Margins behind her. At the old courier road, Eli's silhouette lasts one breath.
[map_update: new_location="Apple Vale · Night of Returned Names" connected_to="Lantern Coast" detail="Erased people briefly return to the places where they are most missed, carrying twelve years of new life in the Margins" lore="Return is not restoring people into old photographs" facts="Mara's mother has a new family|Eli briefly appears"]
[clock: value="Three days before Revision · 23:40"]
[state: value="Respect returnees' present lives before dawn and find a way into the Margins"]
Mara wants to ask her mother to stay. Sera warns that each home object can anchor only one relationship. Oren sees former soldiers return from both histories at once.
[choices: "Stay with Mara and hear her mother's twelve years"|"Follow Eli's silhouette toward the old courier road"|"Help returnees choose for themselves whether to stay or go back"]`),

    turn(locale, ['母亲在页边', '伊莱背影', '自己决定留下'], ["mother's twelve years", "Eli's silhouette", 'choose for themselves'],
      'dawn at Apple Vale, Mara and her mother drawing two connected homes instead of one restored past, returnees choosing at a lamp-lined threshold, courier holding the island bell shard, emotional fantasy, 4:5 portrait, no text, no UI', 'others',
      `你没有替任何人宣布“回家”。玛拉把苹果谷和页边聚落同时画进母亲的地图；有人留下，有人牵着新家人的手回到门后。伊莱在门关闭前留下一枚旧信使扣。
[fact: id="homecoming-night-complete" value="true"]
[fact: id="companions-reconciled" value="true"]
[inventory: action="add" item_id="eli-courier-clasp" item="伊莱的旧信使扣" count="1" rarity="rare" detail="磨平徽记的铜扣，背面仍留着玩家学徒时期系绳的缺口" effect="靠近伊莱走过的页边路线时会变暖；不能独自打开通道" lore="伊莱在归名之夜关闭前留给玩家的定位物" metrics="旧路线回应: 1|缺口方向: 西北" image_prompt="single worn brass courier clasp with filed-away crest and a familiar rope nick, dark cloth, grounded fantasy artifact, no people, no text, square"]
岛钟碎片与信使扣同时变暖，指向退潮后的页边入口。
[choices: "带伙伴穿过潮门进入页边"|"先问玛拉是否准备面对伊莱"|"让塞拉核验信使扣的来源再出发"]`,
      `You declare no one simply "home." Mara draws both Apple Vale and the Margin settlement on her mother's map. Some stay; others return through the door holding their new families. Eli leaves an old courier clasp before it closes.
[fact: id="homecoming-night-complete" value="true"]
[fact: id="companions-reconciled" value="true"]
[inventory: action="add" item_id="eli-courier-clasp" item="Eli's Old Courier Clasp" count="1" rarity="rare" detail="A brass clasp with its crest filed away; the back keeps a rope nick from the player's apprenticeship" effect="Warms near Margin routes once used by Eli; cannot open a passage alone" lore="Eli left it as a locator before the Night of Returned Names closed" metrics="Old route replies: 1|Notch direction: northwest" image_prompt="single worn brass courier clasp with filed-away crest and a familiar rope nick, dark cloth, grounded fantasy artifact, no people, no text, square"]
The island bell shard and clasp warm together, pointing toward the low-tide entrance to the Margins.
[choices: "Lead the companions through the tide gate into the Margins"|"Ask whether Mara is ready to face Eli"|"Let Sera verify the clasp's provenance before leaving"]`),

    turn(locale, ['进入页边', '面对伊莱', '核验信使扣'], ['into the Margins', 'face Eli', "clasp's provenance"],
      'Margin settlement built from remembered doors pots bells and road stones floating through ivory twilight, courier party arriving as Eli waits beside a house made from a single remembered door, cinematic emotional fantasy, 4:5 portrait, no text, no UI', 'player',
      `页边不是空无。人们用仍被记得的门、锅、钟和路石连接聚落。伊莱站在一扇没有房子的门旁，第一句话不是欢迎，而是：“我知道你为什么没有名字。”
[map_update: new_location="页边聚落" connected_to="苹果谷 · 归名之夜" detail="被删去的人用仍被记得的物件连接出可生活的街道" lore="物件被记得多久，道路和人就能维持多久" facts="伊莱仍活着|诺娅留下两段人生记录"]
[character_update: character_id="eli-courier" character="伊莱" role="被删去的皇家信使" detail="承认自己藏起王印，也删去了玩家未完成的登记" lore="他救了玩家免受总册控制，却未经同意决定了玩家的无名人生" vitality="61" stress="72" skills="秘路: 5|信使誓言: 4"]
[state: value="听完伊莱的真相，并决定是否继承他的最后一封信"]
[choices: "要求伊莱解释为什么替你决定人生"|"先查看他保存的出生登记证据"|"拒绝谈原谅，只问如何阻止大修订"]`,
      `The Margins are not empty. People connect streets with remembered doors, pots, bells and road stones. Eli waits beside a door without a house. His first words are not welcome: "I know why you have no name."
[map_update: new_location="Margin Settlement" connected_to="Apple Vale · Night of Returned Names" detail="Erased people connect livable streets with objects still remembered" lore="Roads and people endure as long as their objects are remembered" facts="Eli is alive|Noa left records of two lives"]
[character_update: character_id="eli-courier" character="Eli" role="Erased royal courier" detail="Admits he hid the blank seal and erased the player's unfinished registration" lore="He saved the player from Ledger control without consent, deciding a nameless life for them" vitality="61" stress="72" skills="Hidden routes: 5|Courier oath: 4"]
[state: value="Hear Eli's truth and decide whether to inherit his last letter"]
[choices: "Demand why Eli chose your life without consent"|"Examine the birth-registration evidence he preserved"|"Refuse to discuss forgiveness and ask only how to stop the Revision"]`),

    turn(locale, ['替你决定', '出生登记证据', '阻止大修订'], ['without consent', 'birth-registration evidence', 'stop the Revision'],
      'Eli opening a weathered courier satchel before the player, revealing a sealed birth record and final letter while Mara Sera and Oren witness, Margin lamps around them, emotional fantasy, 4:5 portrait, no text, no UI', 'others',
      `伊莱没有为自己辩护。他承认：当年只有未登记的人能携带空白王印，他怕询问你会让总册先发现你，于是把保护变成了替你作主。
[fact: id="eli-truth-known" value="true"]
[fact: id="player-birth-evidence" value="true"]
[fact: id="margin-witness-page" value="true"]
[fact: id="paired-conflicts-three" value="true"]
[inventory: action="add" item_id="last-letter" item="最后一封信" count="1" rarity="legendary" detail="伊莱从未寄出的密封信，封口同时留着死去国王与无名信使的印痕" effect="在总册塔内可证明空白王印的合法灾难用途与玩家被删登记的经过；打开后无法再假装不知道伊莱的选择" lore="伊莱把王印、出生证据与自己的承认写进同一封信" metrics="见证人: 伊莱|收件人: 玩家" image_prompt="single sealed final courier letter with two worn wax impressions and a filed brass clasp, no readable text, grounded fantasy artifact, square"]
伊莱把信交给你，但是否原谅、追责或拒绝继承，只能由你决定。
[choices: "原谅伊莱，但要求他公开承认越界"|"收下证据，不替伊莱解除责任"|"拒绝继承他的使命，只带走事实"]`,
      `Eli does not defend himself. He admits that only an unregistered person could carry the blank seal. Afraid that asking would alert the Ledger, he turned protection into choosing your life for you.
[fact: id="eli-truth-known" value="true"]
[fact: id="player-birth-evidence" value="true"]
[fact: id="margin-witness-page" value="true"]
[fact: id="paired-conflicts-three" value="true"]
[inventory: action="add" item_id="last-letter" item="The Last Letter" count="1" rarity="legendary" detail="Eli's unsent sealed letter, marked by both the dead king and a nameless courier" effect="Inside the Ledger Tower it proves the blank seal's lawful disaster purpose and the player's erased registration; opening it ends any possibility of not knowing Eli's choice" lore="Eli placed the seal, birth evidence and his confession in one letter" metrics="Witness: Eli|Recipient: player" image_prompt="single sealed final courier letter with two worn wax impressions and a filed brass clasp, no readable text, grounded fantasy artifact, square"]
Eli gives you the letter, but forgiveness, accountability or refusal remains yours alone.
[choices: "Forgive Eli but require a public admission"|"Take the evidence without releasing Eli from responsibility"|"Refuse his mission and carry only the facts away"]`),

    turn(locale, ['公开承认越界', '不替伊莱解除责任', '只带走事实'], ['public admission', 'without releasing Eli', 'only the facts'],
      'player and Eli separated by an open remembered doorway as companions stand nearby, the final letter in the player hand and no easy embrace, emotional restrained high fantasy, 4:5 portrait, no text, no UI', 'player',
      `伊莱接受你的边界，没有把一次决定变成廉价和解。你带着信离开时，页边所有灯同时熄灭一瞬：维尔已经开始切断苹果谷的恢复源头。
[fact: id="eli-resolution" value="accountability-without-erasure"]
[reputation: npc="伊莱" action="truth-accepted-with-boundary"]
[clock: value="修订前第 2 天 · 05:20"]
[state: value="赶回苹果谷，在第二次删除中承担无法回避的取舍"]
[session_end: reason="页边见证页完成。伊莱的真相已保存，但你们的关系不会被一句原谅恢复原样。"]
[choices: "立刻沿潮门赶回苹果谷"|"让奥伦先警告沿途居民"|"请玛拉画出仍能回家的最后路线"]`,
      `Eli accepts your boundary and does not turn one decision into cheap reconciliation. As you leave with the letter, every Margin lamp goes dark for one breath: Veyr has begun severing Apple Vale's source of restoration.
[fact: id="eli-resolution" value="accountability-without-erasure"]
[reputation: npc="Eli" action="truth-accepted-with-boundary"]
[clock: value="Two days before Revision · 05:20"]
[state: value="Return to Apple Vale and bear an unavoidable choice during its second erasure"]
[session_end: reason="Margin witness page complete. Eli's truth is preserved, but one word of forgiveness cannot restore the relationship to what it was."]
[choices: "Return to Apple Vale immediately through the tide gate"|"Send Oren ahead to warn the road communities"|"Ask Mara to draw the final route that can still reach home"]`),

    turn(locale, ['赶回苹果谷', '警告沿途', '最后路线'], ['Return to Apple Vale', 'warn the road', 'final route'],
      'Apple Vale collapsing into ivory absence for a second time, villagers gathering at one restored landmark while Mara holds maps and the player carries the last letter, urgent emotional fantasy, 4:5 portrait, no text, no UI', 'player',
      `苹果谷这次不是从边缘褪色，而是从所有恢复痕迹同时断裂。玛拉母亲和页边孩子在桥的一边，仍能生活的地标在另一边；书记残页与旧量尺正在空白中变轻。
[map_update: new_location="苹果谷 · 第二次删除" connected_to="页边聚落" detail="维尔切断恢复源头，人物、可生活地点与证据无法全部同时保住" lore="此前保存的路线、补给和伙伴关系决定损失能否减少" facts="只能优先稳住两类|损失必须被公开记住"]
[state: value="在具体的人、可生活地点与关键证据间承担取舍"]
王印只剩足够稳住两类事物的见证墨。你必须说出第三类将怎样改变。
[choices: "先保住具体的人和他们的新家庭"|"先保住可继续生活的桥与面包房"|"先保住量尺、残页和所有证据"]`,
      `This time Apple Vale does not fade from the edge; every restored trace breaks at once. Mara's mother and Margin children stand on one side of the bridge, livable landmarks on the other, while the registry fragment and ruler grow light in the blank.
[map_update: new_location="Apple Vale · Second Erasure" connected_to="Margin Settlement" detail="Veyr severs restoration at its source; people, livable places and evidence cannot all be preserved together" lore="Earlier routes, supplies and relationships determine whether loss can be reduced" facts="Only two categories can be stabilized first|The loss must remain publicly remembered"]
[state: value="Bear a choice among specific people, livable places and essential evidence"]
The seal has enough witness ink to stabilize only two categories. You must say how the third will change.
[choices: "Save the people and their new families first"|"Save the bridge and bakery where life can continue"|"Save the ruler, registry fragment and all evidence first"]`),

    turn(locale, ['具体的人', '新家庭'], ['people and their new families'],
      'families crossing out of a fading Apple Vale while Mara folds her old map and leaves one beloved tower to disappear, courier anchoring the bridge with the blank seal, emotional cinematic fantasy, 4:5 portrait, no text, no UI', 'player',
      `你先让每个人带着现在的家人通过桥。桥和面包房被保住，山坡钟楼却在最后一次钟声后永久沉入页边。玛拉没有要求你假装没听见。
[fact: id="apple-vale-final-loss" value="bell-tower"]
[fact: id="apple-vale-witness-page" value="true"]
[fact: id="communities-warned-two" value="true"]
[reputation: npc="玛拉" action="chose-living-people-over-perfect-home"]
[session_end: reason="苹果谷第六张见证页完成。人和新家庭得救，钟楼永久改变，失去不会从地图上被擦掉。"]
[choices: "带六张见证页前往白石王都"|"让伙伴分别说出进入王都前的请求"|"最后回望一次已经改变的苹果谷"]`,
      `You send every person across the bridge with the family they have now. Bridge and bakery endure, but the hill bell tower sinks into the Margins after one final chime. Mara does not ask you to pretend you did not hear it.
[fact: id="apple-vale-final-loss" value="bell-tower"]
[fact: id="apple-vale-witness-page" value="true"]
[fact: id="communities-warned-two" value="true"]
[reputation: npc="Mara" action="chose-living-people-over-perfect-home"]
[session_end: reason="Apple Vale's sixth witness page is complete. People and new families survive, the bell tower changes forever, and the loss will not be erased from the map."]
[choices: "Carry all six witness pages to Whitestone Capital"|"Let each companion state a request before entering the capital"|"Look back once at the Apple Vale that has changed"]`),

    turn(locale, ['桥与面包房', '继续生活'], ['bridge and bakery', 'life can continue'],
      'Apple Vale bridge and bakery glowing as a viable refuge while some returnees choose to remain in the lamp-lit Margins, Mara holding hands across a threshold, emotional grounded fantasy, 4:5 portrait, no text, no UI', 'others',
      `你保住桥、面包房和足够的证据，让留下者能真正生活。玛拉的母亲选择带两个页边孩子回门后；母女都活着，却不再共享同一座家。
[fact: id="apple-vale-final-loss" value="mara-family-separated"]
[fact: id="apple-vale-witness-page" value="true"]
[fact: id="safe-routes-three" value="true"]
[reputation: npc="玛拉" action="respected-mothers-choice"]
[session_end: reason="苹果谷第六张见证页完成。村庄能继续生活，但玛拉与母亲接受了两个家的距离。"]
[choices: "带六张见证页前往白石王都"|"让伙伴分别说出进入王都前的请求"|"最后回望一次已经改变的苹果谷"]`,
      `You preserve bridge, bakery and enough evidence for those who remain to live. Mara's mother returns through the door with her two Margin children. Mother and daughter are alive but no longer share one home.
[fact: id="apple-vale-final-loss" value="mara-family-separated"]
[fact: id="apple-vale-witness-page" value="true"]
[fact: id="safe-routes-three" value="true"]
[reputation: npc="Mara" action="respected-mothers-choice"]
[session_end: reason="Apple Vale's sixth witness page is complete. The village can keep living, while Mara and her mother accept the distance between two homes."]
[choices: "Carry all six witness pages to Whitestone Capital"|"Let each companion state a request before entering the capital"|"Look back once at the Apple Vale that has changed"]`),

    turn(locale, ['所有证据', '量尺', '残页'], ['all evidence', 'ruler', 'registry fragment'],
      'Mara and the courier carrying rescued ruler registry page and six witness leaves while an outer row of empty Apple Vale houses fades, survivors shelter at the bridge, tragic grounded fantasy, 4:5 portrait, no text, no UI', 'player',
      `你保住能让王国再也否认不了苹果谷的全部证据，也稳住撤离桥。最外一排无人居住的旧屋永久消失；玛拉把每个门牌的位置画成空框，而不是假装那里从未有人住过。
[fact: id="apple-vale-final-loss" value="outer-houses"]
[fact: id="apple-vale-witness-page" value="true"]
[fact: id="player-birth-evidence" value="true"]
[session_end: reason="苹果谷第六张见证页完成。证据完整留下，外缘旧屋永久消失并被记作代价。"]
[choices: "带六张见证页前往白石王都"|"让伙伴分别说出进入王都前的请求"|"最后回望一次已经改变的苹果谷"]`,
      `You preserve every piece of evidence that makes denying Apple Vale impossible, and stabilize the evacuation bridge. The outer row of empty old houses disappears forever. Mara draws every doorway as an empty frame instead of pretending no one lived there.
[fact: id="apple-vale-final-loss" value="outer-houses"]
[fact: id="apple-vale-witness-page" value="true"]
[fact: id="player-birth-evidence" value="true"]
[session_end: reason="Apple Vale's sixth witness page is complete. The evidence survives intact, and the lost outer houses remain recorded as the cost."]
[choices: "Carry all six witness pages to Whitestone Capital"|"Let each companion state a request before entering the capital"|"Look back once at the Apple Vale that has changed"]`),

    turn(locale, ['白石王都', '伙伴分别', '回望一次'], ['Whitestone Capital', 'each companion', 'Look back once'],
      'white-stone capital seen from four converging routes, courier with Mara Sera and Oren carrying six luminous witness pages, ordered city and immense Ledger Tower ahead, cinematic fantasy, 4:5 portrait, no text, no UI', 'player',
      `王都城门同时认出六张见证页，却仍读不稳你的名字。玛拉请求地图必须允许后人改正；塞拉请求物品不能因登记就失去旧主人；奥伦请求任何命令都必须让执行者保留责任。
[map_update: new_location="白石王都" connected_to="苹果谷 · 第二次删除" detail="整齐大道与总册塔允许一个版本的现实通行，六张地区见证页正在迫使城门承认例外" lore="秩序保护过很多人，也让少数人获得删除他人的权力" facts="六页见证已到城门|伙伴提出终局请求"]
[fact: id="companions-reconciled" value="true"]
[state: value="选择进入总册塔的道路，并让伙伴请求成为真实承诺"]
[choices: "在登记大厅公开提交六页证词"|"由奥伦带队穿过骑士通道"|"借页边潮门从总册塔地底进入"]`,
      `The capital gate recognizes all six witness pages and still cannot read your name steadily. Mara asks that maps remain correctable; Sera asks that registration never erase previous owners; Oren asks that every order preserve the executor's responsibility.
[map_update: new_location="Whitestone Capital" connected_to="Apple Vale · Second Erasure" detail="Straight avenues and the Ledger Tower admit one version of reality while six regional witness pages force the gate to recognize exceptions" lore="Order protected many people and gave a few the power to erase others" facts="Six witness pages reached the gate|Companions made finale requests"]
[fact: id="companions-reconciled" value="true"]
[state: value="Choose a route into the Ledger Tower and make companion requests into real promises"]
[choices: "Submit all six testimonies publicly in the registration hall"|"Let Oren lead the party through the knight passage"|"Enter beneath the Ledger Tower through the Margin tide gate"]`),

    turn(locale, ['公开提交', '骑士通道', '地底进入'], ['testimonies publicly', 'knight passage', 'beneath the Ledger'],
      'inside the vast Ledger Tower as six witness pages open a path through white stone archives, companions guarding civilians while the courier reaches a brass control dais, cinematic high fantasy, 4:5 portrait, no text, no UI', 'player',
      `无论走哪条路，伙伴建立的证据都没有被留在门外。六页见证在塔内组成一条可回头的道路，你把最后一封信压在总册控制台上，死去国王的旧印第一次被系统承认。
[fact: id="ledger-access" value="true"]
[fact: id="capital-route-open" value="true"]
[clock: value="大修订开始前 · 00:18"]
维尔没有命令士兵攻击。他打开两页关于女儿诺娅的记录：一页里她长大成人，一页里她死于重页灾难，两页都有可信见证。
[choices: "承认维尔的恐惧，再质问他为何替所有人选择"|"让六地见证人逐项核验诺娅两段人生"|"把苹果谷的永久损失放到维尔面前"]`,
      `Whichever route you choose, companion evidence is not left at the door. Six witness pages form a path through the tower that can still lead back. You place the Last Letter on the control dais, and the dead king's seal is recognized for the first time.
[fact: id="ledger-access" value="true"]
[fact: id="capital-route-open" value="true"]
[clock: value="Great Revision begins · 00:18"]
Veyr does not order an attack. He opens two records of his daughter Noa: in one she grew up; in another she died in the Overlap Disaster. Both have credible witnesses.
[choices: "Acknowledge Veyr's fear and ask why he chose for everyone"|"Have witnesses from six regions verify both of Noa's lives"|"Put Apple Vale's permanent loss before Veyr"]`),

    turn(locale, ['质问他为何', '核验诺娅', '永久损失'], ['why he chose', "Noa's lives", "Apple Vale's permanent loss"],
      'Veyr and the courier facing each other across two luminous records of Noa while Mara Sera Oren and regional witnesses fill the Ledger hall, restrained emotional fantasy, 4:5 portrait, no text, no UI', 'others',
      `维尔承认他选择女儿死亡的版本结束了灾难，也承认从那天起，他把自己的牺牲变成所有人必须服从的规则。六地证词证明：冲突事实危险，但让一个人独占选择同样危险。
[fact: id="veyr-dialogue-completed" value="true"]
[fact: id="noa-two-lives-witnessed" value="true"]
[fact: id="true-ending-started" value="false"]
[state: value="开始不可逆的大修订行动：决定谁能作证、名字归谁、页边是否保持开放以及维尔承担什么"]
总册开始崩落。你不能从结局菜单挑答案，只能先完成第一项不可撤销的行动。
[choices: "把空白王印压进总册书脊，拆掉独占现实的权力"|"用六页见证约束总册，并恢复自己的名字"|"先疏散所有可达社区，再用自己的名字守住页边门"]`,
      `Veyr admits that choosing the history where his daughter died ended the disaster. He also admits that afterward he turned his sacrifice into a rule everyone had to obey. Six regions prove that conflicting truths are dangerous and one person's monopoly on choice is dangerous too.
[fact: id="veyr-dialogue-completed" value="true"]
[fact: id="noa-two-lives-witnessed" value="true"]
[fact: id="true-ending-started" value="false"]
[state: value="Begin irreversible Great Revision actions: decide who may witness, who owns the player name, whether the Margins remain open, and what Veyr must bear"]
The Ledger begins to fail. You cannot choose an ending from a menu; you can only perform the first irreversible act.
[choices: "Drive the blank seal into the Ledger spine and break its monopoly on reality"|"Bind the Ledger with six witness pages and restore your own name"|"Evacuate every reachable community, then spend your name to hold the Margin door"]`),

    turn(locale, ['拆掉独占现实', '总册书脊'], ['break its monopoly', 'Ledger spine'],
      'courier driving a blank brass seal into the spine of a colossal luminous Ledger as many roads burst outward and companions shield witnesses, climactic grounded high fantasy, 4:5 portrait, no text, no UI', 'player',
      `空白王印嵌入书脊时，你先让玛拉、塞拉、奥伦和六地证人逐一叫出仍在路上的人。总册失去独占现实的力量，稳定大道开始分裂；自由不是没有代价。
[fact: id="final-intent" value="dismantle-ledger"]
[fact: id="true-ending-started" value="true"]
[true_ending: reason="玩家以六地证词为保护，开始拆毁总册独占现实的权力，并接受道路与所有权将暂时失稳。"]
[choices: "让伙伴继续完成大修订"|"确认必须承担的代价"|"写下最后一位证人的名字"]`,
      `As the blank seal enters the Ledger spine, you first have Mara, Sera, Oren and witnesses from six regions name everyone still on the road. The Ledger loses its monopoly on reality and stable avenues begin to divide. Freedom has a cost.
[fact: id="final-intent" value="dismantle-ledger"]
[fact: id="true-ending-started" value="true"]
[true_ending: reason="Protected by testimony from six regions, the player begins dismantling the Ledger's monopoly on reality and accepts that roads and ownership will destabilize for a time."]
[choices: "Let the companions complete the Great Revision"|"Confirm the cost that must be borne"|"Write the final witness's name"]`),

    turn(locale, ['约束总册', '恢复自己的名字'], ['Bind the Ledger', 'restore your own name'],
      'six witness pages binding a vast Ledger with many public seals as the courier writes their own name and a Margin doorway begins to close, companions watching with joy and loss, cinematic fantasy, 4:5 portrait, no text, no UI', 'player',
      `你把自己的出生证据与六页见证放在同一层级。总册第一次必须接受公开申诉，你的名字也被稳定写回；页边的无名通道随之开始关闭。
[fact: id="final-intent" value="bound-ledger-restored-name"]
[fact: id="true-ending-started" value="true"]
[true_ending: reason="玩家用六页见证约束总册并恢复自己的正式名字，同时接受将失去不受限制穿越页边的能力。"]
[choices: "让伙伴继续完成大修订"|"确认必须承担的代价"|"写下最后一位证人的名字"]`,
      `You place your birth evidence on the same level as six witness pages. For the first time the Ledger must accept public appeal, and your name becomes stable. The nameless Margin passage begins to close.
[fact: id="final-intent" value="bound-ledger-restored-name"]
[fact: id="true-ending-started" value="true"]
[true_ending: reason="The player binds the Ledger with six witness pages and restores their formal name, accepting the loss of unrestricted passage through the Margins."]
[choices: "Let the companions complete the Great Revision"|"Confirm the cost that must be borne"|"Write the final witness's name"]`),

    turn(locale, ['疏散所有', '守住页边门'], ['Evacuate every', 'hold the Margin door'],
      'three glowing evacuation roads carrying communities out of a collapsing Ledger Tower while a nameless courier holds a lamp-lined Margin door and companions lead families, emotional high fantasy, 4:5 portrait, no text, no UI', 'player',
      `你先点亮古林、红堡和灯塔海岸的安全路，让所有可达社区撤离。最后，你把自己的公共名字留在页边门上；人们记得有人送他们回家，却开始读不出是谁。
[fact: id="final-intent" value="evacuate-and-hold-margin"]
[fact: id="true-ending-started" value="true"]
[true_ending: reason="玩家拒绝替王国制定唯一答案，先疏散可达社区，再用自己的公共名字守住页边通道。"]
[choices: "让伙伴继续完成大修订"|"确认必须承担的代价"|"写下最后一位证人的名字"]`,
      `You light the safe roads through Oldwood, Red Bastion and Lantern Coast and evacuate every reachable community. Last, you leave your public name on the Margin door. People remember someone brought them home and begin to forget who.
[fact: id="final-intent" value="evacuate-and-hold-margin"]
[fact: id="true-ending-started" value="true"]
[true_ending: reason="The player refuses to impose one answer on the kingdom, evacuates every reachable community, and spends their public name to hold the Margin passage."]
[choices: "Let the companions complete the Great Revision"|"Confirm the cost that must be borne"|"Write the final witness's name"]`),
  ]
}
