var gpio = require('onoff').Gpio;
const IOfan1 = new gpio(16,'out');
const IOfan2 = new gpio(20,'out');
const IOfan3 = new gpio(5,'out');
const IOwater = new gpio(6,'out');
const IOalarm = new gpio(13,'out');
const HIGH = 1;
const LOW = 0;

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
const math = require('math');
// var fs = require('fs');

var sensorLib = require('node-dht-sensor');

// Parse database
var network = can.parseNetworkDescription("./node_modules/socketcan/samples/mycan_definition.kcd");
var channel = can.createRawChannel("can0");
var db = new can.DatabaseService(channel, network.buses["FarmBUS"]);
channel.start();
var ctrlData = {
   fan1: 0,
   fan2: 0,
   fan3: 0,
   water: 0,
   alarm: 0
};

var sensor = {
   sensors: [
      {
         name: "House2Sen1",
         type: 11,
         pin: 2,
         temperature: 0,
         humidity: ""
      },
      {
         name: "House2Sen2",
         type: 11,
         pin: 3,
         temperature: 0,
         humidity: ""
      }
   ],
   read: function(){
      for (var a in  this.sensors){
         var b = sensorLib.read(this.sensors[a].type, this.sensors[a].pin);
         this.sensors[a].temperature = b.temperature.toFixed(1);
         this.sensors[a].humidity = b.humidity.toFixed(1);
         console.log(
            this.sensors[a].name + ": " +this.sensors[a].temperature + "°C, " + this.sensors[a].humidity + "%"
         );

      }
   }
};

setInterval(function(){
   sensor.read();
   var sensorData = {
      temperature1 : 0,
      temperature2 : 0,
      humidity1: "",
      humidity2: "",
      sigTime: ""
   };

   sensorData.temperature1 = sensor.sensors[0].temperature;
   sensorData.temperature2 = sensor.sensors[1].temperature;
   sensorData.humidity1    = sensor.sensors[0].humidity;
   sensorData.humidity2    = sensor.sensors[1].humidity;
   sensorData.sigTime      = getTimeInt();
   console.log(sensorData.sigTime);

   db.messages["House2Stat"].signals["temperature1"].update(sensorData.temperature1);
   db.messages["House2Stat"].signals["temperature2"].update(sensorData.temperature2);
   db.messages["House2Stat"].signals["humidity1"].update(sensorData.humidity1);
   db.messages["House2Stat"].signals["humidity2"].update(sensorData.humidity2);
   db.messages["House2Stat"].signals["sigTime"].update(sensorData.sigTime);
   console.log(db.messages["House2Stat"].signals["sigTime"].value);
   //Trigger sending this message
   db.send("House2Stat");
   //Control Data
   console.log(ctrlData.fan1);

   //콘트롤 데이터 확인하여, 제어출력
   IOfan1.writeSync(ctrlData.fan1);
   IOfan2.writeSync(ctrlData.fan2);
   IOfan3.writeSync(ctrlData.fan3);
   IOwater.writeSync(ctrlData.water);
   IOalarm.writeSync(ctrlData.alarm);
}, 10000);

db.messages["House2Ctrl"].signals["fan1"].onUpdate(function(s){
   ctrlData.fan1 = s.value;
});
db.messages["House2Ctrl"].signals["fan2"].onUpdate(function(s){
   ctrlData.fan2 = s.value;
});
db.messages["House2Ctrl"].signals["fan3"].onUpdate(function(s){
   ctrlData.fan3 = s.value;
});
db.messages["House2Ctrl"].signals["water"].onUpdate(function(s){
   ctrlData.water = s.value;
});
db.messages["House2Ctrl"].signals["alarm"].onUpdate(function(s){
   ctrlData.alarm = s.value;
});


function getTimeInt(){
   var now = new Date();
   var nowInt = math.floor(now/1000);
   return nowInt;
}
