/*
*	MajorTom.js is for a walking necro leader
*
*	pickles:	lists help cmds
*	watchmaker:	time left
*	troops:		moves necro to river of fire, waits for troops to follow, sends bo cmd, returns to town, disables barb
*	fini:		exits leader's while loop
*
*	hulk:		necro's cmd for peeps to precast/bo
*
*    function myQuietVoice(_statement)  utilizes: Config.debugChat = false; 
*
*    myTPwaitforteam()  : makes a tp and waits for party to arrive
*    myWaitForTeam(_complete, _tp) {                // false: wait until followers minus bo barb are near me
													// true:   wait until the entire party is near to me
*
*/

function MajorTom() {
	
	// collection of variables
	//
	Config.meHPmaxOrig 		= me.hpmax;							// store the original hpnax of ldr as a chkpt for bo wearing off
	Config.debugChat 		= false;	 						// for when wishing to disable my extra chattinesses
	var _myTeleSorc 		= Config.BObarb.Troops[1];			// sorc which will tele to chaos ctr
	var _myBObarb 			= Config.BObarb.Troops[0];
	var _barbStop 			= false;
	
	var command, hostile, nick, spot, tick, s, m,
		startTime = getTickCount(),
		greet = [];
	
	var failTimer = 120;
	
	
	// my main necro as a leader thingies...
	
	
	Town.goToTown(4);								// head to the pandemonium fortress
	Town.move("waypoint");
	Town.doChores();
	Precast.doPrecast(true);
	Town.move("waypoint");
	
	me.overhead("Waiting for all of the team...");
	while(!(troopsInMyArea() === Config.BObarb.Troops.length)) { delay(rand(1500,3000)); }
	delay(rand(10000,16000));
	me.overhead("Let's do it...");
	
	d2_gatherSkellies();
	
	me.overhead("We should have enough skellies to start something...");
	_barbStop = true;
	d2_ldrPindle(_myTeleSorc);
	//me.overhead("Sending sorc to Chaos' centre and then it begins...");
	//d2_ctrme(_myTeleSorc);
	d2_ldrBaal(_myTeleSorc);
	me.overhead("Done. Preparing to vacate the premises.");
	delay(rand(10000,15000));
	
	return true;
}
function d2_ldrBaal(_tSorc) {
	var portal, tick;

	this.preattack = function () {
		var check;

		switch (me.classid) {
		case 1: // Sorceress
			switch (Config.AttackSkill[3]) {
			case 49:
			case 53:
			case 56:
			case 59:
			case 64:
				if (me.getState(121)) {
					while (me.getState(121)) {
						delay(100);
					}
				} else {
					return Skill.cast(Config.AttackSkill[1], 0, 15094 + rand(-1, 1), 5028);
				}

				break;
			}

			break;
		case 3: // Paladin
			if (Config.AttackSkill[3] === 112) {
				if (Config.AttackSkill[4] > 0) {
					Skill.setSkill(Config.AttackSkill[4], 0);
				}

				return Skill.cast(Config.AttackSkill[3], 1);
			}

			break;
		case 5: // Druid
			if (Config.AttackSkill[3] === 245) {
				return Skill.cast(Config.AttackSkill[3], 0, 15094 + rand(-1, 1), 5028);
			}

			break;
		case 6: // Assassin
			if (Config.UseTraps) {
				check = ClassAttack.checkTraps({x: 15094, y: 5028});

				if (check) {
					return ClassAttack.placeTraps({x: 15094, y: 5028}, 5);
				}
			}

			if (Config.AttackSkill[3] === 256) { // shock-web
				return Skill.cast(Config.AttackSkill[3], 0, 15094, 5028);
			}

			break;
		}

		return false;
	};

	this.checkThrone = function () {
		var monster = getUnit(1);

		if (monster) {
			do {
				if (Attack.checkMonster(monster) && monster.y < 5080) {
					switch (monster.classid) {
					case 23:
					case 62:
						return 1;
					case 105:
					case 381:
						return 2;
					case 557:
						return 3;
					case 558:
						return 4;
					case 571:
						return 5;
					default:
						Attack.getIntoPosition(monster, 10, 0x4);
						Attack.clear(15);

						return false;
					}
				}
			} while (monster.getNext());
		}

		return false;
	};

	this.clearThrone = function () {
		var i, monster,
			monList = [],
			pos = [15094, 5022, 15094, 5041, 15094, 5060, 15094, 5041, 15094, 5022];

		if (1) {			// Config.AvoidDolls
			monster = getUnit(1, 691);

			if (monster) {
				do {
					if (monster.x >= 15072 && monster.x <= 15118 && monster.y >= 5002 && monster.y <= 5079 && Attack.checkMonster(monster) && Attack.skipCheck(monster)) {
						monList.push(copyUnit(monster));
					}
				} while (monster.getNext());
			}

			if (monList.length) {
				Attack.clearList(monList);
			}
		}

		for (i = 0; i < pos.length; i += 2) {
			Pather.moveTo(pos[i], pos[i + 1]);
			Attack.clear(25);
		}
	};

	this.checkHydra = function () {
		var monster = getUnit(1, "hydra");
		if (monster) {
			do {
				if (monster.mode !== 12 && monster.getStat(172) !== 2) {
					Pather.moveTo(15072, 5002);
					while (monster.mode !== 12) {
						delay(500);
						if (!copyUnit(monster).x) {
							break;
						}
					}

					break;
				}
			} while (monster.getNext());
		}

		return true;
	};

	this.announce = function () {
		var count, string, souls, dolls,
			monster = getUnit(1);

		if (monster) {
			count = 0;

			do {
				if (Attack.checkMonster(monster) && monster.y < 5094) {
					if (getDistance(me, monster) <= 40) {
						count += 1;
					}

					if (!souls && monster.classid === 641) {
						souls = true;
					}

					if (!dolls && monster.classid === 691) {
						dolls = true;
					}
				}
			} while (monster.getNext());
		}

		if (count > 30) {
			string = "DEADLY!!!" + " " + count + " monster" + (count > 1 ? "s " : " ") + "nearby.";
		} else if (count > 20) {
			string = "Lethal!" + " " + count + " monster" + (count > 1 ? "s " : " ") + "nearby.";
		} else if (count > 10) {
			string = "Dangerous!" + " " + count + " monster" + (count > 1 ? "s " : " ") + "nearby.";
		} else if (count > 0) {
			string = "Warm" + " " + count + " monster" + (count > 1 ? "s " : " ") + "nearby.";
		} else {
			string = "Cool TP. No immediate monsters.";
		}

		if (souls) {
			string += " Souls ";

			if (dolls) {
				string += "and Dolls ";
			}

			string += "in area.";
		} else if (dolls) {
			string += " Dolls in area.";
		}

		me.ovehead(string);
	};

	Town.goToTown(4);
	prepTroops(107);
	Town.goToTown(5);
	Pather.moveTo("portalspot");
	me.overhead("Send the sorc to here doom...the throne!");
	delay(rand(8000,10000));
	say(_tSorc + " baal");
	
	while(!Pather.usePortal(131, _tSorc)) { delay(750); } // as soon as sorc's portal opens, use the portal
	delay(250);
	Pather.makePortal();

	/*if (1 && getUnit(1, 691)) { 			// Config.Baal.DollQuit
		say("Dolls found! NG.");
		Town.goToTown(4);
		Town.doChores();
		delay(rand(15000,25000));
		return true;
	}

	if (1 && getUnit(1, 641)) {				// Config.Baal.SoulQuit
		say("Souls found! NG.");
		Town.goToTown(4);
		Town.doChores();
		delay(rand(15000,25000));
		return true;
	}*/

	this.clearThrone();
	tick = getTickCount();

	Pather.moveTo(15094, me.classid === 3 ? 5029 : 5038);

MainLoop:
	while (true) {
		if (getDistance(me, 15094, me.classid === 3 ? 5029 : 5038) > 3) {
			Pather.moveTo(15094, me.classid === 3 ? 5029 : 5038);
		}

		if (!getUnit(1, 543)) {
			break MainLoop;
		}

		switch (this.checkThrone()) {
		case 1:
			Attack.clear(40);

			tick = getTickCount();

			Precast.doPrecast(true);

			break;
		case 2:
			Attack.clear(40);

			tick = getTickCount();

			break;
		case 4:
			Attack.clear(40);

			tick = getTickCount();

			break;
		case 3:
			Attack.clear(40);
			this.checkHydra();

			tick = getTickCount();

			break;
		case 5:
			Attack.clear(40);

			break MainLoop;
		default:
			if (getTickCount() - tick < 7e3) {
				if (me.getState(2)) {
					Skill.setSkill(109, 0);
				}

				break;
			}

			if (!this.preattack()) {
				delay(100);
			}

			break;
		}

		delay(10);
	}
	
	Town.goToTown();
	while(!Pather.usePortal(132, _tSorc)) { delay(250); } // as soon as sorc's portal opens, use the portal
	delay(250);
	Pather.makePortal();
	
	/*if (1) {	// Config.Baal.KillBaal
	
		Pather.moveTo(15090, 5008);
		delay(5000);
		Precast.doPrecast(true);

		while (getUnit(1, 543)) {
			delay(500);
		}

		portal = getUnit(2, 563);

		if (portal) {
			Pather.usePortal(null, null, portal);
		} else {
			throw new Error("Couldn't find portal.");
		}

		Pather.moveTo(15134, 5923);
		Pather.makePortal();
	}*/
	
	
	Attack.kill(544); // Baal
	Pickit.pickItems();
		
	delay(rand(6000,10000));
	
	Town.goToTown(4);
	Town.doChores();
	delay(rand(6000,8000));

	return true;
}
function d2_ldrPindle(_tSorc) {
	me.overhead("Pindle time...");
	Town.goToTown(5);
	Pather.moveTo("portalspot");
	while(!(troopsInMyArea() >= (Config.BObarb.Troops.length - 1))) { delay(2000); }
	
	delay(rand(6000,9000));
	say(_tSorc + " pindle");
	
	while(!Pather.usePortal(121, _tSorc)) { delay(750); } // as soon as sorc's portal opens, use the portal
	delay(250);
	Pather.makePortal();
	Attack.clear(30, 0, false, false, true);
	delay(rand(3000,4000));
	Town.goToTown(4);
	Town.doChores();
	Pather.moveTo("waypoint");
	return true;
}
function d2_clrChaosEntrance() {
	myQuietVoice("Config.BObarb.Troops.length: " + Config.BObarb.Troops.length);
	
	this.sort = function (a, b) {
		// Entrance to Star / De Seis
		if (me.y > 5325 || me.y < 5260) {
			if (a.y > b.y) {
				return -1;
			}

			return 1;
		}

		// Vizier
		if (me.x < 7765) {
			if (a.x > b.x) {
				return -1;
			}

			return 1;
		}

		// Infector
		if (me.x > 7825) {
			if (!checkCollision(me, a, 0x1) && a.x < b.x) {
				return -1;
			}

			return 1;
		}

		return getDistance(me, a) - getDistance(me, b);
	};
	
	this.getLayout = function (seal, value) {
		var sealPreset = getPresetUnit(108, 2, seal);

		if (!seal) {
			me.overhead("Seal preset not found. Can't continue.");
		}

		if (sealPreset.roomy * 5 + sealPreset.y === value || sealPreset.roomx * 5 + sealPreset.x === value) {
			return 1;
		}

		return 2;
	};

	this.initLayout = function () {
		this.vizLayout = this.getLayout(396, 5275);
		this.seisLayout = this.getLayout(394, 7773);
		this.infLayout = this.getLayout(392, 7893);
	};
	
	this.openSeal = function (classid) {
		var i, seal, warn;

		switch (classid) {
		case 396:
		case 394:
		case 392:
			warn = true;

			break;
		default:
			warn = false;

			break;
		}

		for (i = 0; i < 5; i += 1) {
			Pather.moveToPreset(108, 2, classid, classid === 394 ? 5 : 2, classid === 394 ? 5 : 0);

			seal = getUnit(2, classid);
			warn = false;
			
			if (classid === 394) {
				Misc.click(0, 0, seal);
			} else {
				seal.interact();
			}
			
			delay(classid === 394 ? 1000 : 500);

			if (!seal.mode) {
				if (classid === 394 && Attack.validSpot(seal.x + 15, seal.y)) { // de seis optimization
					Pather.moveTo(seal.x + 15, seal.y);
				} else {
					Pather.moveTo(seal.x - 5, seal.y - 5);
				}

				delay(500);
			} else {
				return true;
			}
		}

		return false;
	};
	this.chaosPreattack = function (name, amount) {
		var i, n, target, positions;

		switch (me.classid) {
		case 0:
			break;
		case 1:
			break;
		case 2:
			break;
		case 3:
			target = getUnit(1, name);

			if (!target) {
				return;
			}

			positions = [[6, 11], [0, 8], [8, -1], [-9, 2], [0, -11], [8, -8]];

			for (i = 0; i < positions.length; i += 1) {
				if (Attack.validSpot(target.x + positions[i][0], target.y + positions[i][1])) { // check if we can move there
					Pather.moveTo(target.x + positions[i][0], target.y + positions[i][1]);
					Skill.setSkill(Config.AttackSkill[2], 0);

					for (n = 0; n < amount; n += 1) {
						Skill.cast(Config.AttackSkill[1], 1);
					}

					break;
				}
			}

			break;
		case 4:
			break;
		case 5:
			break;
		case 6:
			break;
		}
	};
	this.getBoss = function (name) {
		var i, boss,
			glow = getUnit(2, 131);

		for (i = 0; i < 16; i += 1) {
			boss = getUnit(1, name);

			if (boss) {
				this.chaosPreattack(name, 8);

				return Attack.clear(40, 0, name, this.sort);
			}

			delay(250);
		}

		return !!glow;
	};
	this.vizierSeal = function () {
		me.overhead("Viz layout " + this.vizLayout);
		this.followPath(this.vizLayout === 1 ? this.starToVizA : this.starToVizB);

		if (!this.openSeal(395) || !this.openSeal(396)) {
			me.overhead("Failed to open Vizier seals.");
		}

		if (this.vizLayout === 1) {
			Pather.moveTo(7691, 5292, 0, true);
		} else {
			Pather.moveTo(7695, 5316, 0, true);
		}

		if (!this.getBoss(getLocaleString(2851))) {
			me.overhead("Failed to kill Vizier");
		}
		Pather.moveTo(7716, 5295, 0, true);
		troopsNearMe2();
		Pather.moveTo(7759, 5291, 0, true);
		troopsNearMe2();
		Pather.moveTo(7734, 5295, 0, true);
		troopsNearMe2();
		return true;
	};

	this.seisSeal = function () {
		me.overhead("Seis layout " + this.seisLayout);
		this.followPath(this.seisLayout === 1 ? this.starToSeisA : this.starToSeisB);

		if (!this.openSeal(394)) {
			me.overhead("Failed to open de Seis seal.");
		}

		if (this.seisLayout === 1) {
			Pather.moveTo(7820, 5158, 0, true);
			Pather.moveTo(7813, 5189, 0, true);
			Pather.moveTo(7778, 5195, 0, true);
			Pather.moveTo(7777, 5215, 0, true);
		} else {
			Pather.moveTo(7785, 5154, 0, true);
			Pather.moveTo(7775, 5162, 0, true);
		}

		if (!this.getBoss(getLocaleString(2852))) {
			me.overhead("Failed to kill de Seis");
		}
		
		
		Pather.moveTo(7802, 5237, 0, true);
		troopsNearMe2();
		Pather.moveTo(7805, 5258, 0, true);
		troopsNearMe2();
		Pather.moveTo(7781, 5259, 0, true);
		troopsNearMe2();
		Pather.moveTo(7801, 5263, 0, true);
		troopsNearMe2();
		Pather.moveTo(7828, 5284, 0, true);
		
		return true;
	};

	this.infectorSeal = function () {
		me.overhead("Inf layout " + this.infLayout);
		this.followPath(this.infLayout === 1 ? this.starToInfA : this.starToInfB);

		if (!this.openSeal(392)) {
			me.overhead("Failed to open Infector seals.");
		}

		if (this.infLayout === 1) {
			delay(1);
		} else {
			Pather.moveTo(7928, 5295, 0, true); // temp
		}

		if (!this.getBoss(getLocaleString(2853))) {
			me.overhead("Failed to kill Infector");
		}

		if (!this.openSeal(393)) {
			me.overhead("Failed to open Infector seals.");
		}
		//Pather.moveTo(7791, 5299);
		Pather.moveTo(7852, 5280);
		troopsNearMe2();
		Pather.moveTo(7834, 5306);
		troopsNearMe2();
		Pather.moveTo(7759, 5295);
		troopsNearMe2();
		return true;
	};
	this.diabloPrep = function () {
		var trapCheck,
			tick = getTickCount();

		while (getTickCount() - tick < 30000) {
			if (getTickCount() - tick >= 8000) {
				switch (me.classid) {
				case 1: // Sorceress
					if ([56, 59, 64].indexOf(Config.AttackSkill[1]) > -1) {
						if (me.getState(121)) {
							delay(500);
						} else {
							Skill.cast(Config.AttackSkill[1], 0, 7793, 5293);
						}

						break;
					}

					delay(500);

					break;
				case 3: // Paladin
					Skill.setSkill(Config.AttackSkill[2]);
					Skill.cast(Config.AttackSkill[1], 1);

					break;
				case 5: // Druid
					if (Config.AttackSkill[1] === 245) {
						Skill.cast(Config.AttackSkill[1], 0, 7793, 5293);

						break;
					}

					delay(500);

					break;
				case 6: // Assassin
					if (Config.UseTraps) {
						trapCheck = ClassAttack.checkTraps({x: 7793, y: 5293});

						if (trapCheck) {
							ClassAttack.placeTraps({x: 7793, y: 5293, classid: 243}, trapCheck);

							break;
						}
					}

					delay(500);

					break;
				default:
					delay(500);

					break;
				}
			} else {
				delay(500);
			}

			if (getUnit(1, 243)) {
				return true;
			}
		}

		me.overhead("Diablo not found");
		return false;
	};
	this.followPath = function (path) {
		var i;

		for (i = 0; i < path.length; i += 2) {
			/*if (this.cleared.length) {
				this.clearStrays();
			}*/
			
			while(!(troopsInMyArea() >= 2) || troopsNearMe()) { 	// check if everyone is in the same area & near, if not pause 'til they are
				myQuietVoice("...someone has left our area or is out of range. We'll stay put 'til they return.");
				Attack.clear(10, 0, false, false, true);					// clear: function (range, spectype, bossId, sortfunc, pickit)
				delay(1000); 
			}
						
			myQuietVoice("...everybody is in or nearby. We can do it!");

			
			Pather.moveTo(path[i], path[i + 1], 3, 1); 				// (path[i], path[i + 1], 3, getDistance(me, path[i], path[i + 1]) > 50)
			Attack.clear(30, 0, false, this.sort);

			// Push cleared positions so they can be checked for strays
			this.cleared.push([path[i], path[i + 1]]);

			// After 5 nodes go back 2 nodes to check for monsters
			/*if (i === 10 && path.length > 16) {
				path = path.slice(6);
				i = 0;
			}*/
		}
	};

	this.clearStrays = function () {
		/*if (!Config.PublicMode) {
			return false;
		}*/

		var i,
			oldPos = {x: me.x, y: me.y},
			monster = getUnit(1);

		if (monster) {
			do {
				if (Attack.checkMonster(monster)) {
					for (i = 0; i < this.cleared.length; i += 1) {
						if (getDistance(monster, this.cleared[i][0], this.cleared[i][1]) < 30 && Attack.validSpot(monster.x, monster.y)) {
							me.overhead("we got a stray");
							Pather.moveToUnit(monster);
							Attack.clear(15, 0, false, this.sort);

							break;
						}
					}
				}
			} while (monster.getNext());
		}

		if (getDistance(me, oldPos.x, oldPos.y) > 5) {
			Pather.moveTo(oldPos.x, oldPos.y);
		}

		return true;
	};

	this.defendPlayers = function () {
		var player,
			oldPos = {x: me.x, y: me.y},
			monster = getUnit(1);

		if (monster) {
			do {
				if (Attack.checkMonster(monster)) {
					player = getUnit(0);

					if (player) {
						do {
							if (player.name !== me.name && getDistance(monster, player) < 30) {
								me.overhead("defending players");
								Pather.moveToUnit(monster);
								Attack.clear(15, 0, false, this.sort);
							}
						} while (player.getNext());
					}
				}
			} while (monster.getNext());
		}

		if (getDistance(me, oldPos.x, oldPos.y) > 5) {
			Pather.moveTo(oldPos.x, oldPos.y);
		}

		return true;
	};

	
	this.cleared = [];

	// path coordinates
	this.entranceToStar = [7790, 5526, 7794, 5517, 7791, 5491, 7768, 5459, 7775, 5424, 7817, 5458, 7777, 5408, 7769, 5379, 7777, 5357, 7809, 5359, 7805, 5330, 7780, 5317, 7791, 5293];
	this.starToVizA = [7759, 5295, 7734, 5295, 7716, 5295, 7718, 5276, 7697, 5292, 7678, 5293, 7665, 5276, 7662, 5314];
	this.starToVizB = [7759, 5295, 7734, 5295, 7716, 5295, 7701, 5315, 7666, 5313, 7653, 5284];
	this.starToSeisA = [7781, 5259, 7805, 5258, 7802, 5237, 7776, 5228, 7775, 5205, 7804, 5193, 7814, 5169, 7788, 5153];
	this.starToSeisB = [7781, 5259, 7805, 5258, 7802, 5237, 7776, 5228, 7811, 5218, 7807, 5194, 7779, 5193, 7774, 5160, 7803, 5154];
	this.starToInfA = [7809, 5268, 7834, 5306, 7852, 5280, 7852, 5310, 7869, 5294, 7895, 5295, 7919, 5290];
	this.starToInfB = [7809, 5268, 7834, 5306, 7852, 5280, 7852, 5310, 7869, 5294, 7895, 5274, 7927, 5275, 7932, 5297, 7923, 5313];

	this.initLayout();
	this.followPath(this.entranceToStar);
	
	Attack.clear(30, 0, false, this.sort);
	this.vizierSeal();
	this.seisSeal();
	Precast.doPrecast(true);
	this.infectorSeal();
	
	switch (me.classid) {
	case 1:
		Pather.moveTo(7792, 5294);

		break;
	default:
		Pather.moveTo(7788, 5292);

		break;
	}

	
	this.diabloPrep();
	Attack.kill(243); // Diablo
	Pickit.pickItems();
	delay(rand(5000,10000));
	return true;
}



	
	
	
	
