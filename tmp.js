var _tmpDist = getDistance(me.x, me.y, leaderUnit.x, leaderUnit.y);
if (((leader.area === 39 && me.area === 39) && (_tmpDist >= 100 || _tmpDist === undefined))) {					// dEdites: if flwr & ldr are in cows, but dist >=100 or undeifned, flwr goes to town
  stop = true;
  Town.goToTown();
  Town.doChores();
  Town.move("portalspot");
  while (leader.area !== 39) { delay(rand(1000,2000)); }
  stop = false;
}
