/*
	my cusotm d2 d2bs functions
	place this file into the kolbot\libs\common folder
*/
var myTroops = {

	LdrInMyArea: function () {
		var _unit = getUnit(0, Config.Leader); 
		if (_unit) {
			do {
				if (_unit.area === me.area) {
					return true;
				}
			} while (player.getNext());
		}
		return false;
	},
	TroopsInMyArea: function () {			// returns # of followers === me.area
		me.overhead("...waiting for the troops to be where I am.");
		delay(250);
		
		var count = 0;
		var _party = getParty();
		
		do {
			if(_party.area === me.area) count += 1;
		} while (_party.getNext());
		
		return count;
	},
	TroopsNearMe: function () {
		me.overhead("Checking distance btwn & area of followers and me...");
		delay(rand(3500,4000));
		var _troop, _dist;
		var _oorCount = 0;
		
		for (var _i = 1; _i < Config.Troops.length; _i += 1) {	// cycle through the list of followers
			
			_troop = getUnit(0, Config.Troops[_i]);
			_dist = getDistance(me, _troop);
			
			if (_dist === 0 || _troop.area !== me.area)	{								// if follower is out of range or possibly in town or in another area
				me.overhead("A peep is too far or somewhere else. Going to town, so as to reset troops...");
				if (!me.intown) Town.goToTown();
				Town.doChores();
				delay(rand(10000,12000));
				Town.move("portalspot");
				delay(250);
				while(!(myTroops.TroopsInMyArea() >= (Config.Troops.length - Config.BObarb.Towners.length))) { delay(rand(2000,3000)); }	// wait for all the followers to be in the town that I am
				Pather.usePortal(null, me.name);
				delay(250);
				Pather.makePortal();
				delay(250);
				while(!(myTroops.TroopsInMyArea() >= (Config.Troops.length - Config.BObarb.Towners.length))) { Attack.clear(5, 0, false, false, true); }	// clear a small area while waiting for all the followers 
																																// to go to where I have gone
			}
			
			_troop = getUnit(0, Config.Troops[_i]);
			if(_troop === undefined) {
				_oorCount += 1;
				break;
			}
			_dist = getDistance(me, _troop);
			if (_dist > 50 || _troop.area !== me.area) _oorCount += 1;		// if follower's distance is further than 50 or possibly in town or in another area
			me.overhead("The distance between us is: " + _dist + " | _oorCount: " + _oorCount);
			delay(rand(450,1100));
		}

		if(_oorCount > 0) return false;	// false: one or more followers is out of range or in another area
		return true;					// true: all the followers are in position
	},
	prepTroops: function (_waypoint, _pause) {		// instructs bo barb to follow ldr and followers to a waypoint for a bo
		me.overhead("Prepping troops...");
		delay(rand(4000,8000));
		me.overhead("me.hpmax: " + me.hpmax + " | Config.meHPmaxOrig: " + Config.meHPmaxOrig); // Config.debugChat
		delay(rand(2000,3000));
		me.overhead("Config.Troops.length: " + Config.Troops.length);
		
		Town.goToTown(4);
		say("yo");
		Town.doChores();
		Pather.moveTo("waypoint");
		delay(rand(10000,12000));
		
		if(!Pather.useWaypoint(_waypoint)) return false;				// head to _waypoint
		Pather.moveTo(me.x + rand(-5, 5) * 2, me.y + rand(-5, 5) * 2);	// move a wee bit, so as to not be on wp
		Pather.makePortal();
		while(!(myTroops.TroopsInMyArea() === Config.Troops.length)) { delay(2000); }						// wait for the barb and the two sorcies to come to river
		
		me.overhead("...everybody is in and waiting...");
		delay(18000);
		say("hulk");
		delay(7000);
		if(1) { 											// Config.chatDebug
			me.overhead("me.hpmax: " + me.hpmax + " | Config.meHPmaxOrig: " + Config.meHPmaxOrig);
			delay(2750);
		}
		if(_pause) {
			say(Config.BObarb.Towners[0] + " yo-yo");
			delay(rand(5000,6000));
			//say(Config.Troops[0]  + " yo-yo");
		}
		
		while(!(myTroops.TroopsInMyArea() >= (Config.Troops.length - Config.BObarb.Towners.length))) { 		// check if everyone is in the same area & near, if not pause 'til they are
			me.overhead("...someone has left our area or is out of range. We'll stay put 'til they return.");
			Attack.clear(10, 0, false, false, true);					// clear: function (range, spectype, bossId, sortfunc, pickit)
			delay(1000); 
		}
					
		me.overhead("...everybody is in or nearby. We can do it!");
		return true;
	},
	gatherSkellies: function () {			// solely for gathering a handful of skellies
		if(me.classid != 2) return false;				// not a necro, return back to main script
		
		delay(rand(4000,8700));
		Town.goToTown(4);
		myTroops.prepTroops(107, false); 
		Town.goToTown();
		
		while(!(myTroops.TroopsInMyArea() === Config.Troops.length)) { delay(rand(1500,3000)); } 		// wait for all to come back to me
		me.overhead("Heading to gather skellies...");
		delay(rand(3000,4700));
		Town.goToTown(5);
		
		while(!(myTroops.TroopsInMyArea() >= (Config.Troops.length - Config.BObarb.Towners.length))) { delay(rand(1500,3000)); } 	// wait for followers to come to me
		delay(rand(6000,8000));
		
		if(!Pather.useWaypoint(111)) return false;					// head to Frigid Highlands wp
		delay(250);
		Pather.makePortal();
		
		Precast.doPrecast(true);
		while(!(myTroops.TroopsInMyArea() >= (Config.Troops.length - Config.BObarb.Towners.length))) { 	// check if everyone is in the same area & near, if not pause 'til they are
			me.overhead("...someone has left our area or is out of range. We'll stay put 'til they return.");
			Attack.clear(8, 0, false, false, true);					// clear: function (range, spectype, bossId, sortfunc, pickit)
			delay(rand(500,750)); 
		}
		Pather.moveTo(3745, 5084, 3, true);
		Attack.clear(15, 0, getLocaleString(22500)); // Eldritch the Rectifier
		Attack.clear(10, 0, false, false, true);	
		Town.goToTown();
		
		delay(rand(4000,5000));
		return true;
	}
};
/*
	var _myAct;
	if((me.hpmax != Config.meHPmaxOrig) && (me.name === Config.BObarb.ldr)) {
		_myAct = me.act;
		me.overhead("Oops... Ran out of kale sauce enhancer...");
		myTroops.prepTroops(107, true);
		Town.goToTown(_myAct);
		while(!(myTroops.TroopsInMyArea() >= (Config.Troops.length - 1))) { delay(2000); }
		Town.move("portalspot");
		Pather.usePortal(null, me.name);
		Pather.makePortal();
		while(!(myTroops.TroopsInMyArea() >= (Config.Troops.length - 1))) { delay(2000); }
	}
*/