function d2_ctrme(_tSorc) {		// not fisished
	Town.goToTown(4);
	while(!(troopsInMyArea() == Config.BObarb.Troops.length)) { delay(2000); }
	
	delay(4000);
	say(_tSorc + " ctr");
	
	while(!Pather.usePortal(108, _tSorc)) { delay(750); } // as soon as sorc's portal opens, use the portal
	delay(250);
	Pather.makePortal();
	
	
	while(!(troopsInMyArea() >= (Config.BObarb.Troops.length - 1))) { 							// check if everyone is in the same area & near, if not pause 'til they are
		myQuietVoice("...someone has left our area or is out of range. We'll stay put 'til they return.");
		Attack.clear(8, 0, false, false, true);					// clear: function (range, spectype, bossId, sortfunc, pickit)
		delay(750); 
	}
		
		
	this.sort = function (a, b) {
		// Entrance to Star / De Seis
		if (me.y > 5325 || me.y < 5260) {
			if (a.y > b.y) {
				return -1;
			}

			return 1;
		}

		// Vizier
		if (me.x < 7765) {
			if (a.x > b.x) {
				return -1;
			}

			return 1;
		}

		// Infector
		if (me.x > 7825) {
			if (!checkCollision(me, a, 0x1) && a.x < b.x) {
				return -1;
			}

			return 1;
		}

		return getDistance(me, a) - getDistance(me, b);
	};
	
	this.getLayout = function (seal, value) {
		var sealPreset = getPresetUnit(108, 2, seal);

		if (!seal) {
			me.overhead("Seal preset not found. Can't continue.");
		}

		if (sealPreset.roomy * 5 + sealPreset.y === value || sealPreset.roomx * 5 + sealPreset.x === value) {
			return 1;
		}

		return 2;
	};

	this.initLayout = function () {
		this.vizLayout = this.getLayout(396, 5275);
		this.seisLayout = this.getLayout(394, 7773);
		this.infLayout = this.getLayout(392, 7893);
	};
	
	this.openSeal = function (classid) {
		var i, seal, warn;

		switch (classid) {
		case 396:
		case 394:
		case 392:
			warn = true;

			break;
		default:
			warn = false;

			break;
		}

		for (i = 0; i < 5; i += 1) {
			Pather.moveToPreset(108, 2, classid, classid === 394 ? 5 : 2, classid === 394 ? 5 : 0);

			seal = getUnit(2, classid);
			warn = false;
			
			if (classid === 394) {
				Misc.click(0, 0, seal);
			} else {
				seal.interact();
			}
			
			delay(classid === 394 ? 1000 : 500);

			if (!seal.mode) {
				if (classid === 394 && Attack.validSpot(seal.x + 15, seal.y)) { // de seis optimization
					Pather.moveTo(seal.x + 15, seal.y);
				} else {
					Pather.moveTo(seal.x - 5, seal.y - 5);
				}

				delay(500);
			} else {
				return true;
			}
		}

		return false;
	};
	this.chaosPreattack = function (name, amount) {
		var i, n, target, positions;

		switch (me.classid) {
		case 0:
			break;
		case 1:
			break;
		case 2:
			break;
		case 3:
			target = getUnit(1, name);

			if (!target) {
				return;
			}

			positions = [[6, 11], [0, 8], [8, -1], [-9, 2], [0, -11], [8, -8]];

			for (i = 0; i < positions.length; i += 1) {
				if (Attack.validSpot(target.x + positions[i][0], target.y + positions[i][1])) { // check if we can move there
					Pather.moveTo(target.x + positions[i][0], target.y + positions[i][1]);
					Skill.setSkill(Config.AttackSkill[2], 0);

					for (n = 0; n < amount; n += 1) {
						Skill.cast(Config.AttackSkill[1], 1);
					}

					break;
				}
			}

			break;
		case 4:
			break;
		case 5:
			break;
		case 6:
			break;
		}
	};
	this.getBoss = function (name) {
		var i, boss,
			glow = getUnit(2, 131);

		for (i = 0; i < 16; i += 1) {
			boss = getUnit(1, name);

			if (boss) {
				this.chaosPreattack(name, 8);

				return Attack.clear(40, 0, name, this.sort);
			}

			delay(250);
		}

		return !!glow;
	};
	this.vizierSeal = function () {
		me.overhead("Viz layout " + this.vizLayout);
		this.followPath(this.vizLayout === 1 ? this.starToVizA : this.starToVizB, false); // false: no deleay btwn teleing

		if (!this.openSeal(395) || !this.openSeal(396)) {
			me.overhead("Failed to open Vizier seals.");
		}

		if (this.vizLayout === 1) {
			Pather.moveTo(7691, 5292, 0, true);
		} else {
			Pather.moveTo(7695, 5316, 0, true);
		}

		if (!this.getBoss(getLocaleString(2851))) {
			me.overhead("Failed to kill Vizier");
		}
		return true;
	};

	this.seisSeal = function () {
		me.overhead("Seis layout " + this.seisLayout);
		this.followPath(this.seisLayout === 1 ? this.starToSeisA : this.starToSeisB, false);

		if (!this.openSeal(394)) {
			me.overhead("Failed to open de Seis seal.");
		}

		if (this.seisLayout === 1) {
			Pather.moveTo(7820, 5158, 0, true);
			Pather.moveTo(7813, 5189, 0, true);
			Pather.moveTo(7778, 5195, 0, true);
			Pather.moveTo(7777, 5215, 0, true);
		} else {
			Pather.moveTo(7785, 5154, 0, true);
			Pather.moveTo(7775, 5162, 0, true);
		}

		if (!this.getBoss(getLocaleString(2852))) {
			me.overhead("Failed to kill de Seis");
		}
		return true;
	};

	this.infectorSeal = function () {
		me.overhead("Inf layout " + this.infLayout);
		this.followPath(this.infLayout === 1 ? this.starToInfA : this.starToInfB, false);

		if (!this.openSeal(392)) {
			me.overhead("Failed to open Infector seals.");
		}

		if (this.infLayout === 1) {
			delay(1);
		} else {
			Pather.moveTo(7928, 5295, 0, true); // temp
		}

		if (!this.getBoss(getLocaleString(2853))) {
			me.overhead("Failed to kill Infector");
		}

		if (!this.openSeal(393)) {
			me.overhead("Failed to open Infector seals.");
		}
		return true;
	};
	this.diabloPrep = function () {
		var trapCheck,
			tick = getTickCount();

		while (getTickCount() - tick < 30000) {
			if (getTickCount() - tick >= 8000) {
				switch (me.classid) {
				case 1: // Sorceress
					if ([56, 59, 64].indexOf(Config.AttackSkill[1]) > -1) {
						if (me.getState(121)) {
							delay(500);
						} else {
							Skill.cast(Config.AttackSkill[1], 0, 7793, 5293);
						}

						break;
					}

					delay(500);

					break;
				case 3: // Paladin
					Skill.setSkill(Config.AttackSkill[2]);
					Skill.cast(Config.AttackSkill[1], 1);

					break;
				case 5: // Druid
					if (Config.AttackSkill[1] === 245) {
						Skill.cast(Config.AttackSkill[1], 0, 7793, 5293);

						break;
					}

					delay(500);

					break;
				case 6: // Assassin
					if (Config.UseTraps) {
						trapCheck = ClassAttack.checkTraps({x: 7793, y: 5293});

						if (trapCheck) {
							ClassAttack.placeTraps({x: 7793, y: 5293, classid: 243}, trapCheck);

							break;
						}
					}

					delay(500);

					break;
				default:
					delay(500);

					break;
				}
			} else {
				delay(500);
			}

			if (getUnit(1, 243)) {
				return true;
			}
		}

		me.overhead("Diablo not found");
		return false;
	};
	this.followPath = function (path, _delay) {
		var i;

		for (i = 0; i < path.length; i += 2) {
			/*if (this.cleared.length) {
				this.clearStrays();
			}*/
			
			while(!(troopsInMyArea() >= 2)) { 	// check if everyone is in the same area & near, if not pause 'til they are
				myQuietVoice("...someone has left our area or is out of range. We'll stay put 'til they return.");
				Attack.clear(10, 0, false, false, true);					// clear: function (range, spectype, bossId, sortfunc, pickit)
				delay(1000); 
			}
						
			myQuietVoice("...everybody is in or nearby. We can do it!");

			if((path[i] === undefined) || (path[i + 1] === undefined)) return;
			
			Pather.moveTo(path[i], path[i + 1], 3, 1); 				// (path[i], path[i + 1], 3, getDistance(me, path[i], path[i + 1]) > 50)
			Attack.clear(30, 0, false, this.sort);
			
			if(_delay) delay(rand(2100,3000));
			// Push cleared positions so they can be checked for strays
			
			this.cleared.push([path[i], path[i + 1]]);
			
			// After 5 nodes go back 2 nodes to check for monsters
			/*if (i === 10 && path.length > 16) {
				path = path.slice(6);
				i = 0;
			}*/
		}
	};

	this.clearStrays = function () {
		/*if (!Config.PublicMode) {
			return false;
		}*/

		var i,
			oldPos = {x: me.x, y: me.y},
			monster = getUnit(1);

		if (monster) {
			do {
				if (Attack.checkMonster(monster)) {
					for (i = 0; i < this.cleared.length; i += 1) {
						if (getDistance(monster, this.cleared[i][0], this.cleared[i][1]) < 30 && Attack.validSpot(monster.x, monster.y)) {
							me.overhead("we got a stray");
							Pather.moveToUnit(monster);
							Attack.clear(15, 0, false, this.sort);

							break;
						}
					}
				}
			} while (monster.getNext());
		}

		if (getDistance(me, oldPos.x, oldPos.y) > 5) {
			Pather.moveTo(oldPos.x, oldPos.y);
		}

		return true;
	};

	this.defendPlayers = function () {
		var player,
			oldPos = {x: me.x, y: me.y},
			monster = getUnit(1);

		if (monster) {
			do {
				if (Attack.checkMonster(monster)) {
					player = getUnit(0);

					if (player) {
						do {
							if (player.name !== me.name && getDistance(monster, player) < 30) {
								me.overhead("defending players");
								Pather.moveToUnit(monster);
								Attack.clear(15, 0, false, this.sort);
							}
						} while (player.getNext());
					}
				}
			} while (monster.getNext());
		}

		if (getDistance(me, oldPos.x, oldPos.y) > 5) {
			Pather.moveTo(oldPos.x, oldPos.y);
		}

		return true;
	};

	
	this.cleared = [];

	// path coordinates
	this.entranceToStar	= [7790, 5526, 7794, 5517, 7791, 5491, 7768, 5459, 7775, 5424, 7817, 5458, 7777, 5408, 7769, 5379, 7777, 5357, 7809, 5359, 7805, 5330, 7780, 5317, 7791, 5293];
	this.starToVizA 	= [7759, 5295, 7734, 5295, 7716, 5295, 7718, 5276, 7697, 5292, 7678, 5293, 7665, 5276, 7662, 5314];
	this.starToVizB 	= [7759, 5295, 7734, 5295, 7716, 5295, 7701, 5315, 7666, 5313, 7653, 5284];
	this.starToSeisA 	= [7781, 5259, 7805, 5258, 7802, 5237, 7776, 5228, 7775, 5205, 7804, 5193, 7814, 5169, 7788, 5153];
	this.starToSeisB 	= [7781, 5259, 7805, 5258, 7802, 5237, 7776, 5228, 7811, 5218, 7807, 5194, 7779, 5193, 7774, 5160, 7803, 5154];
	this.starToInfA 	= [7809, 5268, 7834, 5306, 7852, 5280, 7852, 5310, 7869, 5294, 7895, 5295, 7919, 5290];
	this.starToInfB 	= [7809, 5268, 7834, 5306, 7852, 5280, 7852, 5310, 7869, 5294, 7895, 5274, 7927, 5275, 7932, 5297, 7923, 5313];
	
	this.VizToCtr 		= [7718,5312, 7740,5299, 7760,5295, 7776,5273];
	this.SeisToCtr 		= [7777,5238, 7796,5253, 7811,5274];
	this.InfToCtr 		= [7852,5310, 7852,5280, 7849,5288, 7820,5286];
	
	this.initLayout();
	//this.followPath(this.entranceToStar);
	
	Attack.clear(30, 0, false, this.sort);
	this.vizierSeal();
	this.followPath(this.VizToCtr,true); // true: for enabling a delay btwn teleing
	this.seisSeal();
	this.followPath(this.SeisToCtr,true);
	Precast.doPrecast(true);
	this.infectorSeal();
	this.followPath(this.InfToCtr,true);
	
	switch (me.classid) {
	case 1:
		Pather.moveTo(7792, 5294);

		break;
	default:
		Pather.moveTo(7788, 5292);

		break;
	}

	
	this.diabloPrep();
	Attack.kill(243); // Diablo
	Pickit.pickItems();
	
	Town.goToTown(4);
	Town.doChores();
	Town.goToTown(4);	// head to the pandemonium fortress
	Town.move("portalspot");
	delay(rand(5000,10000));
	return true;
} 

