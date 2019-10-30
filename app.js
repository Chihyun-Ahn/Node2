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
      },
      {
         name: "House2Sen3",
         type: 11,
         pin: 4,
         temperature: 0,
         humidity: ""
      },
      {
         name: "House2Sen4",
         type: 11,
         pin: 17,
         temperature: 0,
         humidity: ""
      },
      {
         name: "House2Sen5",
         type: 11,
         pin: 27,
         temperature: 0,
         humidity: ""
      },
      {
         name: "House2Sen6",
         type: 11,
         pin: 22,
         temperature: 0,
         humidity: ""
      },

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
   
   db.messages["House2Temp"].signals["temperature1"].update(sensor.sensors[0].temperature);
   db.messages["House2Temp"].signals["temperature2"].update(sensor.sensors[1].temperature);
   db.messages["House2Temp"].signals["temperature3"].update(sensor.sensors[2].temperature);
   db.messages["House2Temp"].signals["temperature4"].update(sensor.sensors[3].temperature);
   db.messages["House2Temp"].signals["temperature5"].update(sensor.sensors[4].temperature);
   db.messages["House2Temp"].signals["temperature6"].update(sensor.sensors[5].temperature);
   db.messages["House2TempTime"].signals["sigTime"].update(getTimeInt());

   db.messages["House2Humid"].signals["humidity1"].update(sensor.sensors[0].humidity);
   db.messages["House2Humid"].signals["humidity2"].update(sensor.sensors[1].humidity);
   db.messages["House2Humid"].signals["humidity3"].update(sensor.sensors[2].humidity);
   db.messages["House2Humid"].signals["humidity4"].update(sensor.sensors[3].humidity);
   db.messages["House2Humid"].signals["humidity5"].update(sensor.sensors[4].humidity);
   db.messages["House2Humid"].signals["humidity6"].update(sensor.sensors[5].humidity);
   db.messages["House2HumidTime"].signals["sigTime"].update(getTimeInt());

   //Trigger sending messages
   db.send("House2Temp");
   db.send("House2Humid");
   db.send("House2TempTime");
   db.send("House2TempTime");

   for(i=0;i<6;i++){
      console.log(`센서${i+1}의 온도: ${sensor.sensors[i].temperature} 습도: ${sensor.sensors[i].humidity}`);
   }

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
   var nowInt = now * 1;
   return nowInt;
}
