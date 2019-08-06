var exec = require('child_process').exec;

//Activate real canbus: can0
exec("sudo ip link set can0 up type can bitrate 500000", function(err, stdout, stderr){
   console.log('Activating can0...');
   console.log('stdout: '+ stdout);
   console.log('stderr: '+ stderr);
   if(err != null){
      console.log('error: '+ err);
   }else{
      console.log('Real CANBUS can0 activated.');
   }
});


var can = require('socketcan');
var fs = require('fs');

// Parse database
var network = can.parseNetworkDescription("./node_modules/socketcan/samples/can_definition_sample.kcd");
var channel = can.createRawChannel("can0");
var db_instr = new can.DatabaseService(channel, network.buses["Instrumentation"]);

channel.start();

// Register a listener to get any value changes
db_instr.messages["TankController"].signals["TankTemperature"].onChange(function(s) {
   console.log("Tank Temperature " + s.value);
});

// Register a listener to get any value updates
// db_motor.messages["Emission"].signals["Enginespeed"].onUpdate(function(s) {
//    console.log("Enginespeed " + s.value);
// });