function troopsInMyArea() {
	myQuietVoice("...this is the function for waiting for the troops to be where I am.");
	delay(250);
	
	var count = 0;
	var _party = getParty();
	
	do {
		if(_party.area === me.area) count += 1;
	} while (_party.getNext());
	
	return count;
}
function troopsNearMe() {
	myQuietVoice("Checking distance btwn followers and me...");
	delay(4000);
	var _unit, _dist;
	var _oorCount = 0;
	var _outofrange = false;
	
	for (var _i = 0; _i < Config.BObarb.Troops.length; _i += 1) {
		if (Config.BObarb.Troops[_i] !== Config.BObarb) {
			_unit = getUnit(0, Config.BObarb.Troops[_i]);
			_dist = getDistance(me, _unit);
			if (_dist == 0)	{
				if (Config.debugChat) me.overhead("A peep is too far. Going to town, so as to reset troops...");
				if (!me.intown) Town.goToTown();
				Town.doChores();
				delay(10000);
				Town.move("portalspot");
				delay(250);
				Pather.usePortal(null, me.name);
				while(troopsInMyArea() < (Config.BObarb.Troops.length -1)) { Attack.clear(5, 0, false, false, true); }
			}
			if (_dist > 50) _oorCount += 1;
			myQuietVoice("The distance between us is: " + _dist + " | _oorCount: " + _oorCount);
			delay(250);
		}
	}

	if(_oorCount > 0) return _outofrange = true;
	return false;
}
function troopsNearMe2() {
	myQuietVoice("Checking distance btwn followers and me...");
	delay(4000);
	var _unit, _dist;
	
	for (var _i = 0; _i < Config.BObarb.Troops.length; _i += 1) {
		if (Config.BObarb.Troops[_i] !== Config.BObarb) {
			_unit = getUnit(0, Config.BObarb.Troops[_i]);
			_dist = getDistance(me, _unit);
			me.overhead(Config.BObarb.Troops[_i] + " dist: " + _dist);
 			while(_dist === 0 || _dist > 40) {
				Attack.clear(10, 0, false, false, true);
				_unit = getUnit(0, Config.BObarb.Troops[_i]);
				_dist = getDistance(me, _unit);
				delay(rand(250,500));
			}
		}
	}
	return true;
}


