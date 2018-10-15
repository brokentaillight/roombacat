/*
* Follower by kolton
*
* 2018 changes:
*	- follower will check the leader's act and will to it.
*	- when leader makes tp the follower will try to use it and will precast/buff (but you can use either manual Num* on their windows).
*  	- the follower will go after leader in town, using his tp, and will do town activities.
* 
* To initiate the follow sequence make a TP and send command "1".
*
* Commands:
* Main commands:
*	1 	- take leader's tp from town / move to leader's town
*	2 	- take leader's tp to town
*	3 	- town manager
*	c 	- get corpse
*	p 	- pick items
*	yo	- toggle follow
*    yoyo - disable follow, send to town
*    a      - toggle atk, can be called by individual char name
*    aoff/aon - (dis)(en)able atk
*    fin    - leave game
*.   

*	chount, dhuri, thravi, mheph, thhrone
*	chhh	- make a tp at chaos entrance, then kill monsters
*	ctr		- tele to centre and make a tp at star
*	juan	- chaos seal 1
*	choo	- chaos seal 2
*	tree	- chaos seal 3
*	sheals	- chaos all seals
*	bhaal	- tele to throne, hot/safe tp, clear throne waves, then kill baal

*	truffle	- countess, andy, duriel, meph, bhaal

*	<charname> s - toggle stop <charname>
* Attack:
*	a                               - attack toggle for all
*	<charname> a       - attack toggle for <charname>
*	aon                          - attack on for all
*	<charname> aon  - attack on for <charname>
*	aoff                          - attack off for all
*	<charname> aoff  - attack off for <charname>
* Teleport: *** characters without teleport skill will ignore tele command ***
*	tele                           - toggle teleport for all
*	<charname> tele   - toggle teleport for <charname>
*	tele on                      - teleport on for all
*	<charname> tele on     -  teleport on for <charname>
*	tele off                     - teleport off for all
*	<charname> tele off     - teleport off for <charname>
* Skills: *** refer to skills.txt ***
*	all skill <skillid>     - change skill for all. refer to skills.txt
*	<charname> skill <skillid> - change skill for <charname>
*	<class> skill <skillid> - change skill for all characters of certain class *** any part of class name will do *** for example: "sorc skill 36", "zon skill 0", "din skill 106"
* Auras: *** refer to skills.txt ***
*	all aura <skillid>     - change aura for all paladins
*	<charname> aura <skillid> - change aura for <charname>
* Town:
*	a2-5 - move to appropriate act (after quest) !NOTE: Disable 'no sound' or game will crash!
*	talk <npc name>     - talk to a npc in town
* Misc.
*	moo       		- enter red cow portal
*	way         	- all players activate a nearby wp
*	<charname> wp 	- <charname> activates a nearby wp
*	bo          	- barbarian precast
*	<charname> tp 	- make a TP. Needs a TP tome if not using custom libs.
*	ahem     		- move in a random direction (use if you're stuck by followers)
*	reload    		- reload script. Use only in case of emergency, or after editing character config.
*	fini         	- exit game
*/

