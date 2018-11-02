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
*   
*	classid: 0-zon 1-sorc 2: necro 3-pali 4-druid 5-barb 6: sin
*/


function MajorTom() {
	
	const LOCAL_CHAT_ID = 0xd2baaaa;
	// collection of variables
	//
	Config.meHPmaxOrig 		= me.hpmax;							// store the original hpnax of ldr as a chkpt for bo wearing off
	Config.debugChat 		= false;	 						// for when wishing to disable my extra chattinesses
	var _myTeleSorc 		= Config.Troops[1];					// sorc which will tele to chaos ctr
	var _myBObarb 			= Config.Troops[0];
	var _barbStop 			= false;
	// Config.BObarb.Towners : [bo barb, druid] : peeps who cannot tele
	
	var command, hostile, nick, spot, tick, s, m,
		startTime = getTickCount(),
		greet = [];
	
	var failTimer = 120;
	
	
	// my main necro as a leader thingies...
	myTroops.my_townThings(4, true, "waypoint", 10000, 12000, "wBoer", 10000, 16000);
	myTroops.gatherSkellies();
	
	me.overhead("We should have enough skellies to start something...");
	while(!(myTroops.TroopsInMyArea() === Config.Troops.length)) { delay(rand(1500,3000)); }
	delay(rand(10000,16000));
	me.overhead("Let's take this show on the road...");
	
	myLdrScipts.d2_ldrPindle(false);
	myLdrScipts.d2_fastD();
	myLdrScipts.d2_Nihlathak(false);		// false/true: prep troops
	
	myLdrScipts.d2_countess();
	myLdrScipts.d2_andy();
	myLdrScipts.d2_summoner();
	myLdrScipts.d2_duriel();
	myLdrScipts.d2_mephisto();
	myLdrScipts.d2_ldrBaal(_myTeleSorc);
	myLdrScipts.d2_abaddon();
	
	//myLdrScipts.d2_hallsofpain();
	//myLdrScipts.d2_hallsofvaught();
	//myLdrScipts.d2_ws2();
	//myLdrScipts.d2_diablo();
	
	myTroops.my_townThings(4, true, "waypoint", 15000, 20000, false);
	me.overhead("Done. Preparing to vacate the premises.");
	delay(rand(5000,7000));
	
	return true;
}
function d2_towners(_a) { // _a = "yo" "yoyo" "yo-yo"
	for(var _i = 0; _i < Config.BObarb.Towners.length; _i++) {
		say(Config.BObarb.Towners[_i] + " " + _a);
		delay(rand(2000,3000));
	}
	delay(rand(5000,6000));
	return true;
}	