function prepTroops(_waypoint) {
	me.overhead("Prepping troops...");
	delay(rand(1000,1700));
	myQuietVoice("me.hpmax: " + me.hpmax + " | Config.meHPmaxOrig: " + Config.meHPmaxOrig); // Config.debugChat
	
	myQuietVoice("Config.BObarb.Troops.length: " + Config.BObarb.Troops.length);
	
	Town.goToTown(4);
	say("yo");
	Town.doChores();
	Pather.moveTo("waypoint");
	delay(10000);
	
	if(!Pather.useWaypoint(_waypoint)) return false;				// head to _waypoint
	Pather.moveTo(me.x + rand(-5, 5) * 2, me.y + rand(-5, 5) * 2);	// move a wee bit, so as to not be on wp
	Pather.makePortal();
	while(!troopsInMyArea()) { delay(2000); }						// wait for the barb and the two sorcies to come to river
	
	myQuietVoice("...everybody is in and waiting...");
	delay(18000);
	say("hulk");
	delay(7000);
	if(Config.debugChat) { 											// Config.chatDebug
		me.overhead("me.hpmax: " + me.hpmax + " | Config.meHPmaxOrig: " + Config.meHPmaxOrig);
		delay(2750);
	}
	say(Config.BObarb.Troops[0]  + " yo-yo");
	delay(5000);

	while(!(troopsInMyArea() >= 2)) { 								// check if everyone is in the same area & near, if not pause 'til they are
		myQuietVoice("...someone has left our area or is out of range. We'll stay put 'til they return.");
		Attack.clear(10, 0, false, false, true);					// clear: function (range, spectype, bossId, sortfunc, pickit)
		delay(1000); 
	}
				
	myQuietVoice("...everybody is in or nearby. We can do it!");
	return true;
}
//
function d2_gatherSkellies() {						// solely for gathering a handful of skellies
	delay(rand(1000,1700));
	Town.goToTown(4);
	prepTroops(107); 
	Town.goToTown();
	
	while(!troopsInMyArea()) { delay(2000); } 		// wait for all to come back to me
	me.overhead("Heading to gather skellies...");
	delay(rand(1000,1700));
	Town.goToTown(5);
	
	while(!troopsInMyArea()) { delay(2000); } 		// wait for all to come back to me
	delay(6000);
	
	if(!Pather.useWaypoint(111)) return false;					// head to Frigid Highlands wp
	delay(250);
	Pather.makePortal();
	
	Precast.doPrecast(true);
	while(!(troopsInMyArea() >= 2)) { 		// check if everyone is in the same area & near, if not pause 'til they are
		myQuietVoice("...someone has left our area or is out of range. We'll stay put 'til they return.");
		Attack.clear(8, 0, false, false, true);					// clear: function (range, spectype, bossId, sortfunc, pickit)
		delay(750); 
	}
	Pather.moveTo(3745, 5084, 3, true);
	Attack.clear(15, 0, getLocaleString(22500)); // Eldritch the Rectifier
	Attack.clear(10, 0, false, false, true);	
	Town.goToTown();	

	return true;
}
// functions which are often used
//
function myQuietVoice(_statement) {
	if(Config.debugChat) {
		me.overhead(_statement);
		delay(250);
	}
	return true;
}
function myWaitForTeam(_complete, _tp) {     // false: wait until followers minus bo barb are near me
																					// true:   wait until the entire party is near to me
	if(!me.intown && _tp) Pather.makePortal();
	switch(_complete) {                                         
		case false:
			while(troopsInMyArea()  < (Config.BObarb.Troops.length - 1)) { 
				if(!me.intown) Attack.clear(5, 0, false, false, true); 
				delay(750);                     
			}
			break;
		case true:
			while(troopsInMyArea()  < Config.BObarb.Troops.length) { 
				if(!me.intown) Attack.clear(5, 0, false, false, true); 
				delay(750);                     
			}				
			break;
	}
	delay(750);
	return true;
}
function myOffOfWP() {
	Pather.moveTo(me.x + rand(-5, 5) * 2, me.y + rand(-5, 5) * 2);	          // move a wee bit, so as to not be on wp
	delay(750);
	return true;
}