function Follower() {
	var i, j, stop, leader, leaderUnit, charClass, piece, skill, result, unit, player,
		commanders = [Config.Leader],
		attack = true,
		myAtkDist = 20,
		openContainers = true,
		classes = ["amazon", "sorceress", "necromancer", "paladin", "barbarian", "druid", "assassin"],
		action = "";

	// Get leader's Party Unit
	this.getLeader = function (name) {
		var player = getParty();

		if (player) {
			do {
				if (player.name === name) {
					return player;
				}
			} while (player.getNext());
		}

		return false;
	};

	// Get leader's Unit
	this.getLeaderUnit = function (name) {
		var player = getUnit(0, name);

		if (player) {
			do {
				if (!player.dead) {
					return player;
				}
			} while (player.getNext());
		}

		return false;
	};

	// Get leader's act from Party Unit
	this.checkLeaderAct = function (unit) {
		while(unit.area < 1 || unit.area > 136) {
			unit = this.getLeaderUnit();
			delay(rand(2000,4000));
		}

		if ((unit.area >= 1 && unit.area <= 39) || unit.area == 136) {
			return 1;
		}

		if (unit.area >= 40 && unit.area <= 74) {
			return 2;
		}

		if (unit.area >= 75 && unit.area <= 102) {
			return 3;
		}

		if (unit.area >= 103 && unit.area <= 108) {
			return 4;
		}
		
		if (unit.area >= 109 && unit.area <= 135) {
			return 5;
		}
		return 4;
	};

	// Change areas to where leader is
	this.checkExit = function (unit, area) {
		if (unit.inTown) {
			return false;
		}

		var i, target,
			exits = getArea().exits;

		for (i = 0; i < exits.length; i += 1) {
			if (exits[i].target === area) {
				return 1;
			}
		}

		if (unit.inTown) {
			target = getUnit(2, "waypoint");

			if (target && getDistance(me, target) < 20) {
				return 3;
			}
		}

		target = getUnit(2, "portal");

		if (target) {
			do {
				if (target.objtype === area) {
					Pather.usePortal(null, null, target);

					return 2;
				}
			} while (target.getNext());
		}

		// Arcane<->Cellar portal
		if ((me.area === 74 && area === 54) || (me.area === 54 && area === 74)) {
			Pather.usePortal(null);

			return 4;
		}

		// Tal-Rasha's tomb->Duriel's lair
		if (me.area >= 66 && me.area <= 72 && area === 73) {
			Pather.useUnit(2, 100, area);

			return 4;
		}

		// Throne->Chamber
		if (me.area === 131 && area === 132) {
			target = getUnit(2, 563);

			if (target) {
				Pather.usePortal(null, null, target);

				return 4;
			}
		}

		return false;
	};

	// Talk to a NPC
	this.talk = function (name) {
		if (!me.inTown) {
			me.overhead("ÿc1I'm not in town!");

			return false;
		}

		if (typeof name === "string") {
			name = name.toLowerCase();
		} else {
			me.overhead("ÿc1No NPC name given.");

			return false;
		}

		var npc, names;

		switch (me.act) {
		case 1:
			names = ["gheed", "charsi", "akara", "kashya", "cain", "warriv"];

			break;
		case 2:
			names = ["fara", "lysander", "greiz", "elzix", "jerhyn", "meshif", "drognan", "atma", "cain"];

			break;
		case 3:
			names = ["alkor", "asheara", "ormus", "hratli", "cain"];

			break;
		case 4:
			names = ["halbu", "tyrael", "jamella", "cain"];

			break;
		case 5:
			names = ["larzuk", "malah", "qual-kehk", "anya", "nihlathak", "cain"];

			break;
		}

		if (names.indexOf(name) === -1) {
			me.overhead("ÿc1Invalid NPC.");

			return false;
		}

		if (!Town.move(name === "jerhyn" ? "palace" : name)) {
			Town.move("portalspot");
			me.overhead("ÿc1Failed to move to town spot.");

			return false;
		}

		npc = getUnit(1);

		if (npc) {
			do {
				if (npc.name.replace(/ /g, "").toLowerCase().indexOf(name) > -1) {
					npc.openMenu();
					me.cancel();
					Town.move("portalspot");
					me.overhead("ÿc2Done talking.");

					return true;
				}
			} while (npc.getNext());
		}

		me.overhead("ÿc1NPC not found.");
		Town.move("portalspot");

		return false;
	};

	// Change act after completing last act quest
	this.changeAct = function (act) {
		var npc, preArea, target;

		preArea = me.area;

		switch (act) {
		case 2:
			if (me.area >= 40) {
				break;
			}

			Town.move("warriv");

			npc = getUnit(1, 155);

			if (npc) {
				npc.openMenu();
				Misc.useMenu(0x0D36);
			}

			break;
		case 3:
			if (me.area >= 75) {
				break;
			}

			Town.move("palace");

			npc = getUnit(1, 201);

			if (npc) {
				npc.openMenu();
				me.cancel();
			}

			Town.move("meshif");

			npc = getUnit(1, 210);

			if (npc) {
				npc.openMenu();
				Misc.useMenu(0x0D38);
			}

			break;
		case 4:
			if (me.area >= 103) {
				break;
			}

			if (me.inTown) {
				Town.move("cain");

				npc = getUnit(1, 245);

				if (npc) {
					npc.openMenu();
					me.cancel();
				}

				Town.move("portalspot");
				Pather.usePortal(102, null);
			}

			delay(1500);

			target = getUnit(2, 342);

			if (target) {
				Pather.moveTo(target.x - 3, target.y - 1);
			}

			Pather.usePortal(null);

			break;
		case 5:
			if (me.area >= 109) {
				break;
			}

			Town.move("tyrael");

			npc = getUnit(1, "tyrael");

			if (npc) {
				npc.openMenu();
				me.cancel();

				try {
					Pather.useUnit(2, 566, 109);
				} catch (a5e) {

				}
			}

			break;
		}

		delay(2000);

		while (!me.area) {
			delay(500);
		}

		if (me.area === preArea) {
			me.cancel();
			Town.move("portalspot");
			me.overhead("ÿc1Act change failed.");

			return false;
		}

		Town.move("portalspot");
		me.overhead("ÿc8Act change successful.");

		if (act === 2) {
			me.overhead("Don't forget to talk to Drognan after getting the Viper Amulet!");
		}

		return true;
	};

	this.pickPotions = function (range) {
		if (me.dead) {
			return false;
		}

		Town.clearBelt();

		while (!me.idle) {
			delay(40);
		}

		var status,
			pickList = [],
			item = getUnit(4);

		if (item) {
			do {
				if ((item.mode === 3 || item.mode === 5) && item.itemType >= 76 && item.itemType <= 78 && getDistance(me, item) <= range) {
					pickList.push(copyUnit(item));
				}
			} while (item.getNext());
		}

		pickList.sort(Pickit.sortItems);

		while (pickList.length > 0) {
			item = pickList.shift();

			if (item && copyUnit(item).x) {
				status = Pickit.checkItem(item).result;

				if (status && Pickit.canPick(item)) {
					Pickit.pickItem(item, status);
				}
			}
		}

		return true;
	};

	this.openContainers = function (range) {
		var unit, ox, oy,
			unitList = [],
			containers = ["chest", "loose rock", "hidden stash", "loose boulder", "corpseonstick", "casket", "armorstand", "weaponrack", "barrel", "holeanim",
							"roguecorpse", "ratnest", "corpse", "goo pile", "largeurn", "urn", "chest3", "jug", "skeleton", "guardcorpse", "sarcophagus",
							"cocoon", "basket", "stash", "hollow log", "hungskeleton", "pillar", "skullpile", "skull pile", "jar3", "jar2", "jar1", "bonechest", "woodchestl",
							"woodchestr", "barrel wilderness", "burialchestr", "burialchestl", "explodingchest", "chestl", "chestr", "icecavejar1", "icecavejar2",
							"icecavejar3", "icecavejar4", "deadperson", "deadperson2", "evilurn", "tomb1l", "tomb3l", "tomb2", "tomb3", "object2", "groundtomb", "groundtombl"
						];

		ox = me.x;
		oy = me.y;
		unit = getUnit(2);

		if (unit) {
			do {
				if (containers.indexOf(unit.name.toLowerCase()) > -1 && unit.mode === 0 && getDistance(me, unit) <= range) {
					unitList.push(copyUnit(unit));
				}
			} while (unit.getNext());
		}

		while (unitList.length > 0) {
			unitList.sort(Sort.units);

			unit = unitList.shift();

			if (unit) {
				Misc.openChest(unit);
				Pickit.pickItems();
			}
		}

		return true;
	};

	this.chatEvent = function (nick, msg) {
		if (msg && nick === Config.Leader) {
			switch (msg) {
			//
			// commands for followers
			// tele, tele off, tele on
			// a 		: toggles atk
			// aon/aoff : atk on/off
			// flash 	: not sure?
			// fin		: quit game
			// yo		: toggles follow
			// yoyo		: stops follower, sends to town thru leader's tp, does town chores
			//
				case "tele":
				case me.name + " tele":
					if (Pather.teleport) {
						Pather.teleport = false;
						me.overhead("ÿc1Teleport off.");
					} else {
						Pather.teleport = true;
						me.overhead("ÿc2Teleport on.");
					}
					break;
				case "tele off":
				case me.name + " tele off":
					Pather.teleport = false;
					me.overhead("ÿc1Teleport off.");
					break;
				case "tele on":
				case me.name + " tele on":
					Pather.teleport = true;
					me.overhead("ÿc2Teleport on.");
					break;
				case "a":
				case me.name + " a":
					if (attack) {
						attack = false;
						me.overhead("ÿc1Attack off.");
					} else {
						attack = true;
						me.overhead("ÿc2Attack on.");
					}
					break;
				case "flash":
					Packet.flash(me.gid);
					break;
				case "aoff":
				case me.name + " aoff":
					attack = false;
					me.overhead("ÿc1Attack off.");
					break;
				case "aon":
				case me.name + " aon":
					attack = true;
					me.overhead("ÿc2Attack on.");
					break;
				case "fin":
				case me.name + " fin":
					quit();
					break;
				case "yo":
				case me.name + " yo":
					stop = false;
					me.overhead("ÿc2Resuming.");	
					break;
				case "yoyo":
				case me.name + " yoyo":
					stop = true;
					me.overhead("ÿc1Stopping.");
					break;
				case "yo-yo":
				case me.name + " yo-yo":
					stop = true;
					me.overhead("ÿc1Stopping.");
					delay(rand(1000,1200));
					Pather.usePortal(null, null);
					delay(rand(1000,1200));
					while(!me.inTown) {
						Pather.usePortal(null, null);
						delay(rand(1450,2100));
					}
					delay(rand(1000,1200));
					Town.doChores();
					Town.move("portalspot");	
					break;
				case "kitkat":
				case me.name + " kitkat":
					if (me.inTown || me.classid === 4) break;
					Attack.clearLevel(0);
					break;

			//
			// commands for followers
			// ahchoo
			// act1: den, hole, pit, count, andy
			// act2: duri
			// act3: meph
			// act4: entrance, ctr, seals
			// act5: anc, throne, baal
			//
				case "ahchoo":
				case me.name + " ahchoo":
					d2_clearArea();
					break;
				case "ahchoo2":
				case me.name + " ahchoo2":
					d2_clearNearMe();
					break;
				case "den":
				case me.name + " den":
					if(me.classid == 1) d2_act1den();
					break;
				case "hole":
				case me.name + " hole":
					if(me.classid == 1) d2_act1hole();
					break;
				case "pit":
				case me.name + " pit":
					if(me.classid == 1) d2_act1pit();
					break;
				case "count":
				case me.name + " count":
					if(me.classid == 1) d2_Countess();
					break;
				case "andy":
				case me.name + " andy":
					if(me.classid == 1) d2_Andy();
					break;
				case "duri":
				case me.name + " duri":
					d2_Duriel();
					break;
				case "meph":
				case me.name + " meph":
					if(me.classid == 1) d2_Meph();
					break;
				case "entrance":
				case me.name + " entrance":
					if(me.classid == 1) d2_ChaosEnt();
					break;
				case "ctr":
				case me.name + " ctr":
					if(me.classid == 1) d2_tele2ChaosCtr();
					break;
				case "seals":
				case me.name + " seals":
					if(me.classid == 1) d2_ChaosOpenSeals();
					break;
				case "anc":
				case me.name + " anc":
					if(me.classid == 1) d2_Ancients();
					break;
				case "throne":
				case me.name + " throne":
					if(me.classid == 1) d2_throne();
					break;
				case "baal":
				case me.name + " baal":
					if(me.classid == 1) d2_Baal();
					break;
				case "pindle":
				case me.name + " pindle":
					if(me.classid == 1) d2_Pindleskin();
					break;
				case "truffle":
				case me.name + " truffle":
					if(me.classid == 1) {
						d2_Countess();
						d2_towndly();
						d2_Andy();
						d2_towndly();
						d2_Duriel();
						d2_towndly();
						d2_Meph();
						d2_towndly();
						d2_Baal();
						d2_towndly();
					}
					break;
	//
	// quest helper
	// thrush: enables rusher
	// act1: rcain, malus
	// act2: rada, staff, summoner, orifice
	//
				case "rmini":
				case me.name + " rmini":
					if(me.classid == 1) d2_rush("rmini");
					break;
				case "rmax":
				case me.name + " rmax":
					if(me.classid == 1) d2_rush("rmax");
					break;
				case "randariel": // enables rusher
				case me.name + " randariel":
					if(me.classid == 1) d2_rush("randariel");
					break;
				case "rradament": // help to get the Rada book
				case me.name + " rradament":
					if(me.classid == 1) d2_rush("rradament");
					break;
				case "rstaff": // help to get the staff
				case me.name + " rstaff":
					if(me.classid == 1) d2_rush("rstaff");
					break;
				case "ramulet": // help to get the staff
				case me.name + " ramulet":
					if(me.classid == 1) d2_rush("ramulet");
					break;
				case "rsummoner": // help to get the summoner
				case me.name + " rsummoner":
					if(me.classid == 1) d2_rush("rsummoner");
					break;
				case "rduriel": // help to get to the orifice
				case me.name + " rduriel": 
					if(me.classid == 1) d2_rush("rduriel");
					break;
				case "rtravincal": // help to get to the orifice
				case me.name + " rtravincal": 
					if(me.classid == 1) d2_rush("rtravincal");
					break;
				case "rmephisto": // help to get to the orifice
				case me.name + " rmephisto": 
					if(me.classid == 1) d2_rush("rmephisto");
					break;	
				case "rizual": // help to get to shenk
				case me.name + " rizual":
					if(me.classid == 1) d2_rush("rizual");
					break;
				case "rdiablo": // help to get to shenk
				case me.name + " rdiablo":
					if(me.classid == 1) d2_rush("rdiablo");
					break;
				case "rshenk": // help to get to shenk
				case me.name + " rshenk":
					if(me.classid == 1) d2_rush("rshenk");
					break;
				case "ranya": // help to get anya
				case me.name + " ranya":
					if(me.classid == 1) d2_rush("ranya");
					break;
				case "rancients": // help to get ancients
				case me.name + " rancients":
					if(me.classid == 1) d2_rush("rancients");
					break;
				case "rbaal": // help to get baal
				case me.name + " rbaal":
					if(me.classid == 1) d2_rush("rbaal");
					break;
				default:
					if (me.classid === 3 && msg.indexOf("aura ") > -1) {
						piece = msg.split(" ")[0];

						if (piece === me.name || piece === "all") {
							skill = parseInt(msg.split(" ")[2], 10);

							if (me.getSkill(skill, 1)) {
								me.overhead("ÿc3Active aura is: " + skill);

								Config.AttackSkill[2] = skill;
								Config.AttackSkill[4] = skill;

								Skill.setSkill(skill, 0);
								//Attack.init();
							} else {
								me.overhead("ÿc1I don't have that aura.");
							}
						}

						break;
					}

					if (msg.indexOf("skill ") > -1) {
						piece = msg.split(" ")[0];

						if (charClass.indexOf(piece) > -1 || piece === me.name || piece === "all") {
							skill = parseInt(msg.split(" ")[2], 10);

							if (me.getSkill(skill, 1)) {
								me.overhead("Attack skill is: " + skill);

								Config.AttackSkill[1] = skill;
								Config.AttackSkill[3] = skill;

								//Attack.init();
							} else {
								me.overhead("ÿc1I don't have that skill.");
							}
						}
						break;
					}
					action = msg;
					break;
				}
			}

			if (msg && msg.split(" ")[0] === "leader" && commanders.indexOf(nick) > -1) {
				piece = msg.split(" ")[1];

				if (typeof piece === "string") {
					if (commanders.indexOf(piece) === -1) {
						commanders.push(piece);
					}

					me.overhead("ÿc4Switching leader to " + piece);

					Config.Leader = piece;
					leader = this.getLeader(Config.Leader);
					leaderUnit = this.getLeaderUnit(Config.Leader);
				}
			}
	};

	addEventListener("chatmsg", this.chatEvent);

	// Override config values that use TP
	Config.TownCheck = false;
	Config.TownHP = 0;
	Config.TownMP = 0;
	charClass = classes[me.classid];

	for (i = 0; i < 20; i += 1) {
		leader = this.getLeader(Config.Leader);

		if (leader) {
			break;
		}

		delay(1000);
	}

	if (!leader) {
		me.overhead("ÿc1Leader not found.");
		delay(1000);
		quit();
	} else {
		me.overhead("ÿc2Leader found.");
	}

	while (!Misc.inMyParty(Config.Leader)) {
		delay(500);
	}

	me.overhead("ÿc2Partied.");
	// Main Loop
	while (Misc.inMyParty(Config.Leader)) {
		while (stop) {
			delay(500);
		}

		if (!me.inTown) {
			if (!leaderUnit || !copyUnit(leaderUnit).x) {
				leaderUnit = this.getLeaderUnit(Config.Leader);

				if (leaderUnit) {
					me.overhead("ÿc2Leader unit found.");
				}
			}

			if (!leaderUnit) {
				player = getUnit(0);

				if (player) {
					do {
						if (player.name !== me.name) {
							Pather.moveToUnit(player);

							break;
						}
					} while (player.getNext());
				}
			}

			if (leaderUnit && getDistance(me.x, me.y, leaderUnit.x, leaderUnit.y) <= 100 ) { // dEdit: changed <= 60 to != 0
				if (getDistance(me.x, me.y, leaderUnit.x, leaderUnit.y) > 4) {
					me.overhead("ÿc7leader's disance is: " + (getDistance(me.x, me.y, leaderUnit.x, leaderUnit.y)));
					delay(250)
					Pather.moveToUnit(leaderUnit);
				}
			}
		
			if (attack) {
				Attack.clear(myAtkDist, false, false, false, true);
				this.pickPotions(20);
			}
			
			Pickit.pickItems();
			this.openContainers(20);
			
			if (me.classid === 3 && Config.AttackSkill[4] > 0) {
				Skill.setSkill(Config.AttackSkill[4], 0);
			}

			if (leader.area !== me.area && !me.inTown) {
				while (leader.area === 0) {
					delay(100);
				}

				result = this.checkExit(leader, leader.area);

				switch (result) {
				case 1:
					me.overhead("Taking exit.");
					delay(500);
					Pather.moveToExit(leader.area, true);

					break;
				case 2:
					me.overhead("Taking portal.");

					break;
				case 3:
					me.overhead("Taking waypoint.");
					delay(500);
					Pather.useWaypoint(leader.area, true);

					break;
				case 4:
					me.overhead("Special transit.");

					break;
				}

				while (me.area === 0) {
					delay(100);
				}

				leaderUnit = this.getLeaderUnit(Config.Leader);
			}
			if (leader.inTown && this.checkLeaderAct(leader) == me.act) {
				delay(150);
				me.overhead("ÿc4Going to town.");
				Pather.usePortal(null, leader.name);
				me.overhead("ÿc4Running town chores");
				Town.doChores();
				me.overhead("ÿc2Ready");
				Town.move("portalspot");
			}			
		}
		if (me.inTown) {
			if (this.checkLeaderAct(leader) !== me.act) {
				me.overhead("ÿc8Going to leader's town.");
				Town.goToTown(this.checkLeaderAct(leader));
				me.overhead("ÿc2Ready");
				Town.move("portalspot");
			} 
			if (!leader.inTown && (this.checkLeaderAct(leader) === me.act)) {
				me.overhead("ÿc2Ready");
				Town.move("portalspot");
				me.overhead("ÿc2Going outside.");
				delay(750);
				
				while(!Pather.usePortal(leader.area, leader.name) && (!leader.inTown && (this.checkLeaderAct(leader) === me.act))) { // dEdit: replaced leader.area with null
					delay(rand(750,1100));
				}
				me.overhead("ÿc2Precast");
				
				Precast.doPrecast(true);
				if(leader.area !== me.area) {
					Town.goToTown(this.checkLeaderAct(leader));
					me.overhead("ÿc2Ready");
					Town.move("portalspot");
				}
				else if(leader.area === me.area) {
					while (!this.getLeaderUnit(Config.Leader) && !me.dead) {
						Attack.clear(10);
						delay(200);
					}
				}
			}			
		}
				
		switch (action) {
			case "loc":
			case me.name + " loc":
				me.overhead("x,y coords: " + me.x + ", " + me.y);
				break;
			case "moo":					// dEdit cow
			case me.name + " moo":
				if (me.area === 1) {
					Town.move("portalspot");

					if (!Pather.usePortal(39)) {
						me.overhead("ÿc1Failed to use cow portal.");
					}
				}

				break;
			case "ahem":
			case me.name + " ahem":		// dEdit move
				Pather.moveTo(me.x + rand(-5, 5), me.y + rand(-5, 5));
				delay(1000);			// dEdit: added the delay
				break;
			case "way":					// dEdit: wp
			case me.name + " way":
				if (me.inTown) break;
				delay(rand(1, 3) * 500);
				unit = getUnit(2, "waypoint");

				if (unit) {
		WPLoop:
					for (i = 0; i < 3; i += 1) {
						if (getDistance(me, unit) > 3) {
							Pather.moveToUnit(unit);
						}

						unit.interact();

						for (j = 0; j < 100; j += 1) {
							if (j % 20 === 0) {
								me.cancel();
								delay(300);
								unit.interact();
							}

							if (getUIFlag(0x14)) {
								break WPLoop;
							}

							delay(10);
						}
					}
				}

				if (getUIFlag(0x14)) {
					me.overhead("ÿc2Got wp.");
				} else {
					me.overhead("ÿc1Failed to get wp.");
				}

				me.cancel();

				break;
			case "c":
				if (!me.inTown) {
					Town.getCorpse();
				}

				break;
			case "p":
				me.overhead("ÿc4!Picking items.");
				Pickit.pickItems();

				if (openContainers) {
					this.openContainers(20);
				}

				me.overhead("ÿc2!Done picking.");

				break;
			case "1":
				if (me.inTown && leader.inTown && this.checkLeaderAct(leader) !== me.act) {
					me.overhead("ÿc8Going to leader's town.");
					Town.goToTown(this.checkLeaderAct(leader));
					Town.move("portalspot");
				} else if (me.inTown) {
					me.overhead("ÿc2Going outside.");
					delay(rand(3000,4000));
					me.overhead("ÿc7Leader is in act: " + this.checkLeaderAct(leader));
					delay(400)
					Town.goToTown(this.checkLeaderAct(leader));
					delay(400);
					Town.move("portalspot");

					if (!Pather.usePortal(null, leader.name)) {
						break;
					}

					while (!this.getLeaderUnit(Config.Leader) && !me.dead) {
						Attack.clear(10);
						delay(200);
					}
				}

				break;
			case "2":
				if (!me.inTown) {
					delay(150);
					me.overhead("ÿc4Going to town.");
					Pather.usePortal(null, leader.name);
				}

				break;
			case "3":
				if (me.inTown) {
					me.overhead("ÿc4Running town chores");
					Town.doChores();
					Town.move("portalspot");
					me.overhead("ÿc2Ready");
				}

				break;
			case "h":
				if (me.classid === 4) {
					Skill.cast(130);
				}

				break;
			case "hulk":
			case me.name + " hulk":
				if (me.inTown && me.classid === 4) break;
				Precast.doPrecast(true);
				break;
			case "bo":
				if (me.classid === 4) {
					Precast.doPrecast(true);
				}

				break;
			case "a2":
			case "a3":
			case "a4":
			case "a5":
				this.changeAct(parseInt(action[1], 10));

				break;
			case me.name + " tp":
				unit = me.findItem("tbk", 0, 3);

				if (unit && unit.getStat(70)) {
					unit.interact();

					break;
				}

				unit = me.findItem("tsc", 0, 3);

				if (unit) {
					unit.interact();

					break;
				}

				me.overhead("ÿc1No TP scrolls or tomes.");

				break;
		}

		if (action.indexOf("talk") > -1) {
			this.talk(action.split(" ")[1]);
		}

		action = "";

		delay(100);
	}

	return true;
}
//
//
//
function d2_towndly() {
	if (!me.inTown) Town.goToTown();
	me.overhead("ÿc4Running town chores");
	Town.doChores();
	Town.move("portalspot");
	var tmp_dly = (6000 + (Math.floor(Math.random() * 4000)))
	me.overhead("ÿc2Taking a little break for " + tmp_dly);
	delay(tmp_dly);
	me.overhead("ÿc3Ready...");
	delay(500);
	return true;
}
function d2_mytowning() {
	Pather.makePortal();
	delay(250);
	if(!Pather.usePortal(null, me.name)) Town.goToTown();
	return true;
}
function d2_clearArea() {
	if(me.inTown) {
		me.overhead("ÿc4I am in town you noob...");
		return 0;
	}
	me.overhead("ÿc4Clearing area: " + me.area);
	Attack.clearLevel(0); // clears 0: all | oxF: skip normal | ox7: champions/bosses
	return 0;
}
function d2_clearNearMe() {
	if(me.inTown) {
		me.overhead("ÿc4I am in town you noob...");
		return 0;
	}
	me.overhead("ÿc4Clearing near to you: " + me.area);
	Attack.clear(60,0,0,0,true); // dEdit: clear: function (range, spectype, bossId, sortfunc, pickit)
	return 0;
}
function d2_Countess() {
	me.overhead("ÿc4Heading to the Countess");
	Pather.useWaypoint(6);
	Precast.doPrecast(true);
	
	var i, poi, x_count, y_count;	
	if (!Pather.moveToExit([20, 21, 22, 23, 24, 25], true)) {
		throw new Error("Failed to move to Countess");
	}

	poi = getPresetUnit(me.area, 2, 580);

	if (!poi) {
		throw new Error("Failed to move to Countess (preset not found)");
	}

	switch (poi.roomx * 5 + poi.x) {
	case 12565:
		Pather.moveTo(12578, 11043);
		break;
	case 12526:
		Pather.moveTo(12548, 11083);
		break;
	}
	var tmp_meX = me.x;
	var tmp_meY = me.y;
	Pather.makePortal();	// dEditAdded
	delay(250);
	
	Attack.securePosition(me.x, me.y, 40, 1000, true);	// dEditAdded
	Pather.moveTo(tmp_meX, tmp_meY);
	return true;
}
function d2_act1den() {
	me.overhead("ÿc4Heading to the Den...");
	if(me.area != 2 &&  me.area != 3) {
		Town.goToTown();
		delay(250);
		Pather.useWaypoint(3);
	}
	Precast.doPrecast(true);
	Pather.moveToExit([2, 8], true);
	delay(250);
	d2_mytowning();
	delay(3000);
	return true;
}
function d2_act1hole() {
	me.overhead("ÿc4Heading to the Black Marsh hole...");
	if(me.area != 5 &&  me.area != 6 &&  me.area != 7) {
		Town.goToTown();
		delay(250);
		Pather.useWaypoint(6);
	}
	Precast.doPrecast(true);
	Pather.moveToExit([6, 11], true);
	delay(250);
	d2_mytowning();
	delay(3000);
	return true;
}
function d2_act1pit() {
	me.overhead("ÿc4Heading to the Tamoe pit...");
	if(me.area != 7 &&  me.area != 27) {
		Town.goToTown();
		delay(250);
		Pather.useWaypoint(6);
	}
	Precast.doPrecast(true);
	Pather.moveToExit([7, 12], true);
	delay(250);
	d2_mytowning();
	delay(3000);
	return true;
}
function d2_Andy() {
	me.overhead("ÿc4Heading to Andariel");
	Pather.useWaypoint(35, true);
	Precast.doPrecast(true);

	if (!Pather.moveToExit([36, 37], true) || !Pather.moveTo(22582, 9612)) {
		originPather.makePortal();
		Pather.usePortal(null, me.name);
		throw new Error("andy failed");
	}

	Pather.moveTo(22563, 9556);
	delay(250);
	Pather.makePortal();	// dEditAdded
	delay(250);
	
	//Attack.kill(156);
	
	Attack.securePosition(me.x, me.y, 40, 3000, true);	// dEditAdded
	Pather.moveTo(22563, 9556);

	return true;
}
function d2_Duriel() {
	me.overhead("ÿc4Heading to Duriel");
	Pather.useWaypoint(46, true);
	Precast.doPrecast(true);

	if (!Pather.moveToExit(getRoom().correcttomb, true) || !Pather.moveToPreset(me.area, 2, 152)) {
		throw new Error("duriel failed");
	}

	while (!getUnit(2, 100)) {
		delay(500);
	}

	Pather.useUnit(2, 100, 73);
	Pather.makePortal();
	delay(250);
	Attack.kill(211);
	return true;
}
function d2_Meph() {
	me.overhead("ÿc4Heading to Meph");
	Pather.useWaypoint(101, true);
	Precast.doPrecast(true);

	Pather.moveToExit(102, true);
	Pather.moveTo(17591, 8070);
	Pather.makePortal();
	
	Attack.kill(242);
	
	Pather.moveTo(17591, 8070);
	return true;
}
function d2_ChaosEnt() {
	Town.doChores();
	me.overhead("ÿc4Heading to make a tp at entrance.");
	
	Pather.useWaypoint(107);
	Precast.doPrecast(true);

	if (me.area !== 107) {
		Pather.useWaypoint(107);
	}

	if (!Pather.moveTo(7790, 5544)) {
		throw new Error("Failed to move to Chaos Sanctuary");
	}
	Pather.makePortal();							// dEditeAdd make a portal at entrance
	delay(500);
	while (!this.playerIn()) {
		Attack.securePosition(me.x, me.y, 30, 250);
		delay(100);
	}
	Pather.moveTo(7790, 5544);
	return true;
}
function d2_tele2ChaosCtr() {
	me.overhead("ÿc4Heading to make a tp at Chaos centre.");
	if (me.area != 108) {
		d2_mytowning();
		Pather.useWaypoint(107, true);
		delay(1000);
	}
	Pather.moveTo(7791, 5299);
	Pather.makePortal();
	while(!ldrInMyArea()) {
		Attack.clear(5, 0, false, false, true);
		delay(750);
	}
	return true;
}
function d2_ChaosOpenSeals() {
	var tmp_x = me.x;
	var tmp_y = me.y;
	
	this.starToVizA = [7759, 5295, 7734, 5295, 7716, 5295, 7718, 5276, 7697, 5292, 7678, 5293, 7665, 5276, 7662, 5314];
	this.starToVizB = [7759, 5295, 7734, 5295, 7716, 5295, 7701, 5315, 7666, 5313, 7653, 5284];
	this.starToSeisA = [7781, 5259, 7805, 5258, 7802, 5237, 7776, 5228, 7775, 5205, 7804, 5193, 7814, 5169, 7788, 5153];
	this.starToSeisB = [7781, 5259, 7805, 5258, 7802, 5237, 7776, 5228, 7811, 5218, 7807, 5194, 7779, 5193, 7774, 5160, 7803, 5154];
	this.starToInfA = [7809, 5268, 7834, 5306, 7852, 5280, 7852, 5310, 7869, 5294, 7895, 5295, 7919, 5290];
	this.starToInfB = [7809, 5268, 7834, 5306, 7852, 5280, 7852, 5310, 7869, 5294, 7895, 5274, 7927, 5275, 7932, 5297, 7923, 5313];
	
	this.getLayout = function (seal, value) {
		var sealPreset = getPresetUnit(108, 2, seal);

		if (!seal) {
			throw new Error("Seal preset not found. Can't continue.");
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

			if (!seal) {
				return false;
			}
			
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
	this.initLayout();
	this.vizierSeal = function () {
		me.overhead("ÿc4Viz layout " + this.vizLayout);
		this.followPath(this.vizLayout === 1 ? this.starToVizA : this.starToVizB);

		if (!this.openSeal(395) || !this.openSeal(396)) {
			Pather.moveTo(tmp_x, tmp_y);
			throw new Error("Failed to open Vizier seals.");
		}
		return true;
	};
	this.seisSeal = function () {
		me.overhead("ÿc4Seis layout " + this.seisLayout);
		this.followPath(this.seisLayout === 1 ? this.starToSeisA : this.starToSeisB);

		if (!this.openSeal(394)) {
			Pather.moveTo(tmp_x, tmp_y);
			throw new Error("Failed to open de Seis seal.");
		}
		return true;
	};
	this.infectorSeal = function () {
		me.overhead("ÿc4Inf layout " + this.infLayout);
		this.followPath(this.infLayout === 1 ? this.starToInfA : this.starToInfB);

		if (!this.openSeal(393)) {
			Pather.moveTo(tmp_x, tmp_y);
			throw new Error("Failed to open Infector seals.");
		}
		if (!this.openSeal(392)) {
			Pather.moveTo(tmp_x, tmp_y);
			throw new Error("Failed to open Infector seals.");
		}
		return true;
	};
	Precast.doPrecast(true);
	this.vizierSeal();
	this.seisSeal();
	this.infectorSeal();

	Pather.moveTo(tmp_x, tmp_y);
	Precast.doPrecast(true);
	
	return true;
}
function d2_Ancients() {
	me.overhead("ÿc4starting ancients");
	var altar;

	Town.doChores();
	Pather.useWaypoint(118, true);
	Precast.doPrecast(true);

	if (!Pather.moveToExit(120, true)) throw new me.overhead("Failed to go to Ancients way.");

	Pather.moveTo(10089, 12622);
	Pather.makePortal();
	me.overhead("ÿc43");

	while (!this.playerIn()) delay(250);

	Pather.moveTo(10048, 12628);
	altar = getUnit(2, 546);

	if (altar) {
		while (altar.mode !== 2) {
			Pather.moveToUnit(altar);
			altar.interact();
			delay(2000 + me.ping);
			me.cancel();
		}
	}

	while (!getUnit(1, 542)) delay(250);

	Attack.clear(50);
	Pather.moveTo(10089, 12622);
	me.cancel();
	Pather.makePortal();

	while (this.playerIn()) delay(100);

	if (!Pather.usePortal(null, me.name)) Town.goToTown();

	return 0;
}
function d2_throne() {
	Town.doChores();
	me.overhead("ÿc4Heading to make a tp at throne.");
	
	Pather.useWaypoint(Config.RandomPrecast ? "random" : 129);
	Precast.doPrecast(true);

	if (me.area !== 129) {
		Pather.useWaypoint(129);
	}

	if (!Pather.moveToExit([130, 131], true)) {
		Town.goToTown();
		throw new Error("Failed to move to Throne of Destruction.");
	}

	Pather.moveTo(15112, 5052);
	Pather.makePortal();
	delay(500);
	while (!this.playerIn()) {
		Attack.securePosition(me.x, me.y, 30, 250);
		delay(100);
	}
	Pather.moveTo(15112, 5052);
	
	return true;
}
function d2_Baal() {
	var	portal, tick,
		_dollsSoulChk = true;
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

		me.overhead("ÿc4" + string);
	};

	Town.doChores();
	Pather.useWaypoint(Config.RandomPrecast ? "random" : 129);
	Pather.makePortal();
	delay(2000);
	Precast.doPrecast(true);

	if (me.area !== 129) {
		Pather.useWaypoint(129);
		Pather.makePortal();
		delay(2000);
	}

	if (!Pather.moveToExit([130, 131], true)) {
		throw new Error("Failed to move to Throne of Destruction.");
	}

	Pather.moveTo(15095, 5029);

	/*if (_dollsSoulChk && getUnit(1, 691)) {	// dEditCut Config.Baal.DollQuit
		me.overhead("ÿc4Dolls found! NG.");
		Town.goToTown();
		Town.doChores();
		return true;
	}

	if (_dollsSoulChk && getUnit(1, 641)) {	// dEditCut Config.Baal.SoulQuit
		me.overhead("ÿc4Souls found! NG.");
		Town.goToTown();
		Town.doChores();
		return true;
	}*/

	if (1) {	// dEditCut Config.PublicMode
		this.announce();
		Pather.moveTo(15118, 5002);
		Pather.makePortal();
		me.overhead("ÿc4" + "Hot tp. So, come on down!");
		Attack.clear(15);
	}

	this.clearThrone();

	if (1) {	// dEditCut Config.PublicMode
		Pather.moveTo(15118, 5045);
		Pather.makePortal();
		me.overhead("ÿc4" + "Safe tp. Saunter in you shmoo.");	// dEditCut Config.Baal.SafeTPMessage
		Precast.doPrecast(true);
	}

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

	if (1) {											// dEditCut Config.Baal.KillBaal
		if (1) {										// Config.PublicMode
			me.overhead("ÿc4" + "You can do it!");		// Config.Baal.BaalMessage
		}

		Pather.moveTo(15090, 5008);
		delay(5000);
		Precast.doPrecast(true);
		
		while (getUnit(1, 543)) {
			delay(500);
		}
		
		while (ldrInMyArea()) { delay(rand(1200,2000));	}	// dEdits: when ldr goes to town, then go to baal

		portal = getUnit(2, 563);

		if (portal) {
			Pather.usePortal(null, null, portal);
		} else {
			throw new Error("Couldn't find portal.");
		}

		Pather.moveTo(15134, 5923);
		Pather.makePortal();			// dEditAdded
		delay(250);
		Attack.kill(544); 				// Baal
		Pickit.pickItems();
	}
	while (ldrInMyArea()) { delay(rand(1200,2000));	}
	Town.goToTown(5);
	return true;
}
function d2_Pindleskin() {
	me.overhead("Where r u pindlepoo?");
	var anya;
	
	Town.goToTown(5);
	Town.doChores();
	Pather.moveTo("waypoint");

	Pather.useWaypoint(123);
	Precast.doPrecast(true);

	if (!Pather.moveToExit([122, 121], true)) {
		me.overhead("Failed to move to Nihlahak's Temple");
		Town.goToTown(5);
		return false;
	}
	
	Pather.makePortal();
	while(!(troopsInMyArea() >= 2)) { 		// check if everyone is in the same area & near, if not pause 'til they are
		myQuietVoice("...We'll stay put, 'til they return.");
		Attack.clear(5, 0, false, false, true);					// clear: function (range, spectype, bossId, sortfunc, pickit)
		delay(750); 
	}
	
	Pather.moveTo(10058, 13234);

	try {
		Attack.clear(15, 0, getLocaleString(22497)); // Pindleskin
	} catch (e) {
		print(e);
	}
	Pickit.pickItems();

	/*if (Config.Pindleskin.KillNihlathak) {
		if (!Pather.moveToExit([122, 123, 124], true)) {
			throw new Error("Failed to move to Halls of Vaught");
		}

		Pather.moveToPreset(me.area, 2, 462, 10, 10);

		if (Config.Pindleskin.ViperQuit && getUnit(1, 597)) {
			print("Tomb Vipers found.");

			return true;
		}
		
		if (Config.Pindleskin.ClearVipers) {
			Attack.clearList(Attack.getMob(597, 0, 20));
		}

		Attack.kill(526); // Nihlathak
		//Attack.clear(15, 0, 526);
		Pickit.pickItems();
	}*/

	return true;
}
//
// enchant functions
//
function Enchant() {
	var command, hostile, nick, spot, tick, s, m,
		startTime = getTickCount(),
		shitList = [],
		greet = [];

	this.enchant = function (nick) {
		if (!Misc.inMyParty(nick)) {
			me.overhead("Mus be part of party...");

			return false;
		}

		var partyUnit,
			unit = getUnit(0, nick);

		if (getDistance(me, unit) > 35) {
			me.overhead("Please, get closer...");

			return false;
		}

		if (!unit) {
			partyUnit = getParty(nick);

			// wait until party area is readable?

			if ([40, 75, 103, 109].indexOf(partyUnit.area) > -1) {
				me.overhead("Wait for me at waypoint.");
				Town.goToTown([1, 40, 75, 103, 109].indexOf(partyUnit.area) + 1); // index+1 for town 2,3,4,5

				unit = getUnit(0, nick);
			} else {
				me.overhead("You need to be in one of the towns.");

				return false;
			}
		}

		if (unit) {
			do {
				if (!unit.dead) { // player is alive
					if (getDistance(me, unit) >= 35) {
						me.overhead("You went too far away.");

						return false;
					}

					Skill.setSkill(52, 0);
					sendPacket(1, 0x11, 4, unit.type, 4, unit.gid);
					delay(500);
				}
			} while (unit.getNext());
		} else {
			me.overhead("Couldn't find you, champ.");
		}

		unit = getUnit(1);

		if (unit) {
			do {
				if (unit.getParent() && unit.getParent().name === nick) { // merc or any other owned unit
					Skill.setSkill(52, 0);
					sendPacket(1, 0x11, 4, unit.type, 4, unit.gid);
					delay(500);
				}
			} while (unit.getNext());
		}

		return true;
	};

	this.autoChant = function () {
		var unit,
			chanted = [];

		// Player
		unit = getUnit(0);

		if (unit) {
			do {
				if (unit.name !== me.name && !unit.dead && shitList.indexOf(unit.name) === -1 && Misc.inMyParty(unit.name) && !unit.getState(16) && getDistance(me, unit) <= 40) {
					Skill.setSkill(52, 0);
					sendPacket(1, 0x11, 4, unit.type, 4, unit.gid);
					delay(500);
					chanted.push(unit.name);
				}
			} while (unit.getNext());
		}

		// Minion
		unit = getUnit(1);

		if (unit) {
			do {
				if (unit.getParent() && chanted.indexOf(unit.getParent().name) > -1 && !unit.getState(16) && getDistance(me, unit) <= 40) {
					Skill.setSkill(52, 0);
					sendPacket(1, 0x11, 4, unit.type, 4, unit.gid);
					delay(500);
				}
			} while (unit.getNext());
		}

		return true;
	};

	this.getWpNick = function (nick) {
		if (!this.wpNicks) {
			this.wpNicks = {};
		}

		if (this.wpNicks.hasOwnProperty(nick)) {
			if (this.wpNicks[nick].requests > 4) {
				return "maxrequests";
			}

			if (getTickCount() - this.wpNicks[nick].timer < 60000) {
				return "mintime";
			}

			return true;
		}

		return false;
	};

	this.addWpNick = function (nick) {
		this.wpNicks[nick] = {timer: getTickCount(), requests: 0};
	};

	this.giveWps = function (nick) {
		if (!Misc.inMyParty(nick)) {
			me.overhead("Accept party invite, noob.");

			return false;
		}

		var i, act, timeout, wpList;

		switch (this.getWpNick(nick)) {
		case "maxrequests":
			me.overhead(nick + ", you have spent all your waypoint requests for this game.");

			return false;
		case "mintime":
			me.overhead(nick + ", you may request waypoints every 60 seconds.");

			return false;
		case false:
			this.addWpNick(nick);

			break;
		}

		act = this.getPlayerAct(nick);

		switch (act) {
		case 1:
			wpList = [3, 4, 5, 6, 27, 29, 32, 35];

			break;
		case 2:
			wpList = [48, 42, 57, 43, 44, 52, 74, 46];

			break;
		case 3:
			wpList = [76, 77, 78, 79, 80, 81, 83, 101];

			break;
		case 4:
			wpList = [106, 107];

			break;
		case 5:
			wpList = [111, 112, 113, 115, 123, 117, 118, 129];

			break;
		}

MainLoop:
		for (i = 0; i < wpList.length; i += 1) {
			if (this.checkHostiles()) {
				break;
			}

			try {
				Pather.useWaypoint(wpList[i], true);
				Pather.makePortal();
				me.overhead(getArea().name + " TP up");

				for (timeout = 0; timeout < 20; timeout += 1) {
					if (getUnit(0, nick)) {
						break;
					}

					delay(1000);
				}

				if (timeout >= 20) {
					me.overhead("Aborting wp giving.");

					break MainLoop;
				}

				delay(5000);
			} catch (error) {

			}
		}

		Town.doChores();
		Town.goToTown(1);
		Town.move("portalspot");

		this.wpNicks[nick].requests += 1;
		this.wpNicks[nick].timer = getTickCount();

		return true;
	};

	this.getPlayerAct = function (name) {
		var unit = getParty();

		if (unit) {
			do {
				if (unit.name === name) {
					if (unit.area <= 39) {
						return 1;
					}

					if (unit.area >= 40 && unit.area <= 74) {
						return 2;
					}

					if (unit.area >= 75 && unit.area <= 102) {
						return 3;
					}

					if (unit.area >= 103 && unit.area <= 108) {
						return 4;
					}

					return 5;
				}
			} while (unit.getNext());
		}

		return false;
	};

	this.checkHostiles = function () {
		var rval = false,
			party = getParty();

		if (party) {
			do {
				if (party.name !== me.name && getPlayerFlag(me.gid, party.gid, 8)) {
					rval = true;

					if (Config.ShitList && shitList.indexOf(party.name) === -1) {
						shitList.push(party.name);
					}
				}
			} while (party.getNext());
		}

		return rval;
	};

	this.floodCheck = function (command) {
		var cmd = command[0],
			nick = command[1];

		if ([	"help", "timeleft",
				Config.Enchant.Triggers[0].toLowerCase(),
				Config.Enchant.Triggers[1].toLowerCase(),
				Config.Enchant.Triggers[2].toLowerCase()
				].indexOf(cmd.toLowerCase()) === -1) {
			return false;
		}

		if (!this.cmdNicks) {
			this.cmdNicks = {};
		}

		if (!this.cmdNicks.hasOwnProperty(nick)) {
			this.cmdNicks[nick] = {
				firstCmd: getTickCount(),
				commands: 0,
				ignored: false
			};
		}

		if (this.cmdNicks[nick].ignored) {
			if (getTickCount() - this.cmdNicks[nick].ignored < 60000) {
				return true; // ignore flooder
			}

			// unignore flooder
			this.cmdNicks[nick].ignored = false;
			this.cmdNicks[nick].commands = 0;
		}

		this.cmdNicks[nick].commands += 1;

		if (getTickCount() - this.cmdNicks[nick].firstCmd < 10000) {
			if (this.cmdNicks[nick].commands > 5) {
				this.cmdNicks[nick].ignored = getTickCount();

				me.overhead(nick + ", you are being ignored for 60 seconds because of flooding.");
			}
		} else {
			this.cmdNicks[nick].firstCmd = getTickCount();
			this.cmdNicks[nick].commands = 0;
		}

		return false;
	};

	function ChatEvent(nick, msg) {
		command = [msg, nick];
	}

	function GreetEvent(mode, param1, param2, name1, name2) {
		switch (mode) {
		case 0x02:
			if (me.inTown && me.mode === 5) { // idle in town
				greet.push(name1);
			}

			break;
		}
	}

	// START
	if (Config.ShitList) {
		shitList = ShitList.read();
	}

	addEventListener("chatmsg", ChatEvent);
	addEventListener("gameevent", GreetEvent);
	Town.doChores();
	Town.goToTown(1);
	Town.move("portalspot");

	spot = {
		x: me.x,
		y: me.y
	};

	while (true) {
		while (greet.length > 0) {
			nick  = greet.shift();

			if (shitList.indexOf(nick) === -1) {
				me.overhead("Welcome, " + nick + "! For a list of commands say 'help'");
			}
		}

		if (spot && getDistance(me, spot) > 10) {
			Pather.moveTo(spot.x, spot.y);
		}

		if (command && !this.floodCheck(command)) {
			switch (command[0].toLowerCase()) {
			case "help":
				this.checkHostiles();

				if (shitList.indexOf(command[1]) > -1) {
					me.overhead("No " + command[0] + " for the shitlisted.");

					break;
				}

				me.overhead("Commands:");
				me.overhead("Remaining time: timeleft" +
						(Config.Enchant.Triggers[0] ? " | Enhant: " + Config.Enchant.Triggers[0] : "") +
						(Config.Enchant.Triggers[1] ? " | Open cow level: " + Config.Enchant.Triggers[1] : "") +
						(Config.Enchant.Triggers[2] ? " | Give waypoints: " + Config.Enchant.Triggers[2] : ""));

				if (Config.Enchant.AutoChant) {
					me.overhead("Auto enchant is ON");
				}

				break;
			case "timeleft":
				tick = Config.Enchant.GameLength * 6e4 - getTickCount() + startTime;
				m = Math.floor(tick / 60000);
				s = Math.floor((tick / 1000) % 60);

				me.overhead("Time left: " + (m ? m + " minute" + (m > 1 ? "s" : "") + ", " : "") + s + " second" + (s > 1 ? "s." : "."));

				break;
			case Config.Enchant.Triggers[0].toLowerCase(): // chant
				this.checkHostiles();

				if (shitList.indexOf(command[1]) > -1) {
					me.overhead("No chant for the shitlisted.");

					break;
				}

				this.enchant(command[1]);

				break;
			case Config.Enchant.Triggers[1].toLowerCase(): // cows
				hostile = this.checkHostiles();

				if (shitList.indexOf(command[1]) > -1) {
					me.overhead("No cows for the shitlisted.");

					break;
				}

				this.openPortal(command[1]);
				me.cancel();

				break;
			case Config.Enchant.Triggers[2].toLowerCase(): // wps
				hostile = this.checkHostiles();

				if (shitList.indexOf(command[1]) > -1) {
					me.overhead("No waypoints for the shitlisted.");

					break;
				}

				if (hostile) {
					me.overhead("Command disabled because of hostiles.");

					break;
				}

				this.giveWps(command[1]);

				break;
			}
		}

		command = "";

		if (me.act > 1) {
			Town.goToTown(1);
		}

		if (Config.Enchant.AutoChant) {
			this.autoChant();
		}

		if (getTickCount() - startTime >= Config.Enchant.GameLength * 6e4) {
			me.overhead("Use kolbot or die!");
			delay(1000);

			break;
		}

		delay(200);
	}

	return true;
}
/*
	*				Chat commands:
	*				me (master) -        assigns player as master and listens to commands
	*				letgo (release) -    resets master
	*				paws (pause) -              pause the rusher
	*				unpaws (resume) -       resume the rusher
	*				do sequence -      stop current action and start the given sequence.
	*.               fini -                        exit rusher & return to follower script  
	*				supported sequences are: andariel, cube, amulet, staff, summoner, duriel, travincal, mephisto, diablo
	*				example: do travincal
*/

function d2_rush(rMsg) {
	this.playerIn = function (area) {
		if (!area) {
			area = me.area;
		}

		var party = getParty();

		if (party) {
			do {
				if (party.name !== me.name && party.area === area) {
					return true;
				}
			} while (party.getNext());
		}

		return false;
	};

	this.bumperCheck = function () {
		var party = getParty();

		if (party) {
			do {
				if (party.name !== me.name) {
					switch (me.diff) {
					case 0:
						if (party.level >= 20) {
							return true;
						}

						break;
					case 1:
						if (party.level >= 40) {
							return true;
						}

						break;
					}
				}
			} while (party.getNext());
		}

		return false;
	};

	this.playersInAct = function (act) {
		var area, party,
			areas = [0, 1, 40, 75, 103, 109];

		if (!act) {
			act = me.act;
		}

		area = areas[act];
		party = getParty();

		if (party) {
			do {
				if (party.name !== me.name && party.area !== area) {
					return false;
				}
			} while (party.getNext());
		}

		return true;
	};

	
	this.andariel = function () {
		me.overhead("starting andariel");
		Town.doChores();
		Pather.useWaypoint(35, true);
		Precast.doPrecast(true);

		if (!Pather.moveToExit([36, 37], true) || !Pather.moveTo(22582, 9612)) {
			throw new Error("andy failed");
		}

		Pather.makePortal();
		Attack.securePosition(me.x, me.y, 40, 3000, true);
		me.overhead("1");

		while (!this.playerIn()) {
			Pather.moveTo(22582, 9612);
			delay(250);
		}

		Attack.kill(156);
		me.overhead("2");
		Pather.moveTo(22582, 9612);

		while (this.playerIn()) {
			delay(250);
		}

		Pather.usePortal(null, me.name);
		me.overhead("a2");
		Pather.useWaypoint(40, true);

		while (!this.playersInAct(2)) {
			delay(250);
		}

		return true;
	};
	this.cain = function () {
		me.overhead("starting cain help");
		delay(1000);
		me.overhead("starting tree");
		Town.doChores();
		Pather.useWaypoint(5, true);
		Precast.doPrecast(true);
		
		if (!Pather.moveToPreset(me.area, 2, 30, 5, 5, true)) {
			me.overhead("Failed to move to Tree of Inifuss");
			return false;
		}
		
		Attack.securePosition(me.x, me.y, 10, 3000);
		Pather.makePortal();
		me.overhead("1");
 		while (!this.playerIn()) {
			delay(200);
		}
		
		Attack.securePosition(me.x, me.y, 10, 3000);
		Pickit.pickItems();
		Pather.makePortal();
		me.overhead("1");
 		while (!this.playerIn()) {
			Attack.securePosition(me.x, me.y, 10, 1500);
			delay(200);
		}
		
		Pather.moveToPreset(me.area, 2, 30, 5, 5, true);
		while (this.playerIn()) {
			Attack.securePosition(me.x, me.y, 10, 1500);
			delay(200);
		}
 		Pather.usePortal(null, null);
		
		me.overhead("starting tree");
		Town.doChores();
		Pather.useWaypoint(4);
		Precast.doPrecast(true);
 		if (!Pather.moveToPreset(me.area, 1, 737, 0, 0, false)) {
			me.overhead("Failed to move to Rakanishu");
			return false;
		}
		
		Attack.securePosition(me.x, me.y, 10, 3000);
		Pickit.pickItems();
		Pather.makePortal();
		me.overhead("1");
 		while (!this.playerIn()) {
			Attack.securePosition(me.x, me.y, 10, 1500);
			delay(200);
		}
		
		while (this.playerIn()) {
			Attack.securePosition(me.x, me.y, 10, 1500);
			delay(200);
		}
		
		Pather.usePortal(null, null);
		return true;
	};
	this.radament = function () {
		if (!Config.Rusher.Radament) {
			return false;
		}

		me.overhead("starting radament");

		var i, radaCoords, rada, radaPreset, returnSpot,
			moveIntoPos = function (unit, range) {
				var i, coordx, coordy,
					coords = [],
					angle = Math.round(Math.atan2(me.y - unit.y, me.x - unit.x) * 180 / Math.PI),
					angles = [0, 15, -15, 30, -30, 45, -45, 60, -60, 75, -75, 90, -90, 105, -105, 120, -120, 135, -135, 150, -150, 180];

				for (i = 0; i < angles.length; i += 1) {
					coordx = Math.round((Math.cos((angle + angles[i]) * Math.PI / 180)) * range + unit.x);
					coordy = Math.round((Math.sin((angle + angles[i]) * Math.PI / 180)) * range + unit.y);

					try {
						if (!(getCollision(unit.area, coordx, coordy) & 0x1)) {
							coords.push({
								x: coordx,
								y: coordy
							});
						}
					} catch (e) {

					}
				}

				if (coords.length > 0) {
					coords.sort(Sort.units);

					return Pather.moveToUnit(coords[0]);
				}

				return false;
			};

		Pather.useWaypoint(48, true);
		Precast.doPrecast(false);
		Pather.moveToExit(49, true);

		radaPreset = getPresetUnit(49, 2, 355);
		radaCoords = {
			area: 49,
			x: radaPreset.roomx * 5 + radaPreset.x,
			y: radaPreset.roomy * 5 + radaPreset.y
		};

		moveIntoPos(radaCoords, 50);

		for (i = 0; i < 3; i += 1) {
			rada = getUnit(1, 229);

			if (rada) {
				break;
			}

			delay(500);
		}

		if (rada) {
			moveIntoPos(rada, 60);
		} else {
			print("radament unit not found");
		}

		Attack.securePosition(me.x, me.y, 35, 3000);
		Pather.makePortal();
		me.overhead("1");

		while (!this.playerIn()) {
			delay(200);
		}

		Attack.kill(229); // Radament

		returnSpot = {
			x: me.x,
			y: me.y
		};

		me.overhead("2");
		Pickit.pickItems();
		Attack.securePosition(me.x, me.y, 30, 3000);

		while (this.playerIn()) {
			delay(200);
		}

		Pather.moveToUnit(returnSpot);
		Pather.makePortal();
		me.overhead("all in");

		while (!this.playerIn()) {
			delay(200);
		}

		while (getUnit(4, 552)) {
			delay(1000);
		}

		while (this.playerIn()) {
			delay(200);
		}

		Pather.usePortal(null, null);

		return true;
	};
	this.cube = function () {
		if (me.diff === 0) {
			me.overhead("starting cube");
			Pather.useWaypoint(57, true);
			Precast.doPrecast(true);

			if (!Pather.moveToExit(60, true) || !Pather.moveToPreset(me.area, 2, 354)) {
				throw new Error("cube failed");
			}

			Pather.makePortal();
			Attack.securePosition(me.x, me.y, 30, 3000, true);
			me.overhead("1");

			while (!this.playerIn()) {
				delay(100);
			}

			while (this.playerIn()) {
				delay(100);
			}

			Pather.usePortal(null, me.name);
		}

		return true;
	};
	this.amulet = function () {
		me.overhead("starting amulet");
		Town.doChores();
		Pather.useWaypoint(44, true);
		Precast.doPrecast(true);

		if (!Pather.moveToExit([45, 58, 61], true) || !Pather.moveTo(15044, 14045)) {
			throw new Error("amulet failed");
		}

		Pather.makePortal();

		if (me.diff < 2) {
			Attack.securePosition(me.x, me.y, 25, 3000);
		} else {
			Attack.securePosition(me.x, me.y, 25, 3000, true, true);
		}

		me.overhead("1");

		while (!this.playerIn()) {
			delay(100);
		}

		while (this.playerIn()) {
			delay(100);
		}

		Pather.usePortal(null, me.name);

		return true;
	};
	this.staff = function () {
		me.overhead("starting staff");
		Town.doChores();
		Pather.useWaypoint(43, true);
		Precast.doPrecast(true);

		if (!Pather.moveToExit([62, 63, 64], true) || !Pather.moveToPreset(me.area, 2, 356)) {
			throw new Error("staff failed");
		}

		Pather.makePortal();
		Attack.securePosition(me.x, me.y, 30, 3000, true);
		me.overhead("1");

		while (!this.playerIn()) {
			//Pather.moveToPreset(me.area, 2, 356);
			delay(100);
		}

		while (this.playerIn()) {
			delay(100);
		}

		Pather.usePortal(null, me.name);

		return true;
	};
	this.summoner = function () {
		// right up 25449 5081 (25431, 5011)
		// left up 25081 5446 (25011, 5446)
		// right down 25830 5447 (25866, 5431)
		// left down 25447 5822 (25431, 5861)

		me.overhead("starting summoner");
		Town.doChores();
		Pather.useWaypoint(74, true);
		Precast.doPrecast(true);

		var i, journal,
			preset = getPresetUnit(me.area, 2, 357),
			spot = {};

		switch (preset.roomx * 5 + preset.x) {
		case 25011:
			spot = {x: 25081, y: 5446};
			break;
		case 25866:
			spot = {x: 25830, y: 5447};
			break;
		case 25431:
			switch (preset.roomy * 5 + preset.y) {
			case 5011:
				spot = {x: 25449, y: 5081};
				break;
			case 5861:
				spot = {x: 25447, y: 5822};
				break;
			}

			break;
		}

		if (!Pather.moveToUnit(spot)) {
			throw new Error("summoner failed");
		}

		Pather.makePortal();
		Attack.securePosition(me.x, me.y, 25, 3000);
		me.overhead("1");

		while (!this.playerIn()) {
			Pather.moveToUnit(spot);
			Attack.securePosition(me.x, me.y, 25, 500);
			delay(250);
		}

		Pather.moveToPreset(me.area, 2, 357);
		Attack.kill(250);
		me.overhead("2");

		while (this.playerIn()) {
			delay(100);
		}

		Pickit.pickItems();
		Pather.moveToPreset(me.area, 2, 357);

		journal = getUnit(2, 357);

		for (i = 0; i < 5; i += 1) {
			journal.interact();
			delay(1000);
			me.cancel();

			if (Pather.getPortal(46)) {
				break;
			}
		}

		if (i === 5) {
			throw new Error("summoner failed");
		}

		Pather.usePortal(46);

		return true;
	};
	this.duriel = function () {
		me.overhead("starting duriel");

		if (me.inTown) {
			Town.doChores();
			Pather.useWaypoint(46, true);
		}

		Precast.doPrecast(true);

		if (!Pather.moveToExit(getRoom().correcttomb, true) || !Pather.moveToPreset(me.area, 2, 152)) {
			throw new Error("duriel failed");
		}

		Pather.makePortal();
		Attack.securePosition(me.x, me.y, 30, 3000, true, me.diff === 2);
		me.overhead("1");

		while (!this.playerIn()) {
			//Pather.moveToPreset(me.area, 2, 152, 0, -5);
			delay(100);
		}

		while (this.playerIn()) {
			delay(100);
		}

		while (!getUnit(2, 100)) {
			delay(500);
		}

		Pather.useUnit(2, 100, 73);
		Attack.kill(211);
		Pickit.pickItems();

		Pather.teleport = false;

		Pather.moveTo(22579, 15706);

		Pather.teleport = true;

		Pather.moveTo(22577, 15649, 10);
		Pather.moveTo(22577, 15609, 10);
		Pather.makePortal();
		me.overhead("1");

		while (!this.playerIn()) {
			delay(100);
		}

		if (!Pather.usePortal(null, me.name)) {
			Town.goToTown();
		}

		Pather.useWaypoint(52);
		Pather.moveToExit([51, 50], true);
		Pather.moveTo(10022, 5047);
		me.overhead("a3");
		Town.goToTown(3);
		Town.doChores();

		while (!this.playersInAct(3)) {
			delay(250);
		}

		return true;
	};
	this.travincal = function () {
		me.overhead("starting travincal");
		Town.doChores();
		Pather.useWaypoint(83, true);
		Precast.doPrecast(true);

		var coords = [me.x, me.y];

		Pather.moveTo(coords[0] + 23, coords[1] - 102);
		Pather.makePortal();
		Attack.securePosition(me.x, me.y, 40, 3000);
		me.overhead("1");

		while (!this.playerIn()) {
			delay(250);
		}

		Pather.moveTo(coords[0] + 30, coords[1] - 134);
		Pather.moveTo(coords[0] + 86, coords[1] - 130);
		Pather.moveTo(coords[0] + 71, coords[1] - 94);
		Attack.securePosition(me.x, me.y, 40, 3000);

		/*Attack.kill(getLocaleString(2863));
		Attack.kill(getLocaleString(2862));
		Attack.kill(getLocaleString(2860));*/

		me.overhead("2");
		Pather.moveTo(coords[0] + 23, coords[1] - 102);
		Pather.usePortal(null, me.name);

		return true;
	};

	this.mephisto = function () {
		me.overhead("starting mephisto");

		var hydra;

		Town.doChores();
		Pather.useWaypoint(101, true);
		Precast.doPrecast(true);
		Pather.moveToExit(102, true);
		Pather.moveTo(17692, 8023);
		Pather.makePortal();
		delay(2000);
		me.overhead("1");

		while (!this.playerIn()) {
			delay(250);
		}

		Pather.moveTo(17591, 8070);
		Attack.kill(242);
		Pickit.pickItems();
		Pather.moveTo(17692, 8023);
		Pather.makePortal();
		me.overhead("2");

		while (this.playerIn()) {
			delay(250);
		}

		Pather.moveTo(17591, 8070);
		Attack.securePosition(me.x, me.y, 40, 3000);

		hydra = getUnit(1, "hydra");

		if (hydra) {
			do {
				while (hydra.mode !== 0 && hydra.mode !== 12 && hydra.hp > 0) {
					delay(500);
				}
			} while (hydra.getNext());
		}

		Pather.makePortal();
		Pather.moveTo(17581, 8070);
		me.overhead("1");

		while (!this.playerIn()) {
			delay(250);
		}

		me.overhead("a4");
		//Pather.moveTo(17591, 8070);

		while (!this.playersInAct(4)) {
			delay(250);
		}

		delay(2000);
		Pather.usePortal(null);

		return true;
	};
	this.izual = function () {
		if (!Config.Rusher.Izual) {
			return false;
		}

		me.overhead("starting izual");

		var i, izualCoords, izual, izualPreset, returnSpot,
			moveIntoPos = function (unit, range) {
				var i, coordx, coordy,
					coords = [],
					angle = Math.round(Math.atan2(me.y - unit.y, me.x - unit.x) * 180 / Math.PI),
					angles = [0, 15, -15, 30, -30, 45, -45, 60, -60, 75, -75, 90, -90, 105, -105, 120, -120, 135, -135, 150, -150, 180];

				for (i = 0; i < angles.length; i += 1) {
					coordx = Math.round((Math.cos((angle + angles[i]) * Math.PI / 180)) * range + unit.x);
					coordy = Math.round((Math.sin((angle + angles[i]) * Math.PI / 180)) * range + unit.y);

					try {
						if (!(getCollision(unit.area, coordx, coordy) & 0x1)) {
							coords.push({
								x: coordx,
								y: coordy
							});
						}
					} catch (e) {

					}
				}

				if (coords.length > 0) {
					coords.sort(Sort.units);

					return Pather.moveToUnit(coords[0]);
				}

				return false;
			};

		Pather.useWaypoint(106, true);
		Precast.doPrecast(false);
		Pather.moveToExit(105, true);

		izualPreset = getPresetUnit(105, 1, 256);
		izualCoords = {
			area: 105,
			x: izualPreset.roomx * 5 + izualPreset.x,
			y: izualPreset.roomy * 5 + izualPreset.y
		};

		moveIntoPos(izualCoords, 50);

		for (i = 0; i < 3; i += 1) {
			izual = getUnit(1, 256);

			if (izual) {
				break;
			}

			delay(500);
		}

		if (izual) {
			moveIntoPos(izual, 60);
		} else {
			print("izual unit not found");
		}

		returnSpot = {
			x: me.x,
			y: me.y
		};

		Attack.securePosition(me.x, me.y, 30, 3000);
		Pather.makePortal();
		me.overhead("1");

		while (!this.playerIn()) {
			delay(200);
		}

		Attack.kill(256); // Izual
		Pickit.pickItems();
		me.overhead("2");
		Pather.moveToUnit(returnSpot);

		while (this.playerIn()) {
			delay(200);
		}

		Pather.usePortal(null, null);

		return true;
	};
	this.diablo = function () {
		me.overhead("starting diablo");

		this.getLayout = function (seal, value) {
			var sealPreset = getPresetUnit(108, 2, seal);

			if (!seal) {
				throw new Error("Seal preset not found. Can't continue.");
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

		this.getBoss = function (name) {
			var i, boss,
				glow = getUnit(2, 131);

			for (i = 0; i < (name === getLocaleString(2853) ? 14 : 12); i += 1) {
				boss = getUnit(1, name);

				if (boss) {
					if (name === getLocaleString(2852)) {
						this.chaosPreattack(getLocaleString(2852), 8);
					}

					Attack.kill(name);
					Pickit.pickItems();

					return true;
				}

				delay(250);
			}

			return !!glow;
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

		this.openSeal = function (id) {
			Pather.moveToPreset(108, 2, id, id === 394 ? 5 : 2, id === 394 ? 5 : 0);

			var i, tick,
				seal = getUnit(2, id);

			if (seal) {
				for (i = 0; i < 3; i += 1) {

					if (id === 394) {
						Misc.click(0, 0, seal);
					} else {
						seal.interact();
					}

					tick = getTickCount();

					while (getTickCount() - tick < 500) {
						if (seal.mode) {
							return true;
						}

						delay(10);
					}
				}
			}

			return false;
		};

		Town.doChores();
		Pather.useWaypoint(107, true);
		Precast.doPrecast(true);
		Pather.moveTo(7790, 5544);
		this.initLayout();

		if (!this.openSeal(395) || !this.openSeal(396)) {
			throw new Error("Failed to open seals");
		}

		if (this.vizLayout === 1) {
			Pather.moveTo(7691, 5292);
		} else {
			Pather.moveTo(7695, 5316);
		}

		if (!this.getBoss(getLocaleString(2851))) {
			throw new Error("Failed to kill Vizier");
		}

		if (!this.openSeal(394)) {
			throw new Error("Failed to open seals");
		}

		if (this.seisLayout === 1) {
			Pather.moveTo(7771, 5196);
		} else {
			Pather.moveTo(7798, 5186);
		}

		if (!this.getBoss(getLocaleString(2852))) {
			throw new Error("Failed to kill de Seis");
		}

		if (!this.openSeal(392) || !this.openSeal(393)) {
			throw new Error("Failed to open seals");
		}

		if (this.infLayout === 1) {
			delay(1);
		} else {
			Pather.moveTo(7928, 5295); // temp
		}

		if (!this.getBoss(getLocaleString(2853))) {
			throw new Error("Failed to kill Infector");
		}

		Pather.moveTo(7763, 5267);
		Pather.makePortal();
		Pather.moveTo(7727, 5267);
		me.overhead("1");

		while (!this.playerIn()) {
			delay(250);
		}

		Pather.moveTo(7763, 5267);

		while (!getUnit(1, 243)) {
			delay(500);
		}

		Attack.kill(243);
		me.overhead("2");

		if (me.gametype > 0) {
			me.overhead("a5");

			while (!this.playersInAct(5)) {
				delay(250);
			}
		}

		Pickit.pickItems();

		if (!Pather.usePortal(null, me.name)) {
			Town.goToTown();
		}

		return true;
	};
	this.shenk = function () {
		if (!Config.Rusher.Shenk) {
			return false;
		}

		me.overhead("starting shenk");

		Pather.useWaypoint(111, true);
		Precast.doPrecast(false);
		Pather.moveTo(3846, 5120);
		Attack.securePosition(me.x, me.y, 30, 3000);
		Pather.makePortal();
		me.overhead("1");

		while (!this.playerIn()) {
			delay(200);
		}

		Attack.kill(getLocaleString(22435)); // Shenk
		Pickit.pickItems();
		Pather.moveTo(3846, 5120);
		me.overhead("2");

		while (this.playerIn()) {
			delay(200);
		}

		Pather.usePortal(null, null);

		return true;
	};
	this.anya = function () {
		if (!Config.Rusher.Anya) {
			return false;
		}

		me.overhead("starting anya");

		var anya;

		if (!Town.goToTown() || !Pather.useWaypoint(113, true)) {
			throw new Error("Anya quest failed");
		}

		Precast.doPrecast(false);

		if (!Pather.moveToExit(114, true) || !Pather.moveToPreset(me.area, 2, 460)) {
			throw new Error("Anya quest failed");
		}

		Attack.securePosition(me.x, me.y, 30, 2000);

		anya = getUnit(2, 558);

		if (anya) {
			Pather.moveToUnit(anya);
			sendPacket(1, 0x13, 4, 0x2, 4, anya.gid); // Rusher should be able to interact so quester can get the potion without entering
			delay(1000 + me.ping);
			me.cancel();
		}

		Pather.makePortal();
		me.overhead("1");

		while (!this.playerIn()) {
			delay(200);
		}

		while (getUnit(2, 558)) {
			delay(1000);
		}

		me.overhead("2"); // Mainly for non-questers to know when to get the scroll of resistance

		while (this.playerIn()) {
			delay(200);
		}

		Pather.usePortal(null, null);

		return true;
	};
	this.ancients = function () {
		if (me.diff === 2) {
			me.overhead("Hell rush complete~");
			delay(500);
			quit();

			return false;
		}

		if (!this.bumperCheck()) {
			me.overhead("No eligible bumpers detected. Rush complete~");
			delay(500);
			quit();

			return false;
		}

		me.overhead("starting ancients");

		var altar;

		Town.doChores();
		Pather.useWaypoint(118, true);
		Precast.doPrecast(true);

		if (!Pather.moveToExit(120, true)) {
			throw new Error("Failed to go to Ancients way.");
		}

		Pather.moveTo(10089, 12622);
		Pather.makePortal();
		me.overhead("3");

		while (!this.playerIn()) {
			delay(250);
		}

		Pather.moveTo(10048, 12628);

		altar = getUnit(2, 546);

		if (altar) {
			while (altar.mode !== 2) {
				Pather.moveToUnit(altar);
				altar.interact();
				delay(2000 + me.ping);
				me.cancel();
			}
		}

		while (!getUnit(1, 542)) {
			delay(250);
		}

		Attack.clear(50);
		Pather.moveTo(10089, 12622);
		me.cancel();
		Pather.makePortal();

		while (this.playerIn()) {
			delay(100);
		}

		if (!Pather.usePortal(null, me.name)) {
			Town.goToTown();
		}

		return true;
	};
	this.baal = function () {
		me.overhead("starting baal");

		var tick, portal;

		this.preattack = function () {
			var check;

			switch (me.classid) {
			case 1:
				if ([56, 59, 64].indexOf(Config.AttackSkill[1]) > -1) {
					if (me.getState(121)) {
						delay(500);
					} else {
						Skill.cast(Config.AttackSkill[1], 0, 15093, 5024);
					}
				}

				return true;
			case 3: // Paladin
				if (Config.AttackSkill[3] !== 112) {
					return false;
				}

				if (getDistance(me, 15093, 5029) > 3) {
					Pather.moveTo(15093, 5029);
				}

				if (Config.AttackSkill[4] > 0) {
					Skill.setSkill(Config.AttackSkill[4], 0);
				}

				Skill.cast(Config.AttackSkill[3], 1);

				return true;
			case 5: // Druid
				if (Config.AttackSkill[3] === 245) {
					Skill.cast(Config.AttackSkill[3], 0, 15093, 5029);

					return true;
				}

				break;
			case 6:
				if (Config.UseTraps) {
					check = ClassAttack.checkTraps({x: 15093, y: 5029});

					if (check) {
						ClassAttack.placeTraps({x: 15093, y: 5029}, 5);

						return true;
					}
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
				pos = [15097, 5054, 15085, 5053, 15085, 5040, 15098, 5040, 15099, 5022, 15086, 5024];

			if (Config.AvoidDolls) {
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
				Attack.clear(30);
			}
		};

		this.checkHydra = function () {
			var monster = getUnit(1, "hydra");

			if (monster) {
				do {
					if (monster.mode !== 12 && monster.getStat(172) !== 2) {
						Pather.moveTo(15118, 5002);

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

		if (me.inTown) {
			Town.doChores();
			Pather.useWaypoint(129, true);
			Precast.doPrecast(true);

			if (!Pather.moveToExit([130, 131], true)) {
				throw new Error("Failed to move to Throne of Destruction.");
			}
		}

		Pather.moveTo(15113, 5040);
		Attack.clear(15);
		this.clearThrone();

		tick = getTickCount();
		Pather.moveTo(15093, me.classid === 3 ? 5029 : 5039);

MainLoop:
		while (true) {
			if (getDistance(me, 15093, me.classid === 3 ? 5029 : 5039) > 3) {
				Pather.moveTo(15093, me.classid === 3 ? 5029 : 5039);
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

			Precast.doPrecast(false);
			delay(10);
		}

		this.clearThrone();
		Pather.moveTo(15092, 5011);
		Precast.doPrecast(true);

		while (getUnit(1, 543)) {
			delay(500);
		}

		delay(1000);

		portal = getUnit(2, 563);

		if (portal) {
			Pather.usePortal(null, null, portal);
		} else {
			throw new Error("Couldn't find portal.");
		}

		Pather.moveTo(15213, 5908);
		Pather.makePortal();
		Pather.moveTo(15170, 5950);
		delay(1000);
		me.overhead("3");

		while (!this.playerIn()) {
			delay(250);
		}

		Pather.moveTo(15134, 5923);
		Attack.kill(544); // Baal
		Pickit.pickItems();

		return true;
	};
	
	
	
	
	switch(rMsg) {
		case "rmini":
			this.andariel();
			this.cube();
			this.amulet();
			this.staff();
			this.summoner();
			this.duriel();
			this.travincal();
			this.mephisto();
			this.diablo();
			this.shenk();
			break;
		case "rmax":
			this.cain();
			this.andariel();
			this.radament();
			this.cube();
			this.amulet();
			this.staff();
			this.summoner();
			this.duriel();
			this.travincal();
			this.mephisto();
			this.izual();
			this.diablo();
			this.shenk();
			this.anya();
			this.ancients();
			this.baal();
			break;
		case "randariel": 	
			this.andariel();
			break;
		case "rradament": 
			this.radament();
			break;
		case "rcube": 		
			this.cube();
			break;
		case "ramulet":		
			this.amulet();
			break;
		case "rstaff": 		
			this.staff();
			break;
		case "rsummoner":	
			this.summoner();
			break;
		case "rduriel":		
			this.duriel();
			break;
		case "rtravincal":	
			this.travincal();
			break;
		case "rmephisto":	
			this.mephisto();
			break;
		case "rizual":		
			this.izual();
			break;
		case "rdiablo":		
			this.diablo();
			break;
		case "rshenk":		
			this.shenk();
			break;
		case "ranya":		
			this.anya();
			break;
		case "rancients":	
			this.ancients();
			break;
		case "rbaal":		
			this.baal();
			break;
		default: break;
		
		break;
	}
	
	return true;
}
function troopsInMyArea() {
	//myQuietVoice("...this is the function for waiting for the troops to be where I am.");
	delay(250);
	
	var count = 0;
	var _party = getParty();
	
	do {
		if(_party.area === me.area) count += 1;
	} while (_party.getNext());
	
	return count;
}
function ldrInMyArea() {
	var _unit = getUnit(0, Config.Leader); 
	if (_unit) {
		do {
			if (_unit.area === me.area) {
				return true;
			}
		} while (player.getNext());
	}
	return false;
}
