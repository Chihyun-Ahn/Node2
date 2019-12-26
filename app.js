var gpio = require('onoff').Gpio;
var timeGetter = require('./getTime');
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

var ctrlElements = ['fan1', 'fan2', 'fan3', 'water', 'alarm', 'emgOutputForNeighbor'];
var ctrlData = [LOW,LOW,LOW,LOW,LOW,LOW];
var neighborDeadTimer, sendProbe;

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
         // console.log(
         //    this.sensors[a].name + ": " +this.sensors[a].temperature + "°C, " + this.sensors[a].humidity + "%"
         // );
      }
   }
};

setInterval(function(){
   sensor.read();  
   putSensorData("House2");
   sendSensorData("House2");

   for(i=0;i<6;i++){
      console.log(`센서${i+1}의 온도: ${sensor.sensors[i].temperature} 습도: ${sensor.sensors[i].humidity}`);
   }

   //Control Data
   console.log('House2 fan1:'+ctrlData[0]);

   //콘트롤 데이터 확인하여, 제어출력
   IOfan1.writeSync(ctrlData.fan1);
   IOfan2.writeSync(ctrlData.fan2);
   IOfan3.writeSync(ctrlData.fan3);
   IOwater.writeSync(ctrlData.water);
   IOalarm.writeSync(ctrlData.alarm);

   getCtrlData("House2");

}, 10000);

setNeighborDeadTimer();

// Neighbor Dead Timer function
function setNeighborDeadTimer(){
   neighborDeadTimer = setTimeout(function(){
      console.log('!!WARNING!! House1 not responding for 30s.');
      var i=1;
      db.send("AliveCheckByH2");
      console.log('Probe'+i+' has been sent.');
      sendProbe = setInterval(function(){
         i++;
         if(i<=3){
            db.send("AliveCheckByH2");
            console.log('Probe'+i+' has been sent.');
         }else if(i>3){
            clearInterval(sendProbe);
            emergentOper("House1");
         };
      }, 10000);
   }, 30000);   
}


//심장박동
db.messages["House1Temp"].signals["temperature2"].onUpdate(function(s){
   clearTimeout(neighborDeadTimer);
   console.log('timer cleared.');
   setNeighborDeadTimer();
});

function emergentOper(houseName){
   var houseNum = houseName[5];
   ctrlData[5] = HIGH; //5: emergency output for neighbor house
   console.log('House'+houseNum+' is dead!! emergency motor is ON!!');
}

db.messages["AliveCheckByH1"].signals["nodeID"].onUpdate(function(){
   console.log('Edge1 sent aliveCheck. Answer is sent. ');
   db.send("AliveAnsByH2");
});

db.messages["AliveAnsByH1"].signals["nodeID"].onUpdate(function(){
   clearInterval(sendProbe);
   ctrlData[5] = LOW;
   console.log('House1 is recovered. Emergency motor is OFF');
   setNeighborDeadTimer();
});

db.messages['AliveCheckH2ByFog'].signals['nodeID'].onUpdate(function(){
   console.log('Fog sent aliveCheck. Answer is sent.');
   db.send('AliveAnsToFogByH2');
});

function putSensorData(houseName){
   var houseTemp = houseName + "Temp";
   var houseHumid = houseName + "Humid";
   var houseMsgTime = houseName + "MsgTime";
   var tempNameGeneral = "temperature";
   var humidNameGeneral = "humidity";
   var i;
   for(i=0;i<6;i++){
      var tempNameSpecific = tempNameGeneral + (i+1);
      var humidNameSpecific = humidNameGeneral + (i+1);
      db.messages[houseTemp].signals[tempNameSpecific].update(sensor.sensors[i].temperature);
      db.messages[houseHumid].signals[humidNameSpecific].update(sensor.sensors[i].humidity);
   }
   db.messages[houseMsgTime].signals["sigTime"].update(timeGetter.now());
   console.log(houseMsgTime + ":" + db.messages[houseMsgTime].signals["sigTime"].value);
}

function sendSensorData(houseName){
   var rearNameVector = ["Temp", "Humid", "MsgTime"];
   var i;
   var msgName;
   for (i=0;i<3;i++){
      msgName = houseName + rearNameVector[i];
      db.send(msgName);
      if(i==2){
         console.log(db.messages[msgName].signals["sigTime"].value);
      };
   }

}

function getCtrlData(houseName){
   var msgName = houseName + "Ctrl";
   var i;
   for (i=0;i<ctrlElements.length;i++){
      ctrlData[i] = db.messages[msgName].signals[ctrlElements[i]].value;
   }
}

