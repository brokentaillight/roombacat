var _myAct, _myArea, _myX, _myY;
		while(me.hpmax != Config.meHPmaxOrig) {
			if((me.name != Config.BObarb.ldr) || (me.area != 123 && me.area != 124)) break;
			
			_myAct = me.act;
			_myArea = me.area;
			_myX = me.x;
			_myY = me.y;
			me.overhead("Oops... Ran out of kale sauce enhancer...");
			Town.goToTown();
			while(!(myTroops.TroopsInMyArea() >= (Config.Troops.length - 1))) { delay(2000); }
		
			myTroops.prepTroops(107, true);
			Town.goToTown(_myAct);
			while(!(myTroops.TroopsInMyArea() >= (Config.Troops.length - 1))) { delay(2000); }
			
			//Town.move("portalspot");
			if(_myArea === 123) Pather.useWaypoint(123);
			else if(_myArea === 124) {
				Pather.useWaypoint(123);
				delay(250);
				if (!Pather.moveToExit(124, true)) {
					throw new Error("Failed to go to Nihlathak");
				}
			}	
			Pather.makePortal();
			while(!(myTroops.TroopsInMyArea() >= (Config.Troops.length - 1))) { delay(2000); }
			Pather.moveTo(_myX,_myY);
		}
